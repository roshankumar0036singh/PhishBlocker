"""
Multi-Layer Caching Manager for PhishBlocker
Implements L1 (Memory) + L2 (Redis) caching strategy
"""

import logging
from typing import Optional, Dict, Any
from functools import lru_cache
import json
import hashlib
from datetime import datetime, timedelta
import redis

logger = logging.getLogger(__name__)


class MultiLayerCache:
    """
    Multi-layer caching strategy for maximum performance
    L1: In-memory LRU cache (fastest, limited size)
    L2: Redis cache (fast, distributed, larger capacity)
    """
    
    def __init__(
        self,
        redis_client: Optional[redis.Redis] = None,
        l1_max_size: int = 1000,
        l2_ttl_seconds: int = 3600
    ):
        """
        Initialize multi-layer cache
        
        Args:
            redis_client: Redis client for L2 cache
            l1_max_size: Maximum items in L1 cache
            l2_ttl_seconds: TTL for L2 cache entries
        """
        self.redis_client = redis_client
        self.l1_max_size = l1_max_size
        self.l2_ttl = l2_ttl_seconds
        
        # L1 cache: In-memory dictionary with LRU eviction
        self.l1_cache: Dict[str, Any] = {}
        self.l1_access_order: list = []
        
        # Statistics
        self.l1_hits = 0
        self.l2_hits = 0
        self.misses = 0
        
        logger.info(f"Initialized multi-layer cache: L1={l1_max_size}, L2_TTL={l2_ttl_seconds}s")
    
    async def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache (L1 → L2 → None)
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None
        """
        # Try L1 cache first (fastest)
        if key in self.l1_cache:
            self.l1_hits += 1
            self._update_l1_access(key)
            logger.debug(f"L1 cache hit: {key}")
            return self.l1_cache[key]
        
        # Try L2 cache (Redis)
        if self.redis_client:
            try:
                cached_data = self.redis_client.get(f"cache:{key}")
                if cached_data:
                    self.l2_hits += 1
                    value = json.loads(cached_data)
                    
                    # Promote to L1 cache
                    self._set_l1(key, value)
                    
                    logger.debug(f"L2 cache hit: {key}")
                    return value
            except Exception as e:
                logger.warning(f"L2 cache read error: {e}")
        
        # Cache miss
        self.misses += 1
        logger.debug(f"Cache miss: {key}")
        return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """
        Set value in both cache layers
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Optional TTL override (seconds)
        """
        # Set in L1 cache
        self._set_l1(key, value)
        
        # Set in L2 cache (Redis)
        if self.redis_client:
            try:
                cache_ttl = ttl or self.l2_ttl
                self.redis_client.setex(
                    f"cache:{key}",
                    cache_ttl,
                    json.dumps(value)
                )
                logger.debug(f"Cached in L1+L2: {key}")
            except Exception as e:
                logger.warning(f"L2 cache write error: {e}")
        else:
            logger.debug(f"Cached in L1 only: {key}")
    
    async def delete(self, key: str):
        """Delete from both cache layers"""
        # Remove from L1
        if key in self.l1_cache:
            del self.l1_cache[key]
            if key in self.l1_access_order:
                self.l1_access_order.remove(key)
        
        # Remove from L2
        if self.redis_client:
            try:
                self.redis_client.delete(f"cache:{key}")
            except Exception as e:
                logger.warning(f"L2 cache delete error: {e}")
    
    async def clear_all(self):
        """Clear all cache layers"""
        # Clear L1
        self.l1_cache.clear()
        self.l1_access_order.clear()
        
        # Clear L2 (pattern-based)
        if self.redis_client:
            try:
                keys = self.redis_client.keys("cache:*")
                if keys:
                    self.redis_client.delete(*keys)
                logger.info("Cleared all cache layers")
            except Exception as e:
                logger.warning(f"L2 cache clear error: {e}")
    
    def _set_l1(self, key: str, value: Any):
        """Set value in L1 cache with LRU eviction"""
        # Add to cache
        self.l1_cache[key] = value
        self._update_l1_access(key)
        
        # Evict oldest if over limit
        while len(self.l1_cache) > self.l1_max_size:
            oldest_key = self.l1_access_order.pop(0)
            if oldest_key in self.l1_cache:
                del self.l1_cache[oldest_key]
    
    def _update_l1_access(self, key: str):
        """Update LRU access order"""
        if key in self.l1_access_order:
            self.l1_access_order.remove(key)
        self.l1_access_order.append(key)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_requests = self.l1_hits + self.l2_hits + self.misses
        
        return {
            "l1": {
                "hits": self.l1_hits,
                "size": len(self.l1_cache),
                "max_size": self.l1_max_size,
                "hit_rate": self.l1_hits / total_requests if total_requests > 0 else 0
            },
            "l2": {
                "hits": self.l2_hits,
                "enabled": self.redis_client is not None,
                "ttl_seconds": self.l2_ttl,
                "hit_rate": self.l2_hits / total_requests if total_requests > 0 else 0
            },
            "overall": {
                "total_requests": total_requests,
                "total_hits": self.l1_hits + self.l2_hits,
                "misses": self.misses,
                "hit_rate": (self.l1_hits + self.l2_hits) / total_requests if total_requests > 0 else 0,
                "hit_rate_percentage": ((self.l1_hits + self.l2_hits) / total_requests * 100) if total_requests > 0 else 0
            }
        }
    
    def reset_stats(self):
        """Reset cache statistics"""
        self.l1_hits = 0
        self.l2_hits = 0
        self.misses = 0
        logger.info("Cache statistics reset")


class FeatureCache:
    """
    Specialized cache for URL feature extraction
    Uses content-based hashing for cache keys
    """
    
    def __init__(self, base_cache: MultiLayerCache):
        self.cache = base_cache
    
    def _generate_key(self, url: str) -> str:
        """Generate cache key from URL"""
        return f"features:{hashlib.sha256(url.encode()).hexdigest()}"
    
    async def get_features(self, url: str) -> Optional[Dict[str, Any]]:
        """Get cached features for URL"""
        key = self._generate_key(url)
        return await self.cache.get(key)
    
    async def set_features(self, url: str, features: Dict[str, Any]):
        """Cache features for URL"""
        key = self._generate_key(url)
        await self.cache.set(key, features, ttl=86400)  # 24 hour TTL
    
    async def invalidate(self, url: str):
        """Invalidate cached features for URL"""
        key = self._generate_key(url)
        await self.cache.delete(key)
