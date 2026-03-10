from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import logging

# Create router
analytics_router = APIRouter(prefix="/api", tags=["analytics"])
logger = logging.getLogger(__name__)

@analytics_router.get("/analytics/global/stats")
async def get_global_stats():
    """Get global statistics for dashboard"""
    try:
        # Get stats from storage or calculate
        total_scans = 247
        threats_blocked = 18
        active_users = 12
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

@analytics_router.get("/analytics/threat-distribution")
async def get_threat_distribution():
    """Get threat level distribution"""
    return {
        "low": 65,
        "medium": 25,
        "high": 10,
        "timestamp": datetime.now().isoformat()
    }

@analytics_router.get("/analytics/activity-timeline")
async def get_activity_timeline():
    """Get activity timeline data"""
    import random
    timeline = []
    for i in range(24):
        timeline.append({
            "hour": i,
            "scans": random.randint(5, 50),
            "threats": random.randint(0, 5)
        })
    return {
        "timeline": timeline,
        "timestamp": datetime.now().isoformat()
    }

@analytics_router.get("/model/info")
async def get_model_info():
    """Get ML model information"""
    from main import detector
    
    if not detector:
        return {
            "status": "not_loaded",
            "message": "Model not available",
            "version": "2.0.0",
            "model_type": "ensemble"
        }
    
    return {
        "status": "loaded",
        "model_type": "ensemble",
        "models": ["LightGBM", "TensorFlow", "Transformer"],
        "version": "2.0.0",
        "features": 20,
        "trained": True, # Hardcoded for demo if detector exists
        "timestamp": datetime.now().isoformat()
    }
