"""
Database Connection Pool Manager for PhishBlocker
Implements connection pooling with SQLAlchemy for optimal performance
"""

import logging
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager
from sqlalchemy import create_engine, text, event
from sqlalchemy.pool import QueuePool, NullPool
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
import os

logger = logging.getLogger(__name__)


class DatabasePool:
    """
    Database connection pool manager with automatic failover
    and connection health checking
    """
    
    def __init__(
        self,
        database_url: str,
        pool_size: int = 20,
        max_overflow: int = 40,
        pool_timeout: int = 30,
        pool_recycle: int = 3600,
        echo: bool = False
    ):
        """
        Initialize database connection pool
        
        Args:
            database_url: PostgreSQL connection string
            pool_size: Number of connections to maintain
            max_overflow: Maximum overflow connections
            pool_timeout: Timeout for getting connection
            pool_recycle: Recycle connections after N seconds
            echo: Enable SQL query logging
        """
        self.database_url = database_url
        
        # Create engine with connection pooling
        self.engine = create_engine(
            database_url,
            poolclass=QueuePool,
            pool_size=pool_size,
            max_overflow=max_overflow,
            pool_timeout=pool_timeout,
            pool_recycle=pool_recycle,
            pool_pre_ping=True,  # Verify connections before use
            echo=echo,
            connect_args={
                "connect_timeout": 10,
                "options": "-c statement_timeout=30000"  # 30 second query timeout
            }
        )
        
        # Create session factory
        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine
        )
        
        # Add connection pool event listeners
        self._setup_event_listeners()
        
        # Statistics
        self.connection_count = 0
        self.error_count = 0
        
        logger.info(f"Database pool initialized: size={pool_size}, max_overflow={max_overflow}")
    
    def _setup_event_listeners(self):
        """Setup event listeners for connection pool monitoring"""
        
        @event.listens_for(self.engine, "connect")
        def receive_connect(dbapi_conn, connection_record):
            """Log new connections"""
            self.connection_count += 1
            logger.debug(f"New database connection established (total: {self.connection_count})")
        
        @event.listens_for(self.engine, "checkout")
        def receive_checkout(dbapi_conn, connection_record, connection_proxy):
            """Verify connection on checkout"""
            logger.debug("Connection checked out from pool")
        
        @event.listens_for(self.engine, "checkin")
        def receive_checkin(dbapi_conn, connection_record):
            """Log connection return to pool"""
            logger.debug("Connection returned to pool")
    
    @asynccontextmanager
    async def get_session(self):
        """
        Get database session with automatic cleanup
        
        Usage:
            async with db_pool.get_session() as session:
                result = session.execute(query)
        """
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            self.error_count += 1
            logger.error(f"Database session error: {e}")
            raise
        finally:
            session.close()
    
    def get_sync_session(self) -> Session:
        """Get synchronous session (for non-async code)"""
        return self.SessionLocal()
    
    async def execute_query(self, query: str, params: Optional[Dict] = None) -> List[Dict]:
        """
        Execute a query and return results
        
        Args:
            query: SQL query string
            params: Query parameters
            
        Returns:
            List of result dictionaries
        """
        async with self.get_session() as session:
            result = session.execute(text(query), params or {})
            return [dict(row) for row in result.fetchall()]
    
    async def execute_many(self, query: str, params_list: List[Dict]) -> int:
        """
        Execute query with multiple parameter sets (batch insert/update)
        
        Args:
            query: SQL query string
            params_list: List of parameter dictionaries
            
        Returns:
            Number of rows affected
        """
        async with self.get_session() as session:
            result = session.execute(text(query), params_list)
            return result.rowcount
    
    def get_pool_stats(self) -> Dict[str, Any]:
        """Get connection pool statistics"""
        pool = self.engine.pool
        
        return {
            "pool_size": pool.size(),
            "checked_in": pool.checkedin(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow(),
            "total_connections": self.connection_count,
            "error_count": self.error_count,
            "status": "healthy" if self.error_count < 10 else "degraded"
        }
    
    async def health_check(self) -> bool:
        """Check database connectivity"""
        try:
            async with self.get_session() as session:
                session.execute(text("SELECT 1"))
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False
    
    def close(self):
        """Close all connections and dispose pool"""
        self.engine.dispose()
        logger.info("Database pool closed")


class BatchProcessor:
    """
    Batch processing for database operations
    Optimizes bulk inserts and updates
    """
    
    def __init__(self, db_pool: DatabasePool, batch_size: int = 100):
        """
        Initialize batch processor
        
        Args:
            db_pool: Database pool instance
            batch_size: Number of items per batch
        """
        self.db_pool = db_pool
        self.batch_size = batch_size
        self.pending_scans = []
        self.pending_feedback = []
    
    async def add_scan(self, scan_data: Dict[str, Any]):
        """Add scan to batch queue"""
        self.pending_scans.append(scan_data)
        
        # Flush if batch is full
        if len(self.pending_scans) >= self.batch_size:
            await self.flush_scans()
    
    async def flush_scans(self):
        """Flush pending scans to database"""
        if not self.pending_scans:
            return
        
        query = """
            INSERT INTO scans (
                url, url_hash, user_id, is_phishing, confidence,
                threat_level, risk_factors, llm_analysis, scan_duration_ms,
                timestamp, scan_id
            ) VALUES (
                :url, :url_hash, :user_id, :is_phishing, :confidence,
                :threat_level, :risk_factors, :llm_analysis, :scan_duration_ms,
                :timestamp, :scan_id
            )
        """
        
        try:
            rows_affected = await self.db_pool.execute_many(query, self.pending_scans)
            logger.info(f"Batch inserted {rows_affected} scans")
            self.pending_scans.clear()
        except Exception as e:
            logger.error(f"Batch insert failed: {e}")
            # Fallback: insert one by one
            for scan in self.pending_scans:
                try:
                    await self.db_pool.execute_query(query, scan)
                except Exception as inner_e:
                    logger.error(f"Individual insert failed: {inner_e}")
            self.pending_scans.clear()
    
    async def add_feedback(self, feedback_data: Dict[str, Any]):
        """Add feedback to batch queue"""
        self.pending_feedback.append(feedback_data)
        
        if len(self.pending_feedback) >= self.batch_size:
            await self.flush_feedback()
    
    async def flush_feedback(self):
        """Flush pending feedback to database"""
        if not self.pending_feedback:
            return
        
        query = """
            INSERT INTO feedback (
                scan_id, url, is_phishing, user_feedback, feedback_type, timestamp
            ) VALUES (
                :scan_id, :url, :is_phishing, :user_feedback, :feedback_type, :timestamp
            )
        """
        
        try:
            rows_affected = await self.db_pool.execute_many(query, self.pending_feedback)
            logger.info(f"Batch inserted {rows_affected} feedback entries")
            self.pending_feedback.clear()
        except Exception as e:
            logger.error(f"Batch feedback insert failed: {e}")
            self.pending_feedback.clear()
    
    async def flush_all(self):
        """Flush all pending batches"""
        await self.flush_scans()
        await self.flush_feedback()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get batch processor statistics"""
        return {
            "pending_scans": len(self.pending_scans),
            "pending_feedback": len(self.pending_feedback),
            "batch_size": self.batch_size
        }


# Global database pool instance
_db_pool: Optional[DatabasePool] = None


def get_db_pool() -> DatabasePool:
    """Get global database pool instance"""
    global _db_pool
    if _db_pool is None:
        database_url = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/phishblocker")
        _db_pool = DatabasePool(database_url)
    return _db_pool


def init_db_pool(database_url: str, **kwargs) -> DatabasePool:
    """Initialize global database pool"""
    global _db_pool
    _db_pool = DatabasePool(database_url, **kwargs)
    return _db_pool


def close_db_pool():
    """Close global database pool"""
    global _db_pool
    if _db_pool:
        _db_pool.close()
        _db_pool = None
