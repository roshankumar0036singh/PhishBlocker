"""
Homograph Attack Detector for PhishBlocker
Detects lookalike domains using Unicode confusables and mixed scripts
"""

import unicodedata
import logging
from typing import Dict, List, Any, Tuple, Optional
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


class HomographDetector:
    """
    Detect homograph attacks (lookalike domains)
    Examples: аpple.com (Cyrillic 'а'), g00gle.com (zeros instead of 'o')
    """
    
    def __init__(self):
        """Initialize homograph detector with confusable mappings"""
        
        # Common legitimate domains to check against
        self.legitimate_domains = [
            'google.com', 'facebook.com', 'amazon.com', 'microsoft.com',
            'apple.com', 'paypal.com', 'netflix.com', 'instagram.com',
            'twitter.com', 'linkedin.com', 'github.com', 'stackoverflow.com',
            'reddit.com', 'wikipedia.org', 'youtube.com', 'ebay.com'
        ]
        
        # Common confusable character mappings
        self.confusables = {
            # Cyrillic to Latin
            'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c',
            'у': 'y', 'х': 'x', 'і': 'i', 'ј': 'j', 'ѕ': 's',
            # Greek to Latin
            'α': 'a', 'β': 'b', 'ε': 'e', 'ι': 'i', 'ο': 'o',
            'ρ': 'p', 'τ': 't', 'υ': 'y', 'ν': 'v',
            # Numbers to letters
            '0': 'o', '1': 'i', '3': 'e', '5': 's', '7': 't',
            # Special characters
            'ℓ': 'l', 'ⅰ': 'i', 'ⅴ': 'v', 'ⅹ': 'x'
        }
        
        logger.info("Homograph detector initialized")
    
    def detect_homograph(self, url: str) -> Dict[str, Any]:
        """
        Detect homograph attack in URL
        
        Args:
            url: URL to check
            
        Returns:
            Detection results with details
        """
        try:
            # Parse URL to get domain
            parsed = urlparse(url)
            domain = parsed.hostname or parsed.netloc
            
            if not domain:
                return self._get_default_result()
            
            # Check for mixed scripts
            mixed_scripts = self._detect_mixed_scripts(domain)
            
            # Check for confusable characters
            confusable_chars = self._detect_confusables(domain)
            
            # Check similarity to legitimate domains
            similar_domain = self._find_similar_legitimate_domain(domain)
            
            # Determine if it's a homograph attack
            is_homograph = (
                mixed_scripts['is_mixed'] or
                len(confusable_chars) > 0 or
                similar_domain['is_similar']
            )
            
            # Calculate confidence
            confidence = self._calculate_confidence(
                mixed_scripts, confusable_chars, similar_domain
            )
            
            return {
                "is_homograph_attack": is_homograph,
                "confidence": confidence,
                "domain": domain,
                "mixed_scripts": mixed_scripts,
                "confusable_characters": confusable_chars,
                "similar_to": similar_domain,
                "risk_level": self._get_risk_level(confidence)
            }
            
        except Exception as e:
            logger.error(f"Error detecting homograph: {e}")
            return self._get_default_result()
    
    def _detect_mixed_scripts(self, domain: str) -> Dict[str, Any]:
        """
        Detect mixed scripts in domain name
        
        Args:
            domain: Domain name to check
            
        Returns:
            Mixed script detection results
        """
        scripts = set()
        script_chars = {}
        
        for char in domain:
            if char.isalpha():
                try:
                    script = unicodedata.name(char).split()[0]
                    scripts.add(script)
                    
                    if script not in script_chars:
                        script_chars[script] = []
                    script_chars[script].append(char)
                except:
                    pass
        
        is_mixed = len(scripts) > 1
        
        return {
            "is_mixed": is_mixed,
            "scripts_detected": list(scripts),
            "script_characters": script_chars,
            "script_count": len(scripts)
        }
    
    def _detect_confusables(self, domain: str) -> List[Dict[str, Any]]:
        """
        Detect confusable characters in domain
        
        Args:
            domain: Domain name to check
            
        Returns:
            List of confusable characters found
        """
        confusables_found = []
        
        for i, char in enumerate(domain):
            if char in self.confusables:
                confusables_found.append({
                    "character": char,
                    "position": i,
                    "looks_like": self.confusables[char],
                    "unicode": f"U+{ord(char):04X}",
                    "name": unicodedata.name(char, "UNKNOWN")
                })
        
        return confusables_found
    
    def _find_similar_legitimate_domain(self, domain: str) -> Dict[str, Any]:
        """
        Find if domain is similar to a legitimate domain
        
        Args:
            domain: Domain to check
            
        Returns:
            Similarity results
        """
        # Normalize domain by replacing confusables
        normalized = self._normalize_domain(domain)
        
        for legit_domain in self.legitimate_domains:
            # Check exact match after normalization
            if normalized == legit_domain:
                return {
                    "is_similar": True,
                    "legitimate_domain": legit_domain,
                    "similarity_type": "exact_after_normalization",
                    "normalized_domain": normalized
                }
            
            # Check if normalized domain contains legitimate domain
            if legit_domain in normalized and normalized != legit_domain:
                return {
                    "is_similar": True,
                    "legitimate_domain": legit_domain,
                    "similarity_type": "contains_legitimate",
                    "normalized_domain": normalized
                }
            
            # Check Levenshtein distance
            distance = self._levenshtein_distance(normalized, legit_domain)
            if distance <= 2:  # Allow up to 2 character differences
                return {
                    "is_similar": True,
                    "legitimate_domain": legit_domain,
                    "similarity_type": "levenshtein",
                    "distance": distance,
                    "normalized_domain": normalized
                }
        
        return {
            "is_similar": False,
            "legitimate_domain": None,
            "normalized_domain": normalized
        }
    
    def _normalize_domain(self, domain: str) -> str:
        """
        Normalize domain by replacing confusable characters
        
        Args:
            domain: Domain to normalize
            
        Returns:
            Normalized domain
        """
        normalized = domain.lower()
        
        for confusable, replacement in self.confusables.items():
            normalized = normalized.replace(confusable, replacement)
        
        return normalized
    
    def _levenshtein_distance(self, s1: str, s2: str) -> int:
        """
        Calculate Levenshtein distance between two strings
        
        Args:
            s1: First string
            s2: Second string
            
        Returns:
            Edit distance
        """
        if len(s1) < len(s2):
            return self._levenshtein_distance(s2, s1)
        
        if len(s2) == 0:
            return len(s1)
        
        previous_row = range(len(s2) + 1)
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row
        
        return previous_row[-1]
    
    def _calculate_confidence(
        self,
        mixed_scripts: Dict,
        confusables: List,
        similar_domain: Dict
    ) -> float:
        """Calculate confidence score for homograph detection"""
        confidence = 0.0
        
        # Mixed scripts add 0.4
        if mixed_scripts['is_mixed']:
            confidence += 0.4
        
        # Each confusable character adds 0.2 (max 0.6)
        confidence += min(len(confusables) * 0.2, 0.6)
        
        # Similarity to legitimate domain adds 0.5
        if similar_domain['is_similar']:
            confidence += 0.5
        
        return min(confidence, 1.0)
    
    def _get_risk_level(self, confidence: float) -> str:
        """Get risk level based on confidence"""
        if confidence >= 0.7:
            return "High"
        elif confidence >= 0.4:
            return "Medium"
        else:
            return "Low"
    
    def _get_default_result(self) -> Dict[str, Any]:
        """Get default result for errors"""
        return {
            "is_homograph_attack": False,
            "confidence": 0.0,
            "domain": "",
            "mixed_scripts": {"is_mixed": False, "scripts_detected": []},
            "confusable_characters": [],
            "similar_to": {"is_similar": False},
            "risk_level": "Low"
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get detector statistics"""
        return {
            "legitimate_domains_count": len(self.legitimate_domains),
            "confusable_mappings_count": len(self.confusables),
            "status": "active"
        }


# Global instance
_homograph_detector: Optional[HomographDetector] = None


def get_homograph_detector() -> Optional[HomographDetector]:
    """Get global homograph detector instance"""
    global _homograph_detector
    return _homograph_detector


def init_homograph_detector() -> HomographDetector:
    """Initialize global homograph detector"""
    global _homograph_detector
    if _homograph_detector is None:
        _homograph_detector = HomographDetector()
    return _homograph_detector
