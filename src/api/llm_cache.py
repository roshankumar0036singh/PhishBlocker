"""
LLM Cache Manager for PhishBlocker
Manages caching of LLM responses to minimize API costs
"""

import redis
import json
import hashlib
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class LLMCacheManager:
    """
    Manage LLM response caching to minimize API costs
    Uses Redis for distributed caching with configurable TTL
    """
    
    def __init__(
        self, 
        redis_client: redis.Redis,
        cache_ttl_days: int = 7,
        key_prefix: str = "llm:analysis"
    ):
        """
        Initialize cache manager
        
        Args:
            redis_client: Redis client instance
            cache_ttl_days: Cache time-to-live in days
            key_prefix: Prefix for cache keys
        """
        self.redis = redis_client
        self.cache_ttl = timedelta(days=cache_ttl_days)
        self.key_prefix = key_prefix
        self.hit_count = 0
        self.miss_count = 0
        
        logger.info(f"Initialized LLM cache with {cache_ttl_days} day TTL")
    
    async def get(self, url: str) -> Optional[Dict[str, Any]]:
        """
        Get cached LLM analysis for URL
        
        Args:
            url: URL to lookup
            
        Returns:
            Cached analysis dict or None if not found
        """
        try:
            key = self._generate_key(url)
            cached_data = self.redis.get(key)
            
            if cached_data:
                self.hit_count += 1
                analysis = json.loads(cached_data)
                
                # Update access metadata
                self._update_access_metadata(key)
                
                logger.debug(f"Cache hit for URL: {url}")
                return analysis
            
            self.miss_count += 1
            logger.debug(f"Cache miss for URL: {url}")
            return None
            
        except Exception as e:
            logger.error(f"Error retrieving from cache: {str(e)}")
            self.miss_count += 1
            return None
    
    async def set(self, url: str, analysis: Dict[str, Any]) -> bool:
        """
        Cache LLM analysis for URL
        
        Args:
            url: URL being analyzed
            analysis: Analysis results to cache
            
        Returns:
            True if cached successfully, False otherwise
        """
        try:
            key = self._generate_key(url)
            
            # Add cache metadata
            cache_entry = {
                **analysis,
                'cached_at': datetime.now().isoformat(),
                'cache_key': key
            }
            
            # Set with TTL (minimum 60 seconds)
            ttl_seconds = max(60, int(self.cache_ttl.total_seconds()))
            self.redis.set(
                key,
                json.dumps(cache_entry),
                ex=ttl_seconds
            )
            
            # Track metadata
            self._track_cache_metadata(key, url)
            
            logger.debug(f"Cached analysis for URL: {url}")
            return True
            
        except Exception as e:
            logger.error(f"Error caching analysis: {str(e)}")
            return False
    
    async def invalidate(self, url: str) -> bool:
        """
        Invalidate cached analysis for URL
        
        Args:
            url: URL to invalidate
            
        Returns:
            True if invalidated, False otherwise
        """
        try:
            key = self._generate_key(url)
            deleted = self.redis.delete(key)
            
            if deleted:
                logger.info(f"Invalidated cache for URL: {url}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error invalidating cache: {str(e)}")
            return False
    
    async def invalidate_pattern(self, pattern: str) -> int:
        """
        Invalidate all cache entries matching pattern
        
        Args:
            pattern: Pattern to match (e.g., "*phishing*")
            
        Returns:
            Number of entries invalidated
        """
        try:
            search_pattern = f"{self.key_prefix}:{pattern}"
            keys = self.redis.keys(search_pattern)
            
            if keys:
                deleted = self.redis.delete(*keys)
                logger.info(f"Invalidated {deleted} cache entries matching: {pattern}")
                return deleted
            
            return 0
            
        except Exception as e:
            logger.error(f"Error invalidating pattern: {str(e)}")
            return 0
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get cache performance metrics
        
        Returns:
            Dictionary with cache statistics
        """
        total = self.hit_count + self.miss_count
        hit_rate = self.hit_count / total if total > 0 else 0
        
        # Get cache size from Redis
        try:
            cache_keys = self.redis.keys(f"{self.key_prefix}:*")
            cache_size = len(cache_keys)
        except:
            cache_size = 0
        
        # Estimate cost savings (assuming $0.001 per Gemini API call)
        cost_per_call = 0.001
        estimated_savings = self.hit_count * cost_per_call
        
        return {
            'hit_count': self.hit_count,
            'miss_count': self.miss_count,
            'total_requests': total,
            'hit_rate': hit_rate,
            'hit_rate_percentage': hit_rate * 100,
            'cache_size': cache_size,
            'estimated_cost_saved_usd': estimated_savings,
            'cache_ttl_days': self.cache_ttl.days
        }
    
    def reset_stats(self):
        """Reset cache statistics counters"""
        self.hit_count = 0
        self.miss_count = 0
        logger.info("Cache statistics reset")
    
    async def clear_all(self) -> int:
        """
        Clear all LLM cache entries
        
        Returns:
            Number of entries cleared
        """
        try:
            keys = self.redis.keys(f"{self.key_prefix}:*")
            if keys:
                deleted = self.redis.delete(*keys)
                logger.warning(f"Cleared all LLM cache: {deleted} entries deleted")
                return deleted
            return 0
            
        except Exception as e:
            logger.error(f"Error clearing cache: {str(e)}")
            return 0
    
    def _generate_key(self, url: str) -> str:
        """
        Generate Redis key for URL
        
        Args:
            url: URL to generate key for
            
        Returns:
            Redis key string
        """
        url_hash = hashlib.sha256(url.encode()).hexdigest()
        return f"{self.key_prefix}:{url_hash}"
    
    def _update_access_metadata(self, key: str):
        """Update access count and timestamp for cached entry"""
        try:
            metadata_key = f"{key}:meta"
            
            # Increment access count
            self.redis.hincrby(metadata_key, 'access_count', 1)
            
            # Update last accessed timestamp
            self.redis.hset(
                metadata_key, 
                'last_accessed', 
                datetime.now().isoformat()
            )
            
            # Set TTL on metadata (convert to seconds)
            self.redis.expire(metadata_key, int(self.cache_ttl.total_seconds()))
            
        except Exception as e:
            logger.debug(f"Error updating access metadata: {str(e)}")
    
    def _track_cache_metadata(self, key: str, url: str):
        """Track metadata for cache entry"""
        try:
            metadata_key = f"{key}:meta"
            
            metadata = {
                'url': url,
                'created_at': datetime.now().isoformat(),
                'access_count': 1,
                'last_accessed': datetime.now().isoformat()
            }
            
            self.redis.hset(metadata_key, mapping=metadata)
            self.redis.expire(metadata_key, int(self.cache_ttl.total_seconds()))
            
        except Exception as e:
            logger.debug(f"Error tracking cache metadata: {str(e)}")
    
    async def get_popular_urls(self, limit: int = 10) -> list:
        """
        Get most frequently accessed cached URLs
        
        Args:
            limit: Maximum number of URLs to return
            
        Returns:
            List of (url, access_count) tuples
        """
        try:
            metadata_keys = self.redis.keys(f"{self.key_prefix}:*:meta")
            url_stats = []
            
            for meta_key in metadata_keys:
                url = self.redis.hget(meta_key, 'url')
                access_count = self.redis.hget(meta_key, 'access_count')
                
                if url and access_count:
                    url_stats.append((
                        url.decode() if isinstance(url, bytes) else url,
                        int(access_count)
                    ))
            
            # Sort by access count
            url_stats.sort(key=lambda x: x[1], reverse=True)
            
            return url_stats[:limit]
            
        except Exception as e:
            logger.error(f"Error getting popular URLs: {str(e)}")
            return []
