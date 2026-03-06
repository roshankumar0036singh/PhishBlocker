"""
Enhanced SSL/TLS Certificate Analyzer for PhishBlocker
Analyzes certificate validity, age, issuer reputation, and transparency logs
"""

import ssl
import socket
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from urllib.parse import urlparse
import hashlib

logger = logging.getLogger(__name__)


class SSLCertificateAnalyzer:
    """
    Advanced SSL/TLS certificate analysis
    Detects suspicious certificates often used in phishing
    """
    
    def __init__(self):
        """Initialize SSL certificate analyzer"""
        
        # Trusted certificate authorities
        self.trusted_cas = [
            'Let\'s Encrypt', 'DigiCert', 'Comodo', 'GeoTrust',
            'GlobalSign', 'Sectigo', 'Amazon', 'Google Trust Services',
            'ZeroSSL', 'GoDaddy', 'TrustWave'
        ]
        
        # Free or DV-only CAs often abused for temporary phishing sites
        self.free_cas = [
            'Let\'s Encrypt', 'ZeroSSL', 'Cloudflare Inc ECC CA', 'Buypass'
        ]
        
        # Suspicious certificate indicators
        self.suspicious_issuers = [
            'self-signed', 'unknown', 'localhost'
        ]
        
        logger.info("SSL certificate analyzer initialized")
    
    def analyze_certificate(self, url: str) -> Dict[str, Any]:
        """
        Analyze SSL certificate for URL
        
        Args:
            url: URL to analyze
            
        Returns:
            Certificate analysis results
        """
        try:
            parsed = urlparse(url)
            hostname = parsed.hostname
            port = parsed.port or 443
            
            if not hostname or parsed.scheme != 'https':
                return self._get_no_ssl_result()
            
            # Get certificate
            cert_info = self._get_certificate(hostname, port)
            
            if not cert_info:
                return self._get_invalid_cert_result()
            
            # Analyze certificate
            validity = self._check_validity(cert_info)
            age = self._calculate_age(cert_info)
            issuer_trust = self._check_issuer(cert_info)
            is_free_ca = self._is_free_ca(cert_info)
            subject_match = self._check_subject_match(cert_info, hostname)
            
            # Calculate risk score
            risk_score = self._calculate_risk_score(
                validity, age, issuer_trust, subject_match, is_free_ca
            )
            
            return {
                "has_ssl": True,
                "is_valid": validity['is_valid'],
                "validity_details": validity,
                "certificate_age_days": age,
                "issuer": cert_info.get('issuer', {}),
                "issuer_trusted": issuer_trust,
                "is_free_ca": is_free_ca,
                "subject_matches_hostname": subject_match,
                "subject_alt_names": self._get_sans(cert_info),
                "risk_score": risk_score,
                "risk_level": self._get_risk_level(risk_score),
                "warnings": self._get_warnings(validity, age, issuer_trust, subject_match, is_free_ca)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing certificate: {e}")
            return self._get_error_result()
    
    def _get_certificate(self, hostname: str, port: int) -> Optional[Dict]:
        """
        Retrieve SSL certificate from hostname
        
        Args:
            hostname: Hostname to check
            port: Port number
            
        Returns:
            Certificate information or None
        """
        try:
            context = ssl.create_default_context()
            
            with socket.create_connection((hostname, port), timeout=5) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    return cert
                    
        except Exception as e:
            logger.debug(f"Could not retrieve certificate for {hostname}: {e}")
            return None
    
    def _check_validity(self, cert: Dict) -> Dict[str, Any]:
        """Check certificate validity period"""
        try:
            not_before = datetime.strptime(cert['notBefore'], '%b %d %H:%M:%S %Y %Z')
            not_after = datetime.strptime(cert['notAfter'], '%b %d %H:%M:%S %Y %Z')
            now = datetime.now()
            
            is_valid = not_before <= now <= not_after
            days_until_expiry = (not_after - now).days
            
            return {
                "is_valid": is_valid,
                "not_before": not_before.isoformat(),
                "not_after": not_after.isoformat(),
                "days_until_expiry": days_until_expiry,
                "is_expired": now > not_after,
                "is_not_yet_valid": now < not_before
            }
            
        except Exception as e:
            logger.error(f"Error checking validity: {e}")
            return {
                "is_valid": False,
                "error": str(e)
            }
    
    def _calculate_age(self, cert: Dict) -> int:
        """Calculate certificate age in days"""
        try:
            not_before = datetime.strptime(cert['notBefore'], '%b %d %H:%M:%S %Y %Z')
            age = (datetime.now() - not_before).days
            return age
            
        except Exception as e:
            logger.error(f"Error calculating age: {e}")
            return -1
    
    def _is_free_ca(self, cert: Dict) -> bool:
        """Check if issuer is a free CA"""
        try:
            issuer = cert.get('issuer', ())
            # issuer is a tuple of tuples: ((('commonName', 'val'),), ...)
            issuer_str = str(issuer).lower()
            
            for free_ca in self.free_cas:
                if free_ca.lower() in issuer_str:
                    return True
            return False
        except Exception:
            return False

    def _check_issuer(self, cert: Dict) -> bool:
        """Check if issuer is trusted"""
        try:
            issuer = cert.get('issuer', ())
            issuer_str = str(issuer).lower()
            
            # Check if any trusted CA is in issuer
            for trusted_ca in self.trusted_cas:
                if trusted_ca.lower() in issuer_str:
                    return True
            
            # Check for suspicious issuers
            for suspicious in self.suspicious_issuers:
                if suspicious.lower() in issuer_str:
                    return False
            
            return False
            
        except Exception as e:
            logger.error(f"Error checking issuer: {e}")
            return False
            
    def _get_sans(self, cert: Dict) -> list:
        """Extract Subject Alternative Names"""
        sans = []
        try:
            alt_names = cert.get('subjectAltName', ())
            for type, value in alt_names:
                if type == 'DNS':
                    sans.append(value)
            return sans
        except Exception:
            return []
    
    def _check_subject_match(self, cert: Dict, hostname: str) -> bool:
        """Check if certificate subject or SAN matches hostname"""
        try:
            # Check Common Name (CN)
            subject = cert.get('subject', ())
            subject_cn = None
            
            # subject is a tuple of RDNs, each RDN is a tuple of (name, value) tuples
            for rdn in subject:
                for name, value in rdn:
                    if name == 'commonName':
                        subject_cn = value
                        break
                if subject_cn:
                    break
            
            h_lower = hostname.lower()
            
            if subject_cn and (h_lower in subject_cn.lower() or subject_cn.lower() in h_lower):
                return True
                
            # Check Subject Alternative Names (SAN)
            sans = self._get_sans(cert)
            for san in sans:
                san_lower = san.lower()
                # Simple wildcard check
                if san_lower.startswith('*.'):
                    suffix = san_lower[2:]
                    if h_lower.endswith(suffix):
                        return True
                elif san_lower == h_lower:
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error checking subject match: {e}")
            return False
    
    def _calculate_risk_score(
        self,
        validity: Dict,
        age: int,
        issuer_trusted: bool,
        subject_match: bool,
        is_free_ca: bool
    ) -> float:
        """Calculate overall risk score"""
        risk = 0.0
        
        # Invalid certificate
        if not validity.get('is_valid'):
            risk += 0.5
        
        # Free CA + New Certificate = High suspicious (common in phishing)
        if is_free_ca and age >= 0 and age < 30:
            risk += 0.4
        elif age >= 0 and age < 7:
            risk += 0.3
        
        # Untrusted issuer
        if not issuer_trusted:
            risk += 0.3
        
        # Subject doesn't match hostname
        if not subject_match:
            risk += 0.4
        
        # Expiring soon (< 15 days)
        if validity.get('days_until_expiry', 365) < 15:
            risk += 0.1
        
        return min(risk, 1.0)
    
    def _get_risk_level(self, risk_score: float) -> str:
        """Get risk level from score"""
        if risk_score >= 0.7:
            return "High"
        elif risk_score >= 0.4:
            return "Medium"
        else:
            return "Low"
    
    def _get_warnings(
        self,
        validity: Dict,
        age: int,
        issuer_trusted: bool,
        subject_match: bool,
        is_free_ca: bool
    ) -> list:
        """Get list of warnings"""
        warnings = []
        
        if not validity.get('is_valid'):
            if validity.get('is_expired'):
                warnings.append("Certificate has expired")
            elif validity.get('is_not_yet_valid'):
                warnings.append("Certificate is not yet valid")
        
        if is_free_ca and age >= 0 and age < 30:
            warnings.append(f"Recently issued Free DV Certificate ({age} days old)")
        elif age >= 0 and age < 7:
            warnings.append(f"Certificate is very new ({age} days old)")
        
        if not issuer_trusted:
            warnings.append("Certificate issuer is not recognized as trusted")
        
        if not subject_match:
            warnings.append("Certificate subject/SAN does not match hostname")
        
        if validity.get('days_until_expiry', 365) < 15:
            warnings.append(f"Certificate expires soon ({validity['days_until_expiry']} days)")
        
        return warnings
    
    def _get_no_ssl_result(self) -> Dict[str, Any]:
        """Result for non-HTTPS URLs"""
        return {
            "has_ssl": False,
            "is_valid": False,
            "risk_score": 0.5,
            "risk_level": "Medium",
            "warnings": ["No SSL/TLS encryption (HTTP only)"]
        }
    
    def _get_invalid_cert_result(self) -> Dict[str, Any]:
        """Result for invalid certificates"""
        return {
            "has_ssl": True,
            "is_valid": False,
            "risk_score": 0.8,
            "risk_level": "High",
            "warnings": ["Could not retrieve or validate certificate"]
        }
    
    def _get_error_result(self) -> Dict[str, Any]:
        """Result for errors"""
        return {
            "has_ssl": False,
            "is_valid": False,
            "risk_score": 0.0,
            "risk_level": "Unknown",
            "warnings": ["Error analyzing certificate"]
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get analyzer statistics"""
        return {
            "trusted_cas_count": len(self.trusted_cas),
            "status": "active"
        }


# Global instance
_ssl_analyzer: Optional[SSLCertificateAnalyzer] = None


def get_ssl_analyzer() -> Optional[SSLCertificateAnalyzer]:
    """Get global SSL analyzer instance"""
    global _ssl_analyzer
    return _ssl_analyzer


def init_ssl_analyzer() -> SSLCertificateAnalyzer:
    """Initialize global SSL analyzer"""
    global _ssl_analyzer
    if _ssl_analyzer is None:
        _ssl_analyzer = SSLCertificateAnalyzer()
    return _ssl_analyzer
