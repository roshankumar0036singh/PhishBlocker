"""
Real-Time Threat Intelligence Aggregator for PhishBlocker
Integrates multiple threat feeds for enhanced detection
"""

import asyncio
import httpx
import logging
import os
import urllib.parse
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import hashlib

logger = logging.getLogger(__name__)


class ThreatIntelligenceAggregator:
    """
    Aggregate threat intelligence from multiple sources
    Sources: PhishTank, OpenPhish, URLhaus, Custom feeds
    """
    
    def __init__(self, cache_ttl_minutes: int = 60):
        """
        Initialize threat intelligence aggregator
        
        Args:
            cache_ttl_minutes: Cache TTL in minutes
        """
        self.cache_ttl = timedelta(minutes=cache_ttl_minutes)
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.live_cache: Dict[str, Dict[str, Any]] = {} # Cache for on-demand API lookups
        self.last_update: Optional[datetime] = None
        
        # External APIs
        self.safebrowsing_key = os.environ.get("GOOGLE_SAFE_BROWSING_API_KEY")
        self.virustotal_key = os.environ.get("VIRUSTOTAL_API_KEY")
        
        # Threat feed sources
        self.sources = {
            'phishtank': {
                'url': 'https://raw.githubusercontent.com/ProKn1fe/phishtank-database/master/online-valid.json',
                'enabled': True,
                'weight': 0.9  # High confidence
            },
            'openphish': {
                'url': 'https://raw.githubusercontent.com/openphish/public_feed/main/feed.txt',
                'enabled': True,
                'weight': 0.85
            }
        }
        
        # Statistics
        self.stats = {
            'total_threats': 0,
            'cache_hits': 0,
            'cache_misses': 0,
            'last_sync': None
        }
        
        logger.info(f"Threat intelligence aggregator initialized with {cache_ttl_minutes}min cache")
    
    async def check_url(self, url: str) -> Dict[str, Any]:
        """
        Check URL against threat intelligence feeds
        
        Args:
            url: URL to check
            
        Returns:
            Threat intelligence results
        """
        try:
            # Update feeds if stale
            if self._is_cache_stale():
                await self.update_feeds()
            
            # Generate URL hash for lookup
            url_hash = self._hash_url(url)
            
            # 1. Check offline curated lists cache
            if url_hash in self.cache:
                self.stats['cache_hits'] += 1
                threat_data = self.cache[url_hash]
                
                return {
                    "is_known_threat": True,
                    "threat_type": threat_data.get('type', 'phishing'),
                    "source": threat_data.get('source'),
                    "first_seen": threat_data.get('first_seen'),
                    "confidence": threat_data.get('confidence', 1.0),
                    "last_updated": self.last_update,
                    "details": threat_data.get('details', {})
                }
                
            # 2. Check live API lookups cache
            if url_hash in self.live_cache and self.live_cache[url_hash]['expires_at'] > datetime.now():
                self.stats['cache_hits'] += 1
                return self.live_cache[url_hash]['data']
            
            self.stats['cache_misses'] += 1
            
            # 3. Perform live API lookups concurrently
            api_tasks = []
            if self.safebrowsing_key:
                api_tasks.append(self._check_safebrowsing(url))
            if self.virustotal_key:
                api_tasks.append(self._check_virustotal(url))
                
            if api_tasks:
                results = await asyncio.gather(*api_tasks, return_exceptions=True)
                for res in results:
                    if isinstance(res, dict) and res.get("is_known_threat"):
                        # Cache positive hit
                        self.live_cache[url_hash] = {
                            'data': res,
                            'expires_at': datetime.now() + self.cache_ttl
                        }
                        return res
            
            # Cache negative result for a shorter time (1 min) to prevent spam
            default_res = {
                "is_known_threat": False,
                "threat_type": None,
                "source": None,
                "confidence": 0.0,
                "last_updated": datetime.now()
            }
            self.live_cache[url_hash] = {
                'data': default_res,
                'expires_at': datetime.now() + timedelta(minutes=1)
            }
            
            return default_res
            
        except Exception as e:
            logger.error(f"Error checking threat intelligence: {e}")
            return self._get_default_result()
    
    async def update_feeds(self):
        """Update threat intelligence feeds from all sources"""
        try:
            logger.info("Updating threat intelligence feeds...")
            
            async with httpx.AsyncClient(
                timeout=30.0, 
                follow_redirects=True,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
            ) as client:
                tasks = []
                
                for source_name, source_config in self.sources.items():
                    if source_config['enabled']:
                        if source_name == 'phishtank':
                            tasks.append(self._fetch_phishtank(client, source_config))
                        elif source_name == 'openphish':
                            tasks.append(self._fetch_openphish(client, source_config))
                
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # Process results
                total_added = 0
                for result in results:
                    if isinstance(result, int):
                        total_added += result
                    elif isinstance(result, Exception):
                        logger.error(f"Feed update error: {result}")
                
                self.last_update = datetime.now()
                self.stats['total_threats'] = len(self.cache)
                self.stats['last_sync'] = self.last_update
                
                logger.info(f"Threat feeds updated: {total_added} new threats, {len(self.cache)} total")
                
        except Exception as e:
            logger.error(f"Error updating threat feeds: {e}")
    async def _fetch_phishtank(self, client: httpx.AsyncClient, config: Dict) -> int:
        """
        Fetch PhishTank feed
        
        Args:
            client: HTTP client
            config: Source configuration
            
        Returns:
            Number of threats added
        """
        try:
            response = await client.get(config['url'])
            response.raise_for_status()
            
            added = 0
            if config['url'].endswith('.json'):
                data = response.json()
                for entry in data:
                    url = entry.get('url')
                    if url:
                        url_hash = self._hash_url(url)
                        self.cache[url_hash] = {
                            'url': url,
                            'source': 'phishtank',
                            'type': 'phishing',
                            'confidence': config['weight'],
                            'first_seen': entry.get('submission_time'),
                            'details': {
                                'phish_id': entry.get('phish_id'),
                                'target': entry.get('target'),
                                'verified': entry.get('verified')
                            }
                        }
                        added += 1
            else:
                # Handle as plain text feed
                urls = response.text.strip().split('\n')
                for url in urls:
                    url = url.strip()
                    if url and not url.startswith('#'):
                        url_hash = self._hash_url(url)
                        self.cache[url_hash] = {
                            'url': url,
                            'source': 'phishtank',
                            'type': 'phishing',
                            'confidence': config['weight'],
                            'first_seen': datetime.now().isoformat(),
                            'details': {}
                        }
                        added += 1
            
            logger.info(f"PhishTank: Added {added} threats")
            return added
            
        except Exception as e:
            logger.error(f"Error fetching PhishTank: {e}")
            return 0
    
    async def _fetch_openphish(self, client: httpx.AsyncClient, config: Dict) -> int:
        """
        Fetch OpenPhish feed
        
        Args:
            client: HTTP client
            config: Source configuration
            
        Returns:
            Number of threats added
        """
        try:
            response = await client.get(config['url'])
            response.raise_for_status()
            
            urls = response.text.strip().split('\n')
            added = 0
            
            for url in urls:
                url = url.strip()
                if url:
                    url_hash = self._hash_url(url)
                    self.cache[url_hash] = {
                        'url': url,
                        'source': 'openphish',
                        'type': 'phishing',
                        'confidence': config['weight'],
                        'first_seen': datetime.now().isoformat(),
                        'details': {}
                    }
                    added += 1
            
            logger.info(f"OpenPhish: Added {added} threats")
            return added
            
        except Exception as e:
            logger.error(f"Error fetching OpenPhish: {e}")
            return 0
            
    async def _check_safebrowsing(self, url: str) -> Dict[str, Any]:
        """Query Google Safe Browsing API"""
        if not self.safebrowsing_key:
            return self._get_default_result()
            
        try:
            api_url = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={self.safebrowsing_key}"
            payload = {
                "client": {
                    "clientId": "phishblocker",
                    "clientVersion": "1.0"
                },
                "threatInfo": {
                    "threatTypes": ["UNWANTED_SOFTWARE", "MALWARE", "SOCIAL_ENGINEERING"],
                    "platformTypes": ["ANY_PLATFORM"],
                    "threatEntryTypes": ["URL"],
                    "threatEntries": [
                        {"url": url}
                    ]
                }
            }
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(api_url, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    if "matches" in data and len(data["matches"]) > 0:
                        return {
                            "is_known_threat": True,
                            "threat_type": data["matches"][0].get("threatType", "phishing").lower(),
                            "source": "google_safe_browsing",
                            "first_seen": datetime.now().isoformat(),
                            "confidence": 0.95,
                            "last_updated": datetime.now(),
                            "details": {"match": data["matches"][0]}
                        }
        except Exception as e:
            logger.error(f"Error checking Safe Browsing API: {e}")
            
        return self._get_default_result()
        
    async def _check_virustotal(self, url: str) -> Dict[str, Any]:
        """Query VirusTotal API v3"""
        if not self.virustotal_key:
            return self._get_default_result()
            
        try:
            # VT API requires URL to be base64url encoded without padding
            import base64
            url_id = base64.urlsafe_b64encode(url.encode()).decode().strip("=")
            api_url = f"https://www.virustotal.com/api/v3/urls/{url_id}"
            
            headers = {
                "x-apikey": self.virustotal_key
            }
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(api_url, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    try:
                        stats = data["data"]["attributes"]["last_analysis_stats"]
                        malicious = stats.get("malicious", 0)
                        suspicious = stats.get("suspicious", 0)
                        
                        if malicious > 0 or suspicious > 2:
                            return {
                                "is_known_threat": True,
                                "threat_type": "malicious" if malicious > 0 else "suspicious",
                                "source": "virustotal",
                                "first_seen": datetime.now().isoformat(),
                                "confidence": min((malicious + suspicious * 0.5) / 5.0, 0.95),
                                "last_updated": datetime.now(),
                                "details": {"stats": stats}
                            }
                    except KeyError:
                        pass
        except Exception as e:
            logger.error(f"Error checking VirusTotal API: {e}")
            
        return self._get_default_result()
    
    def _is_cache_stale(self) -> bool:
        """Check if cache needs refresh"""
        if not self.last_update:
            return True
        return datetime.now() - self.last_update > self.cache_ttl
    
    def _hash_url(self, url: str) -> str:
        """Generate hash for URL"""
        return hashlib.sha256(url.lower().encode()).hexdigest()
    
    def _get_default_result(self) -> Dict[str, Any]:
        """Get default result for errors"""
        return {
            "is_known_threat": False,
            "threat_type": None,
            "source": None,
            "confidence": 0.0
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get aggregator statistics"""
        cache_requests = self.stats['cache_hits'] + self.stats['cache_misses']
        hit_rate = (self.stats['cache_hits'] / cache_requests * 100) if cache_requests > 0 else 0
        
        return {
            "total_threats": self.stats['total_threats'],
            "cache_hits": self.stats['cache_hits'],
            "cache_misses": self.stats['cache_misses'],
            "hit_rate_percentage": hit_rate,
            "last_sync": self.stats['last_sync'],
            "sources": {
                name: {"enabled": config['enabled'], "weight": config['weight']}
                for name, config in self.sources.items()
            },
            "status": "active" if self.last_update else "not_synced"
        }
    
    async def force_update(self):
        """Force immediate feed update"""
        self.last_update = None
        await self.update_feeds()
    
    def clear_cache(self):
        """Clear threat cache"""
        self.cache.clear()
        self.live_cache.clear()
        self.stats['total_threats'] = 0
        logger.info("Threat intelligence cache cleared")


# Global instance
_threat_intelligence: Optional[ThreatIntelligenceAggregator] = None


def get_threat_intelligence() -> Optional[ThreatIntelligenceAggregator]:
    """Get global threat intelligence instance"""
    global _threat_intelligence
    return _threat_intelligence


def init_threat_intelligence(cache_ttl_minutes: int = 5) -> ThreatIntelligenceAggregator:
    """Initialize global threat intelligence aggregator"""
    global _threat_intelligence
    if _threat_intelligence is None:
        _threat_intelligence = ThreatIntelligenceAggregator(cache_ttl_minutes)
    return _threat_intelligence
