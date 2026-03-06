"""
Redis-based Rate Limiter for PhishBlocker
Supports per-IP and per-user rate limiting
"""

import time
import logging
from typing import Optional, Tuple
import redis

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(
        self, 
        redis_client: redis.Redis, 
        default_limit: int = 100, 
        window_seconds: int = 60
    ):
        """
        Initialize rate limiter
        
        Args:
            redis_client: Redis client
            default_limit: Maximum requests per window
            window_seconds: Time window in seconds
        """
        self.redis = redis_client
        self.default_limit = default_limit
        self.window = window_seconds

    async def is_allowed(self, key: str, limit: Optional[int] = None) -> Tuple[bool, int, int]:
        """
        Check if request is allowed for a given key
        
        Args:
            key: Unique key (e.g., IP address or user ID)
            limit: Optional override for the limit
            
        Returns:
            (is_allowed, remaining, reset_time)
        """
        if not self.redis:
            return True, 999, 0
            
        try:
            limit = limit or self.default_limit
            redis_key = f"rate_limit:{key}"
            
            # Use Redis pipeline for atomic operations
            pipe = self.redis.pipeline()
            now = time.time()
            
            # Sliding window using ZSET
            # Remove timestamps older than the window
            pipe.zremrangebyscore(redis_key, 0, now - self.window)
            # Add current request timestamp
            pipe.zadd(redis_key, {str(now): now})
            # Count requests in window
            pipe.zcard(redis_key)
            # Set TTL on the key
            pipe.expire(redis_key, self.window)
            
            results = pipe.execute()
            request_count = results[2]
            
            remaining = max(0, limit - request_count)
            is_allowed = request_count <= limit
            
            # Reset time is roughly 'now + window'
            reset_time = int(now + self.window)
            
            return is_allowed, remaining, reset_time
            
        except Exception as e:
            logger.error(f"Rate limiter error: {e}")
            return True, 0, 0
            
    async def get_stats(self, key: str) -> dict:
        """Get rate limit usage stats for a key"""
        if not self.redis:
            return {}
            
        try:
            redis_key = f"rate_limit:{key}"
            count = self.redis.zcard(redis_key)
            return {
                "count": count,
                "limit": self.default_limit,
                "window": self.window
            }
        except Exception as e:
            logger.error(f"Failed to get rate limit stats: {e}")
            return {}
