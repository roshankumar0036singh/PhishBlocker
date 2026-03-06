import asyncio
import os
import sys

# Ensure src is in python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from src.api.threat_intelligence import ThreatIntelligenceAggregator

import logging

# Configure logging to see output from the aggregator
logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(name)s:%(message)s')

async def test_threat_intel():
    print("Initializing without API keys to ensure safe fallback...")
    # Clean env just in case
    os.environ.pop("GOOGLE_SAFE_BROWSING_API_KEY", None)
    os.environ.pop("VIRUSTOTAL_API_KEY", None)
    
    intel = ThreatIntelligenceAggregator()
    
    print("Testing legitimate URL (no keys)...")
    res1 = await intel.check_url("https://google.com")
    print(res1)
    
    print("Testing malicious URL (no keys, no offline cache loaded yet)...")
    res2 = await intel.check_url("http://evil-phishing.com")
    print(res2)
    
    # Mock offline cache
    intel.cache[intel._hash_url("http://offline-evil.com")] = {
        'url': "http://offline-evil.com",
        'source': 'phishtank',
        'type': 'phishing',
        'confidence': 0.9
    }
    
    print("Testing offline known malicious URL...")
    res3 = await intel.check_url("http://offline-evil.com")
    print(res3)
    print("Offline detection working:", res3.get("is_known_threat"))
    
    print("\nAggregator Stats:")
    import json
    print(json.dumps(intel.get_stats(), indent=2, default=str))
    
if __name__ == "__main__":
    asyncio.run(test_threat_intel())
