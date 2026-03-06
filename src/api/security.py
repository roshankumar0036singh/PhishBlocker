"""
Rate Limiting and Security Middleware for PhishBlocker
Protects against abuse and ensures fair usage
"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, HTTPException
from typing import Callable
import logging
import re
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


# ===================================
# Rate Limiter Configuration
# ===================================

# Initialize rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute", "1000/hour"],
    storage_uri="memory://",  # Use Redis in production
    strategy="fixed-window"
)


# ===================================
# Input Validation
# ===================================

class InputValidator:
    """
    Enhanced input validation for security
    """
    
    # Dangerous patterns
    DANGEROUS_PATTERNS = [
        r'<script[^>]*>.*?</script>',  # XSS
        r'javascript:',  # JavaScript protocol
        r'on\w+\s*=',  # Event handlers
        r'<iframe',  # Iframes
        r'eval\(',  # Eval
        r'expression\(',  # CSS expressions
        r'\.\./\.\.',  # Path traversal
        r'%00',  # Null byte
        r'union.*select',  # SQL injection
        r'drop\s+table',  # SQL injection
    ]
    
    # Maximum lengths
    MAX_URL_LENGTH = 2048
    MAX_FEEDBACK_LENGTH = 1000
    MAX_USER_ID_LENGTH = 255
    
    @staticmethod
    def validate_url(url: str) -> tuple[bool, str]:
        """
        Validate URL for security
        
        Args:
            url: URL to validate
            
        Returns:
            (is_valid, error_message)
        """
        # Check length
        if len(url) > InputValidator.MAX_URL_LENGTH:
            return False, f"URL too long (max {InputValidator.MAX_URL_LENGTH} characters)"
        
        # Check for dangerous patterns
        for pattern in InputValidator.DANGEROUS_PATTERNS:
            if re.search(pattern, url, re.IGNORECASE):
                return False, "URL contains potentially malicious content"
        
        # Validate URL format
        try:
            parsed = urlparse(url)
            if not parsed.scheme or not parsed.netloc:
                return False, "Invalid URL format"
            
            # Only allow http/https
            if parsed.scheme not in ['http', 'https']:
                return False, "Only HTTP/HTTPS URLs are allowed"
                
        except Exception as e:
            return False, f"URL parsing error: {str(e)}"
        
        return True, ""
    
    @staticmethod
    def validate_user_id(user_id: str) -> tuple[bool, str]:
        """Validate user ID"""
        if not user_id:
            return True, ""  # Optional field
        
        if len(user_id) > InputValidator.MAX_USER_ID_LENGTH:
            return False, f"User ID too long (max {InputValidator.MAX_USER_ID_LENGTH} characters)"
        
        # Only allow alphanumeric, hyphens, underscores
        if not re.match(r'^[a-zA-Z0-9_-]+$', user_id):
            return False, "User ID contains invalid characters"
        
        return True, ""
    
    @staticmethod
    def validate_feedback(feedback: str) -> tuple[bool, str]:
        """Validate feedback text"""
        if len(feedback) > InputValidator.MAX_FEEDBACK_LENGTH:
            return False, f"Feedback too long (max {InputValidator.MAX_FEEDBACK_LENGTH} characters)"
        
        # Check for dangerous patterns
        for pattern in InputValidator.DANGEROUS_PATTERNS:
            if re.search(pattern, feedback, re.IGNORECASE):
                return False, "Feedback contains potentially malicious content"
        
        return True, ""
    
    @staticmethod
    def sanitize_string(text: str) -> str:
        """Sanitize string by removing dangerous characters"""
        # Remove null bytes
        text = text.replace('\x00', '')
        
        # Remove control characters except newline and tab
        text = ''.join(char for char in text if ord(char) >= 32 or char in '\n\t')
        
        return text.strip()


# ===================================
# Security Headers Middleware
# ===================================

async def add_security_headers(request: Request, call_next: Callable):
    """
    Add security headers to all responses
    """
    response = await call_next(request)
    
    # Security headers
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = "default-src 'self'"
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
    
    return response


# ===================================
# Request Logging Middleware
# ===================================

async def log_requests(request: Request, call_next: Callable):
    """
    Log all requests for security auditing
    """
    import time
    
    start_time = time.time()
    
    # Log request
    logger.info(f"Request: {request.method} {request.url.path} from {request.client.host}")
    
    # Process request
    response = await call_next(request)
    
    # Log response
    duration = time.time() - start_time
    logger.info(f"Response: {response.status_code} in {duration:.3f}s")
    
    return response


# ===================================
# IP Blocking
# ===================================

class IPBlocker:
    """
    Block suspicious IP addresses
    """
    
    def __init__(self):
        self.blocked_ips = set()
        self.suspicious_ips = {}  # IP -> count
        self.threshold = 100  # Requests before blocking
    
    def is_blocked(self, ip: str) -> bool:
        """Check if IP is blocked"""
        return ip in self.blocked_ips
    
    def record_request(self, ip: str):
        """Record request from IP"""
        if ip not in self.suspicious_ips:
            self.suspicious_ips[ip] = 0
        
        self.suspicious_ips[ip] += 1
        
        # Block if threshold exceeded
        if self.suspicious_ips[ip] > self.threshold:
            self.blocked_ips.add(ip)
            logger.warning(f"Blocked IP: {ip} (exceeded threshold)")
    
    def unblock_ip(self, ip: str):
        """Unblock IP"""
        if ip in self.blocked_ips:
            self.blocked_ips.remove(ip)
            logger.info(f"Unblocked IP: {ip}")
    
    def get_stats(self) -> dict:
        """Get blocker statistics"""
        return {
            "blocked_ips_count": len(self.blocked_ips),
            "suspicious_ips_count": len(self.suspicious_ips),
            "threshold": self.threshold
        }


# Global IP blocker
ip_blocker = IPBlocker()


# ===================================
# Rate Limit Decorators
# ===================================

def strict_rate_limit(limit: str):
    """
    Strict rate limit decorator
    
    Args:
        limit: Rate limit string (e.g., "10/minute")
    """
    def decorator(func):
        return limiter.limit(limit)(func)
    return decorator


def api_key_required(func):
    """
    Require API key for endpoint
    """
    async def wrapper(request: Request, *args, **kwargs):
        api_key = request.headers.get("X-API-Key")
        
        if not api_key:
            raise HTTPException(status_code=401, detail="API key required")
        
        # Validate API key (implement your validation logic)
        # For now, just check if it exists
        if len(api_key) < 32:
            raise HTTPException(status_code=401, detail="Invalid API key")
        
        return await func(request, *args, **kwargs)
    
    return wrapper


logger.info("Rate limiting and security middleware initialized")
