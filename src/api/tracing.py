"""
Distributed Tracing with OpenTelemetry for PhishBlocker
Enables request tracing across services for debugging and performance analysis
"""

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class DistributedTracing:
    """
    Distributed tracing setup for PhishBlocker
    """
    
    def __init__(self, service_name: str = "phishblocker", environment: str = "production"):
        """
        Initialize distributed tracing
        
        Args:
            service_name: Name of the service
            environment: Environment (production, staging, development)
        """
        self.service_name = service_name
        self.environment = environment
        self.tracer_provider: Optional[TracerProvider] = None
        self.tracer: Optional[trace.Tracer] = None
        
    def setup(self, enable_console_export: bool = False):
        """
        Setup OpenTelemetry tracing
        
        Args:
            enable_console_export: Export traces to console (for debugging)
        """
        try:
            # Create resource
            resource = Resource.create({
                "service.name": self.service_name,
                "service.version": "2.0.0",
                "deployment.environment": self.environment
            })
            
            # Create tracer provider
            self.tracer_provider = TracerProvider(resource=resource)
            
            # Add span processor
            if enable_console_export:
                # Console exporter for debugging
                console_exporter = ConsoleSpanExporter()
                self.tracer_provider.add_span_processor(
                    BatchSpanProcessor(console_exporter)
                )
            
            # Set as global tracer provider
            trace.set_tracer_provider(self.tracer_provider)
            
            # Get tracer
            self.tracer = trace.get_tracer(__name__)
            
            logger.info(f"Distributed tracing initialized for {self.service_name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize tracing: {e}")
    
    def instrument_fastapi(self, app):
        """
        Instrument FastAPI application
        
        Args:
            app: FastAPI application instance
        """
        try:
            FastAPIInstrumentor.instrument_app(app)
            logger.info("FastAPI instrumented for tracing")
        except Exception as e:
            logger.error(f"Failed to instrument FastAPI: {e}")
    
    def instrument_httpx(self):
        """Instrument HTTPX client"""
        try:
            HTTPXClientInstrumentor().instrument()
            logger.info("HTTPX instrumented for tracing")
        except Exception as e:
            logger.error(f"Failed to instrument HTTPX: {e}")
    
    def instrument_redis(self):
        """Instrument Redis client"""
        try:
            RedisInstrumentor().instrument()
            logger.info("Redis instrumented for tracing")
        except Exception as e:
            logger.error(f"Failed to instrument Redis: {e}")
    
    def create_span(self, name: str, attributes: dict = None):
        """
        Create a custom span
        
        Args:
            name: Span name
            attributes: Span attributes
            
        Returns:
            Span context manager
        """
        if not self.tracer:
            # Return dummy context if tracing not initialized
            from contextlib import nullcontext
            return nullcontext()
        
        span = self.tracer.start_as_current_span(name)
        
        if attributes:
            for key, value in attributes.items():
                span.set_attribute(key, value)
        
        return span
    
    def add_event(self, name: str, attributes: dict = None):
        """
        Add event to current span
        
        Args:
            name: Event name
            attributes: Event attributes
        """
        current_span = trace.get_current_span()
        if current_span:
            current_span.add_event(name, attributes or {})
    
    def record_exception(self, exception: Exception):
        """
        Record exception in current span
        
        Args:
            exception: Exception to record
        """
        current_span = trace.get_current_span()
        if current_span:
            current_span.record_exception(exception)
            current_span.set_status(trace.Status(trace.StatusCode.ERROR))


# Global tracing instance
_tracing: Optional[DistributedTracing] = None


def get_tracing() -> Optional[DistributedTracing]:
    """Get global tracing instance"""
    global _tracing
    return _tracing


def init_tracing(
    service_name: str = "phishblocker",
    environment: str = "production",
    enable_console: bool = False
) -> DistributedTracing:
    """
    Initialize global tracing
    
    Args:
        service_name: Service name
        environment: Environment
        enable_console: Enable console export
        
    Returns:
        Tracing instance
    """
    global _tracing
    if _tracing is None:
        _tracing = DistributedTracing(service_name, environment)
        _tracing.setup(enable_console_export=enable_console)
        _tracing.instrument_httpx()
        _tracing.instrument_redis()
    return _tracing
