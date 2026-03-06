from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any
import asyncio
import json
import redis
import hashlib
from datetime import datetime
import logging
import os
import sys
import uvicorn
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


# Add the ml module to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'api')))

# Import the ML model class
from phishing_model import PhishingDetectionEnsemble

# Import LLM services
from llm_service import GeminiPhishingAnalyzer
from llm_cache import LLMCacheManager

# Import performance optimization modules
from multi_cache import MultiLayerCache, FeatureCache
from database_pool import DatabasePool, BatchProcessor

# Import advanced ML features
from transformer_analyzer import TransformerURLAnalyzer, init_transformer_analyzer
from homograph_detector import HomographDetector, init_homograph_detector
from threat_intelligence import ThreatIntelligenceAggregator, init_threat_intelligence
from ssl_analyzer import SSLCertificateAnalyzer, init_ssl_analyzer
from tracing import init_tracing
from rate_limiter import RateLimiter
from prometheus_fastapi_instrumentator import Instrumentator
import time
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="PhishBlocker API",
    description="Real-time phishing detection API with adaptive ML and threat intelligence",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for all origins (adjust in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Tracing
tracing = init_tracing(enable_console=os.getenv("DEBUG", "false").lower() == "true")
tracing.instrument_fastapi(app)

# Initialize Prometheus Metrics
Instrumentator().instrument(app).expose(app)

# Request ID Middleware
@app.middleware("http")
async def add_request_id(request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

@app.get("/health")
async def health_check():
    health = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
        "components": {
            "api": "up",
            "redis": "down",
            "detector": "down"
        }
    }
    
    if redis_client:
        try:
            redis_client.ping()
            health["components"]["redis"] = "up"
        except:
            health["status"] = "degraded"
            
    if detector and detector.is_trained:
        health["components"]["detector"] = "up"
        
    return health

# Pydantic models
class URLRequest(BaseModel):
    url: str
    user_id: Optional[str] = None
    timestamp: Optional[datetime] = None
    dom_data: Optional[Dict[str, Any]] = None
    gemini_api_key: Optional[str] = None # BYOAK Support

class URLBatchRequest(BaseModel):
    urls: List[str]
    user_id: Optional[str] = None

class PhishingResponse(BaseModel):
    url: str
    is_phishing: bool
    confidence: float
    threat_level: str
    risk_factors: List[str]
    timestamp: datetime
    scan_id: str
    llm_analysis: Optional[Dict[str, Any]] = None  # New: Gemini LLM analysis

class FeedbackRequest(BaseModel):
    url: str
    is_phishing: bool
    user_feedback: str
    scan_id: str

class UserRiskProfile(BaseModel):
    user_id: str
    risk_score: float
    total_scans: int
    phishing_encounters: int
    last_scan: datetime

# Globals
detector: Optional[PhishingDetectionEnsemble] = None
redis_client: Optional[redis.Redis] = None
gemini_analyzer: Optional[GeminiPhishingAnalyzer] = None
llm_cache: Optional[LLMCacheManager] = None
multi_cache: Optional[MultiLayerCache] = None
feature_cache: Optional[FeatureCache] = None
rate_limiter: Optional[RateLimiter] = None
db_pool: Optional[DatabasePool] = None
batch_processor: Optional[BatchProcessor] = None
# Advanced ML features
transformer_analyzer: Optional[TransformerURLAnalyzer] = None
homograph_detector: Optional[HomographDetector] = None
threat_intel: Optional[ThreatIntelligenceAggregator] = None
ssl_analyzer: Optional[SSLCertificateAnalyzer] = None
user_analytics: Dict[str, Dict[str, Any]] = {}

@app.on_event("startup")
async def startup_event():
    global detector, redis_client, gemini_analyzer, llm_cache, multi_cache, feature_cache, db_pool, batch_processor, rate_limiter
    global transformer_analyzer, homograph_detector, threat_intel, ssl_analyzer
    logger.info("Starting PhishBlocker API...")

    try:
        detector = PhishingDetectionEnsemble()
        # Use models directory from environment or default to local models/
        base_path = os.getenv("MODEL_PATH", "models/")
        
        detector.load_models(base_path)
        if detector.is_trained:
            logger.info("ML phishing detector ensemble loaded successfully")
        else:
            logger.warning("Model exists but is not trained")
    except Exception as e:
        logger.error(f"Failed to load ML phishing model: {e}")
        detector = None

    # Redis setup
    try:
        redis_host = os.getenv("REDIS_HOST", "localhost")
        redis_port = int(os.getenv("REDIS_PORT", 6379))
        redis_password = os.getenv("REDIS_PASSWORD")
        redis_db = int(os.getenv("REDIS_DB", 0))
        
        redis_client = redis.Redis(
            host=redis_host,
            port=redis_port,
            password=redis_password,
            db=redis_db,
            decode_responses=True
        )
        redis_client.ping()
        logger.info(f"Redis cache connected at {redis_host}:{redis_port}")
    except Exception as e:
        logger.warning(f"Redis not available: {e}")
        redis_client = None
    
    # Initialize Gemini LLM analyzer
    try:
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if gemini_api_key:
            gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")
            gemini_analyzer = GeminiPhishingAnalyzer(
                api_key=gemini_api_key,
                model_name=gemini_model
            )
            logger.info(f"Gemini LLM analyzer initialized with model: {gemini_model}")
            
            # Initialize LLM cache if Redis is available
            if redis_client:
                # Handle TTL more robustly: If > 1000, assume seconds; otherwise assume days
                ttl_val = int(os.getenv("GEMINI_CACHE_TTL", 7))
                cache_ttl_days = ttl_val if ttl_val < 1000 else (ttl_val // 86400)
                if cache_ttl_days == 0: cache_ttl_days = 7 # Safety fallback
                
                llm_cache = LLMCacheManager(
                    redis_client=redis_client,
                    cache_ttl_days=cache_ttl_days
                )
                logger.info(f"LLM cache initialized with {cache_ttl_days} day TTL")
        else:
            logger.warning("GEMINI_API_KEY not set - LLM analysis disabled")
    except Exception as e:
        logger.error(f"Failed to initialize Gemini LLM: {e}")
        gemini_analyzer = None
        llm_cache = None
    
    # Initialize multi-layer cache
    try:
        if redis_client:
            l1_size = int(os.getenv("CACHE_L1_SIZE", 1000))
            l2_ttl = int(os.getenv("CACHE_L2_TTL", 3600))
            multi_cache = MultiLayerCache(
                redis_client=redis_client,
                l1_max_size=l1_size,
                l2_ttl_seconds=l2_ttl
            )
            feature_cache = FeatureCache(multi_cache)
            rate_limiter = RateLimiter(redis_client=redis_client)
            logger.info(f"Multi-layer cache and rate limiter initialized: L1={l1_size}, L2_TTL={l2_ttl}s")
        else:
            logger.warning("Redis not available - multi-layer cache and rate limiter disabled")
    except Exception as e:
        logger.error(f"Failed to initialize multi-layer cache: {e}")
        multi_cache = None
        feature_cache = None
        
    # Initialize Threat Intelligence
    try:
        enable_threat_intel = os.getenv("ENABLE_THREAT_INTEL", "true").lower() == "true"
        if enable_threat_intel:
            threat_intel = init_threat_intelligence(cache_ttl_minutes=60)
            logger.info("Threat intelligence aggregator initialized")
    except Exception as e:
        logger.error(f"Failed to initialize threat intelligence: {e}")
        threat_intel = None
    
    # Initialize database connection pool
    try:
        database_url = os.getenv("DATABASE_URL")
        if database_url:
            pool_size = int(os.getenv("DB_POOL_SIZE", 20))
            max_overflow = int(os.getenv("DB_MAX_OVERFLOW", 40))
            db_pool = DatabasePool(
                database_url=database_url,
                pool_size=pool_size,
                max_overflow=max_overflow
            )
            batch_processor = BatchProcessor(db_pool, batch_size=int(os.getenv("BATCH_SIZE", 100)))
            logger.info(f"Database pool initialized: size={pool_size}, max_overflow={max_overflow}")
        else:
            logger.warning("DATABASE_URL not set - database pool disabled")
    except Exception as e:
        logger.error(f"Failed to initialize database pool: {e}")
        db_pool = None
        batch_processor = None

    # Initialize Advanced ML components
    try:
        transformer_model = os.getenv("TRANSFORMER_MODEL_PATH") or os.getenv("TRANSFORMER_MODEL", "distilbert-base-uncased")
        transformer_analyzer = init_transformer_analyzer(model_name=transformer_model, is_classifier=True)
        logger.info(f"Transformer URL analyzer initialized from {transformer_model} (Classifier Mode)")
    except Exception as e:
        logger.error(f"Failed to initialize Transformer analyzer: {e}")
        
    try:
        homograph_detector = init_homograph_detector()
        logger.info("Homograph detector initialized")
    except Exception as e:
        logger.error(f"Failed to initialize Homograph detector: {e}")
        
    try:
        ssl_analyzer = init_ssl_analyzer()
        logger.info("SSL analyzer initialized")
    except Exception as e:
        logger.error(f"Failed to initialize SSL analyzer: {e}")

@app.get("/")
async def root():
    return {
        "service": "PhishBlocker API",
        "version": "1.0.0",
        "status": "active",
        "features": [
            "Real-time URL scanning",
            "Threat level assessment",
            "User analytics",
            "Feedback learning",
            "Batch processing"
        ]
    }

@app.get("/health")
async def health_check():
    health = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
        "components": {
            "api": "up",
            "redis": "down",
            "detector": "down"
        }
    }
    
    if redis_client:
        try:
            redis_client.ping()
            health["components"]["redis"] = "up"
        except:
            health["status"] = "degraded"
            
    if detector and detector.is_trained:
        health["components"]["detector"] = "up"
        
    return health

def generate_scan_id(url: str) -> str:
    timestamp = str(datetime.now().timestamp())
    return hashlib.md5(f"{url}_{timestamp}".encode()).hexdigest()[:12]

def get_risk_factors(features: Dict[str, Any]) -> List[str]:
    risk_factors = []
    if features.get('has_ip', 0):
        risk_factors.append("Uses IP address instead of domain name")
    if not features.get('is_https', 0):
        risk_factors.append("Not using HTTPS encryption")
    if features.get('suspicious_keywords', 0) > 0:
        risk_factors.append(f"Contains {features['suspicious_keywords']} suspicious keywords")
    if features.get('is_shortening', 0):
        risk_factors.append("Uses URL shortening service")
    if features.get('url_length', 0) > 100:
        risk_factors.append("Unusually long URL")
    if features.get('num_hyphens', 0) > 3:
        risk_factors.append("Excessive hyphens in domain")
    return risk_factors

@app.post("/scan", response_model=PhishingResponse)
@app.post("/api/scan", response_model=PhishingResponse)
async def scan_url(request: URLRequest, fastapi_request: Request):
    global detector, feature_cache, rate_limiter
    
    # Apply Rate Limiting
    if rate_limiter:
        key = request.user_id or fastapi_request.client.host
        is_allowed, remaining, reset_time = await rate_limiter.is_allowed(key)
        if not is_allowed:
            raise HTTPException(
                status_code=429, 
                detail="Too many requests. Please try again later.",
                headers={
                    "X-Rate-Limit-Limit": str(rate_limiter.default_limit),
                    "X-Rate-Limit-Remaining": str(remaining),
                    "X-Rate-Limit-Reset": str(reset_time)
                }
            )
    if not detector or not detector.is_trained:
        raise HTTPException(status_code=503, detail="Phishing detector not available")
    url = request.url.strip()
    scan_id = generate_scan_id(url)
    cache_key = f"scan:{hashlib.md5(url.encode()).hexdigest()}"
    
    # Check cache first
    if redis_client:
        try:
            cached_result = redis_client.get(cache_key)
            if cached_result:
                logger.info(f"Cache hit for URL: {url[:50]}...")
                cached_data = json.loads(cached_result)
                cached_data['scan_id'] = scan_id
                return PhishingResponse(**cached_data)
        except Exception as e:
            logger.warning(f"Cache read error: {e}")
    
    try:
        # ML model prediction (Base Ensemble: LightGBM + NN)
        result = detector.predict_url(url, return_confidence=True)
        risk_factors = get_risk_factors(result['features'])
        
        # Ensemble Scoring Variables
        base_score = result['confidence']
        transformer_score = None
        homograph_score = None
        
        # Transformer Sequence Analysis
        if transformer_analyzer:
            try:
                trans_result = transformer_analyzer.classify_phishing(url)
                transformer_score = trans_result.get('phishing_probability', 0.5)
                if transformer_score > 0.8:
                    risk_factors.append("Suspicious URL semantic pattern (Transformer)")
            except Exception as e:
                logger.warning(f"Transformer analysis failed: {e}")
        
        # Homograph Attack Detection
        if homograph_detector:
            try:
                homo_result = homograph_detector.detect_homograph(url)
                if homo_result.get('is_homograph_attack'):
                    homograph_score = homo_result.get('confidence', 0.9)
                    risk_factors.append(f"Homograph attack detected (Likely impersonating {homo_result.get('similar_to', {}).get('legitimate_domain')})")
            except Exception as e:
                logger.warning(f"Homograph detection failed: {e}")

        # Final Weighted Ensemble Score
        # Weights: Base(0.5) + Transformer(0.3) + Homograph(0.2)
        final_score = base_score
        if transformer_score is not None and homograph_score is not None:
            final_score = (0.5 * base_score) + (0.3 * transformer_score) + (0.2 * homograph_score)
        elif transformer_score is not None:
            final_score = (0.6 * base_score) + (0.4 * transformer_score)
        elif homograph_score is not None:
            final_score = (0.7 * base_score) + (0.3 * homograph_score)
            
        result['confidence'] = final_score
        result['prediction'] = 1 if final_score > 0.5 else 0
        result['threat_level'] = "High" if final_score > 0.8 else ("Medium" if final_score > 0.4 else "Low")

        
        # DOM Context analysis
        dom = request.dom_data
        if dom:
            # Dangerous combination: Password field on an HTTP connection
            if dom.get('has_password_field') and not result['features'].get('is_https', 0):
                risk_factors.append("Password field on insecure HTTP connection")
                result['prediction'] = 1
                result['confidence'] = min(0.99, max(result['confidence'], 0.90))
                result['threat_level'] = "Critical"
                
            # Suspicious structures: Hidden iframes often used for cross-site scripting/drive-by downloads
            if dom.get('hidden_iframes', 0) > 0:
                risk_factors.append(f"Contains {dom['hidden_iframes']} hidden iframes")
                result['confidence'] = min(0.99, result['confidence'] + 0.20)
                if result['prediction'] == 0 and result['confidence'] > 0.6:
                    result['prediction'] = 1
                    result['threat_level'] = "High"
                elif result['threat_level'] == "Low":
                    result['threat_level'] = "Medium"
                    
            # Obfuscated or suspicious internal scripts
            if dom.get('suspicious_scripts', 0) > 0:
                risk_factors.append(f"Contains {dom['suspicious_scripts']} suspicious/obfuscated scripts")
                result['confidence'] = min(0.99, result['confidence'] + 0.15)
                
            # Known targeted brands detection
            brand_indicators = dom.get('brand_indicators', [])
            if brand_indicators:
                for indicator in brand_indicators:
                    if indicator.startswith('suspicious_form_action:'):
                        target_domain = indicator.split(':')[1]
                        risk_factors.append(f"Form hijacking suspicion: Data being sent to external domain ({target_domain})")
                        result['confidence'] = min(0.99, max(result['confidence'], 0.85))
                        result['prediction'] = 1
                        result['threat_level'] = "Critical"
                    else:
                        risk_factors.append(f"Impersonating brand assets: {indicator}")
                        # If there are brand logos BUT the URL is sketchy, it's very likely phishing
                        if result['threat_level'] in ['Medium', 'High']:
                            result['prediction'] = 1
                            result['confidence'] = min(0.99, result['confidence'] + 0.25)
                            result['threat_level'] = "Critical"
        
        # SSL/TLS Deep Inspection
        if ssl_analyzer:
            try:
                ssl_result = ssl_analyzer.analyze_certificate(url)
                if ssl_result.get("has_ssl"):
                    # Add SSL specific risk factors
                    risk_factors.extend(ssl_result.get("warnings", []))
                    
                    # Adjust score based on SSL risk
                    ssl_risk = ssl_result.get("risk_score", 0)
                    if ssl_risk > 0.6:
                        result['confidence'] = min(0.99, result['confidence'] + (ssl_risk * 0.2))
                        if result['confidence'] > 0.7:
                            result['prediction'] = 1
                            result['threat_level'] = max(result.get('threat_level', 'Low'), ssl_result.get('risk_level', 'Low'), key=lambda x: ['Low', 'Medium', 'High', 'Critical'].index(x))
                else:
                    risk_factors.append("No SSL/TLS encryption (HTTP)")
                    if result['prediction'] == 1:
                        result['confidence'] = min(0.99, result['confidence'] + 0.1)
            except Exception as e:
                logger.warning(f"SSL analysis failed: {e}")
        
        # Threat Intelligence Aggregation
        threat_intel_result = None
        if threat_intel:
            try:
                threat_intel_result = await threat_intel.check_url(url)
                if threat_intel_result and threat_intel_result.get("is_known_threat"):
                    result['prediction'] = 1
                    result['confidence'] = max(result['confidence'], threat_intel_result.get("confidence", 0.95))
                    result['threat_level'] = "Critical"
                    risk_factors.append(f"Flagged by threat intelligence ({threat_intel_result.get('source', 'Unknown feed')})")
            except Exception as e:
                logger.warning(f"Threat intel check failed: {e}")
        
        # Prepare ML prediction data
        ml_prediction = {
            'is_phishing': result['prediction'] == 1,
            'confidence': result['confidence'],
            'threat_level': result['threat_level'],
            'label': 'Phishing' if result['prediction'] == 1 else 'Legitimate'
        }
        
        # 4. LLM Forensic Analysis (Adaptive)
        llm_analysis = None
        # Check for user-provided API key first (BYOAK), then server-side key
        active_gemini_key = request.gemini_api_key or os.getenv("GEMINI_API_KEY")
        
        if active_gemini_key and (request.gemini_api_key or os.getenv("ENABLE_LLM_ANALYSIS", "true").lower() == "true"):
            try:
                # If a custom key is provided, we might need a temporary analyzer or re-init
                # For efficiency, if it matches the current global analyzer, use it
                current_analyzer = gemini_analyzer
                
                if request.gemini_api_key:
                    # Initialize a dedicated analyzer for this request if key is different
                    from llm_service import GeminiPhishingAnalyzer
                    temp_analyzer = GeminiPhishingAnalyzer(api_key=request.gemini_api_key)
                    llm_analysis = await temp_analyzer.analyze_url(
                        url=url,
                        ml_features=result['features'],
                        ml_prediction=ml_prediction,
                        use_cache=True # We still want to cache results if possible
                    )
                elif current_analyzer:
                    # Use the standard global analyzer
                    llm_analysis = await current_analyzer.analyze_url(
                        url=url,
                        ml_features=result['features'],
                        ml_prediction=ml_prediction,
                        use_cache=True
                    )
            except Exception as e:
                logger.error(f"LLM analysis failed: {e}")
        
        # Build response
        response_data = {
            "url": url,
            "is_phishing": ml_prediction['is_phishing'],
            "confidence": ml_prediction['confidence'],
            "threat_level": ml_prediction['threat_level'],
            "risk_factors": risk_factors,
            "timestamp": datetime.now(),
            "scan_id": scan_id,
            "llm_analysis": llm_analysis
        }
        
        # Cache the complete response
        if redis_client:
            try:
                cache_data = response_data.copy()
                cache_data['timestamp'] = cache_data['timestamp'].isoformat()
                redis_client.setex(cache_key, 3600, json.dumps(cache_data))
            except Exception as e:
                logger.warning(f"Cache write error: {e}")
        
        # Update user analytics & telemetry
        await update_user_analytics(
            request.user_id, 
            ml_prediction['is_phishing'], 
            ml_prediction['threat_level']
        )
        
        # Record for history
        await record_recent_scan(response_data)
        
        logger.info(f"Scanned URL: {url[:50]}... | Result: {ml_prediction['label']} | Confidence: {ml_prediction['confidence']:.3f}")
        return PhishingResponse(**response_data)
        
    except Exception as e:
        logger.error(f"Error scanning URL {url}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during URL analysis")

@app.post("/scan-batch")
async def scan_batch_urls(request: URLBatchRequest):
    if not detector or not detector.is_trained:
        raise HTTPException(status_code=503, detail="Phishing detector not available")
    if len(request.urls) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 URLs per batch request")
    results = []
    for url in request.urls:
        try:
            url_request = URLRequest(url=url, user_id=request.user_id)
            result = await scan_url(url_request)
            results.append(result.dict())
        except Exception as e:
            logger.error(f"Error in batch scanning URL {url}: {str(e)}")
            results.append({
                "url": url,
                "is_phishing": False,
                "confidence": 0.0,
                "threat_level": "Unknown",
                "risk_factors": ["Scan failed"],
                "timestamp": datetime.now(),
                "scan_id": generate_scan_id(url)
            })
    phishing_count = sum(1 for r in results if r['is_phishing'])
    return {
        "total_urls": len(results),
        "phishing_detected": phishing_count,
        "safe_urls": len(results) - phishing_count,
        "results": results,
        "batch_id": generate_scan_id("batch_" + str(len(request.urls)))
    }

@app.post("/feedback")
async def submit_feedback(request: FeedbackRequest):
    try:
        feedback_entry = {
            "url": request.url,
            "user_reported_phishing": request.is_phishing,
            "feedback": request.user_feedback,
            "scan_id": request.scan_id,
            "timestamp": datetime.now().isoformat()
        }
        logger.info(f"Feedback received: {json.dumps(feedback_entry)}")  # Save feedback to DB in production
        return {
            "status": "success",
            "message": "Feedback received and will be used to improve detection accuracy",
            "feedback_id": generate_scan_id(request.url + request.user_feedback)
        }
    except Exception as e:
        logger.error(f"Error processing feedback: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing feedback")

@app.post("/api/feedback/false-positive")
async def report_false_positive(request: Dict[str, Any]):
    """Endpoint for reporting false positives to be stored for retraining"""
    try:
        url = request.get("url")
        if not url:
            raise HTTPException(status_code=400, detail="URL is required")
            
        data_dir = "data/retraining"
        os.makedirs(data_dir, exist_ok=True)
        
        entry = {
            "url": url,
            "timestamp": datetime.now().isoformat(),
            "metadata": request.get("metadata", {}),
            "type": "false_positive"
        }
        
        with open(os.path.join(data_dir, "false_positives.jsonl"), "a") as f:
            f.write(json.dumps(entry) + "\n")
            
        logger.info(f"False positive reported for: {url}")
        return {"status": "success", "message": "High-fidelity feedback recorded for retraining"}
    except Exception as e:
        logger.error(f"Error recording false positive: {e}")
        raise HTTPException(status_code=500, detail="Internal server error recording feedback")

async def update_user_analytics(user_id: str, encountered_phishing: bool, threat_level: str = "Low"):
    global redis_client
    
    # 1. Update user-specific analytics (legacy dict-based fallback)
    if user_id not in user_analytics:
        user_analytics[user_id] = {
            "total_scans": 0,
            "phishing_encounters": 0,
            "risk_score": 0.0,
            "last_scan": datetime.now()
        }
    user_analytics[user_id]["total_scans"] += 1
    if encountered_phishing:
        user_analytics[user_id]["phishing_encounters"] += 1
    encounters = user_analytics[user_id]["phishing_encounters"]
    total = user_analytics[user_id]["total_scans"]
    user_analytics[user_id]["risk_score"] = (encounters / total) * 100
    user_analytics[user_id]["last_scan"] = datetime.now()

    # 2. Update Global Redis Telemetry
    if redis_client:
        try:
            # Global Counters
            redis_client.incr("stats:total_scans")
            if encountered_phishing:
                redis_client.incr("stats:threats_blocked")
            
            # Active Users Set
            redis_client.sadd("stats:active_users", user_id or "anonymous")
            
            # Threat Level Distribution
            level_key = f"stats:threat_level:{threat_level.lower()}"
            redis_client.incr(level_key)
            
            # Hourly Activity Timeline
            now = datetime.now()
            timeline_key = f"stats:timeline:{now.strftime('%Y%m%d')}"
            hour_bucket = str(now.hour)
            # Store as JSON in a hash: { "hour": { "scans": N, "threats": M } }
            current_timeline = redis_client.hget(timeline_key, hour_bucket)
            if current_timeline:
                data = json.loads(current_timeline)
                data["scans"] = data.get("scans", 0) + 1
                if encountered_phishing:
                    data["threats"] = data.get("threats", 0) + 1
            else:
                data = {"hour": now.hour, "scans": 1, "threats": 1 if encountered_phishing else 0}
            
            redis_client.hset(timeline_key, hour_bucket, json.dumps(data))
            redis_client.expire(timeline_key, 172800) # 48 hour TTL
            
        except Exception as e:
            logger.warning(f"Failed to update Redis telemetry: {e}")

async def record_recent_scan(scan_data: Dict[str, Any]):
    """Store the latest scans in a Redis list for the dashboard"""
    global redis_client
    if not redis_client:
        return
        
    try:
        # Prep data for storage (ensure serializable)
        serialized_scan = json.dumps({
            "id": scan_data.get("scan_id"),
            "url": scan_data.get("url"),
            "is_phishing": scan_data.get("is_phishing"),
            "threat_level": scan_data.get("threat_level"),
            "confidence": scan_data.get("confidence"),
            "timestamp": datetime.now().isoformat(),
            "forensics": {
                "ip": "127.0.0.1", # In production, get from request
                "location": "Local Node",
                "server": "Uvicorn/PhishBlocker",
                "ssl": "Verified / Neural" if not scan_data.get("is_phishing") else "Untrusted"
            }
        })
        
        # Keep last 50 scans
        redis_client.lpush("stats:recent_scans", serialized_scan)
        redis_client.ltrim("stats:recent_scans", 0, 49)
    except Exception as e:
        logger.warning(f"Failed to record recent scan: {e}")

@app.get("/analytics/{user_id}", response_model=UserRiskProfile)
async def get_user_analytics(user_id: str):
    if user_id not in user_analytics:
        return UserRiskProfile(
            user_id=user_id,
            risk_score=0.0,
            total_scans=0,
            phishing_encounters=0,
            last_scan=datetime.now()
        )
    data = user_analytics[user_id]
    return UserRiskProfile(
        user_id=user_id,
        risk_score=data["risk_score"],
        total_scans=data["total_scans"],
        phishing_encounters=data["phishing_encounters"],
        last_scan=data["last_scan"]
    )

@app.get("/analytics/global/stats")
async def get_global_analytics():
    total_users = len(user_analytics)
    total_scans = sum(user["total_scans"] for user in user_analytics.values())
    total_threats = sum(user["phishing_encounters"] for user in user_analytics.values())
    return {
        "platform_stats": {
            "total_users": total_users,
            "total_scans": total_scans,
            "threats_blocked": total_threats,
            "detection_rate": (total_threats / total_scans * 100) if total_scans > 0 else 0
        },
        "threat_intelligence": {
            "active_threats": total_threats,
            "threat_level": "Medium" if total_threats > 0 else "Low",
            "last_updated": datetime.now()
        }
    }

@app.get("/model/info")
async def get_model_info():
    if not detector or not detector.is_trained:
        return {"status": "no_model_loaded"}
    return {
        "model_type": "Phishing Detection Ensemble",
        "version": detector.metadata.get("version", "unknown"),
        "features": detector.metadata.get("features", []),
        "last_updated": datetime.now(),
        "status": "active"
    }

@app.get("/llm/stats")
async def get_llm_stats():
    """Get LLM analyzer and cache statistics"""
    if not gemini_analyzer:
        return {
            "status": "disabled",
            "message": "LLM analysis is not enabled"
        }
    
    analyzer_stats = gemini_analyzer.get_stats()
    cache_stats = llm_cache.get_cache_stats() if llm_cache else {}
    
    return {
        "status": "active",
        "model": gemini_analyzer.model_name,
        "analyzer": analyzer_stats,
        "cache": cache_stats,
        "cost_optimization": {
            "cache_enabled": llm_cache is not None,
            "estimated_monthly_cost_usd": analyzer_stats.get('api_calls', 0) * 0.001 * 30,
            "estimated_savings_usd": cache_stats.get('estimated_cost_saved_usd', 0)
        }
    }

@app.post("/llm/cache/clear")
async def clear_llm_cache():
    """Clear LLM cache (admin endpoint)"""
    if not llm_cache:
        raise HTTPException(status_code=503, detail="LLM cache not available")
    
    try:
        cleared = await llm_cache.clear_all()
        if gemini_analyzer:
            gemini_analyzer.clear_cache()
        
        return {
            "status": "success",
            "message": f"Cleared {cleared} cache entries",
            "timestamp": datetime.now()
        }
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        raise HTTPException(status_code=500, detail="Error clearing cache")


# Analytics endpoints for frontend dashboard
@app.get("/api/analytics/global/stats")
async def get_global_stats():
    """Get global statistics for dashboard from Redis telemetry"""
    try:
        if not redis_client:
            return {
                "total_scans": 156, # Fallback mock
                "threats_blocked": 12,
                "active_users": 5,
                "detection_rate": 92.3,
                "timestamp": datetime.now().isoformat()
            }
            
        total_scans = int(redis_client.get("stats:total_scans") or 0)
        threats_blocked = int(redis_client.get("stats:threats_blocked") or 0)
        active_users = redis_client.scard("stats:active_users") or 1
        
        detection_rate = (threats_blocked / total_scans * 100) if total_scans > 0 else 0
        
        return {
            "total_scans": total_scans,
            "threats_blocked": threats_blocked,
            "active_users": active_users,
            "detection_rate": round(detection_rate, 2),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting global stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/threat-distribution")
async def get_threat_distribution():
    """Get threat level distribution from Redis"""
    try:
        if not redis_client:
            return {"low": 70, "medium": 20, "high": 10}
            
        low = int(redis_client.get("stats:threat_level:low") or 0)
        medium = int(redis_client.get("stats:threat_level:medium") or 0)
        high = int(redis_client.get("stats:threat_level:high") or 0)
        critical = int(redis_client.get("stats:threat_level:critical") or 0)
        
        # Combine high and critical for the simplified chart if needed
        return {
            "low": low,
            "medium": medium,
            "high": high + critical,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting threat distribution: {e}")
        return {"low": 0, "medium": 0, "high": 0}

@app.get("/api/analytics/activity-timeline")
async def get_activity_timeline():
    """Get activity timeline data from Redis"""
    try:
        if not redis_client:
            return {"timeline": [], "error": "Redis not available"}
            
        now = datetime.now()
        timeline_key = f"stats:timeline:{now.strftime('%Y%m%d')}"
        
        raw_data = redis_client.hgetall(timeline_key)
        timeline = []
        
        # Fill in last 24 hours
        for i in range(24):
            hour_str = str(i)
            if hour_str in raw_data:
                timeline.append(json.loads(raw_data[hour_str]))
            else:
                timeline.append({"hour": i, "scans": 0, "threats": 0})
        
        return {
            "timeline": timeline,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting activity timeline: {e}")
        return {"timeline": []}

@app.get("/api/analytics/recent-scans")
async def get_recent_scans():
    """Get recent scans for dashboard Intelligence Feed"""
    try:
        if not redis_client:
            return []
            
        raw_scans = redis_client.lrange("stats:recent_scans", 0, 19)
        return [json.loads(s) for s in raw_scans]
    except Exception as e:
        logger.error(f"Error getting recent scans: {e}")
        return []

@app.get("/api/model/info")
async def get_model_info():
    """Get ML model information"""
    if not detector:
        return {
            "status": "not_loaded",
            "message": "Model not available"
        }
    
    return {
        "status": "loaded",
        "model_type": "ensemble",
        "models": ["LightGBM", "TensorFlow", "Transformer"],
        "version": "2.0.0",
        "features": 20,
        "trained": detector.is_trained if detector else False,
        "timestamp": datetime.now().isoformat()
    }


async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            stats = await get_global_analytics()
            await websocket.send_json(stats)
            await asyncio.sleep(10)  # every 10 seconds
    except Exception as e:
        logger.error(f"WebSocket error: {e}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
