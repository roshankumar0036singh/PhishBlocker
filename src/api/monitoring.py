"""
Prometheus Metrics for PhishBlocker
Comprehensive monitoring and observability
"""

from prometheus_client import Counter, Histogram, Gauge, Info
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from typing import Dict, Any
import time
import logging

logger = logging.getLogger(__name__)


# ===================================
# Request Metrics
# ===================================

# Total requests counter
requests_total = Counter(
    'phishblocker_requests_total',
    'Total number of requests',
    ['endpoint', 'method', 'status']
)

# Request duration histogram
request_duration = Histogram(
    'phishblocker_request_duration_seconds',
    'Request duration in seconds',
    ['endpoint', 'method'],
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0]
)

# ===================================
# Detection Metrics
# ===================================

# Scans counter
scans_total = Counter(
    'phishblocker_scans_total',
    'Total number of URL scans',
    ['result']  # phishing, safe, error
)

# Detection confidence histogram
detection_confidence = Histogram(
    'phishblocker_detection_confidence',
    'ML model confidence scores',
    ['result'],
    buckets=[0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.99, 1.0]
)

# Threat level counter
threat_level_total = Counter(
    'phishblocker_threat_level_total',
    'Threats by level',
    ['level']  # Low, Medium, High, Critical
)

# ===================================
# LLM Metrics
# ===================================

# LLM requests
llm_requests_total = Counter(
    'phishblocker_llm_requests_total',
    'Total LLM analysis requests',
    ['status']  # success, error, cached
)

# LLM duration
llm_duration = Histogram(
    'phishblocker_llm_duration_seconds',
    'LLM analysis duration',
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0]
)

# LLM cost estimate
llm_cost_total = Counter(
    'phishblocker_llm_cost_usd',
    'Estimated LLM API cost in USD'
)

# ===================================
# Cache Metrics
# ===================================

# Cache operations
cache_operations = Counter(
    'phishblocker_cache_operations_total',
    'Cache operations',
    ['operation', 'result']  # get/set, hit/miss
)

# Cache size
cache_size = Gauge(
    'phishblocker_cache_size_bytes',
    'Current cache size in bytes',
    ['cache_type']  # l1, l2, llm
)

# Cache hit rate
cache_hit_rate = Gauge(
    'phishblocker_cache_hit_rate',
    'Cache hit rate percentage',
    ['cache_type']
)

# ===================================
# Database Metrics
# ===================================

# Database connections
db_connections = Gauge(
    'phishblocker_db_connections',
    'Database connection pool status',
    ['status']  # checked_in, checked_out, overflow
)

# Database query duration
db_query_duration = Histogram(
    'phishblocker_db_query_duration_seconds',
    'Database query duration',
    ['operation'],
    buckets=[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0]
)

# ===================================
# Advanced ML Metrics
# ===================================

# Homograph detections
homograph_detections = Counter(
    'phishblocker_homograph_detections_total',
    'Homograph attacks detected',
    ['risk_level']
)

# Threat intelligence matches
threat_intel_matches = Counter(
    'phishblocker_threat_intel_matches_total',
    'Threat intelligence matches',
    ['source']  # phishtank, openphish
)

# SSL analysis results
ssl_analysis_results = Counter(
    'phishblocker_ssl_analysis_total',
    'SSL certificate analysis results',
    ['result']  # valid, invalid, no_ssl
)

# Transformer analysis
transformer_analysis = Counter(
    'phishblocker_transformer_analysis_total',
    'Transformer-based analysis',
    ['result']  # impersonation, anomalous, normal
)

# ===================================
# System Metrics
# ===================================

# Application info
app_info = Info(
    'phishblocker_app',
    'Application information'
)

# Component status
component_status = Gauge(
    'phishblocker_component_status',
    'Component health status (1=healthy, 0=unhealthy)',
    ['component']
)

# Error counter
errors_total = Counter(
    'phishblocker_errors_total',
    'Total errors',
    ['type', 'component']
)

# ===================================
# Helper Functions
# ===================================

def record_request(endpoint: str, method: str, status: int, duration: float):
    """Record request metrics"""
    requests_total.labels(endpoint=endpoint, method=method, status=status).inc()
    request_duration.labels(endpoint=endpoint, method=method).observe(duration)


def record_scan(is_phishing: bool, confidence: float, threat_level: str):
    """Record scan metrics"""
    result = 'phishing' if is_phishing else 'safe'
    scans_total.labels(result=result).inc()
    detection_confidence.labels(result=result).observe(confidence)
    threat_level_total.labels(level=threat_level).inc()


def record_llm_request(status: str, duration: float = 0, cost: float = 0):
    """Record LLM metrics"""
    llm_requests_total.labels(status=status).inc()
    if duration > 0:
        llm_duration.observe(duration)
    if cost > 0:
        llm_cost_total.inc(cost)


def record_cache_operation(operation: str, result: str, cache_type: str = 'default'):
    """Record cache metrics"""
    cache_operations.labels(operation=operation, result=result).inc()


def update_cache_metrics(cache_type: str, size: int, hit_rate: float):
    """Update cache gauge metrics"""
    cache_size.labels(cache_type=cache_type).set(size)
    cache_hit_rate.labels(cache_type=cache_type).set(hit_rate)


def update_db_metrics(checked_in: int, checked_out: int, overflow: int):
    """Update database metrics"""
    db_connections.labels(status='checked_in').set(checked_in)
    db_connections.labels(status='checked_out').set(checked_out)
    db_connections.labels(status='overflow').set(overflow)


def record_homograph_detection(risk_level: str):
    """Record homograph detection"""
    homograph_detections.labels(risk_level=risk_level).inc()


def record_threat_intel_match(source: str):
    """Record threat intelligence match"""
    threat_intel_matches.labels(source=source).inc()


def record_ssl_analysis(result: str):
    """Record SSL analysis result"""
    ssl_analysis_results.labels(result=result).inc()


def record_transformer_analysis(result: str):
    """Record transformer analysis"""
    transformer_analysis.labels(result=result).inc()


def update_component_status(component: str, is_healthy: bool):
    """Update component health status"""
    component_status.labels(component=component).set(1 if is_healthy else 0)


def record_error(error_type: str, component: str):
    """Record error"""
    errors_total.labels(type=error_type, component=component).inc()


def set_app_info(version: str, environment: str):
    """Set application info"""
    app_info.info({
        'version': version,
        'environment': environment,
        'name': 'PhishBlocker'
    })


def get_metrics() -> bytes:
    """Get Prometheus metrics in text format"""
    return generate_latest()


def get_metrics_content_type() -> str:
    """Get Prometheus metrics content type"""
    return CONTENT_TYPE_LATEST


# Initialize app info
set_app_info(version='2.0.0', environment='production')

logger.info("Prometheus metrics initialized")
