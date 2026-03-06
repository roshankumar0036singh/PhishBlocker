import asyncio
import os
import sys

# Ensure src is in python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from fastapi.testclient import TestClient
from src.api.main import app, startup_event

async def test_ensemble_scoring():
    # Initialize all components
    await startup_event()
    
    with TestClient(app) as client:
        # 1. Test a clear homograph attack
        # 'google.com' vs 'g00gle.com' or using cyrillic 'a' (аpple.com)
        url_homo = "https://аpple.com" # Cyrillic 'а'
        print(f"--- Testing Homograph: {url_homo} ---")
        res1 = client.post("/scan", json={"url": url_homo})
        data1 = res1.json()
        print(f"DEBUG: Response data: {data1}")
        if 'detail' in data1:
            print(f"API Error: {data1['detail']}")
        else:
            print(f"Prediction: {data1['threat_level']}, Confidence: {data1['confidence']:.3f}")
            print(f"Risk Factors: {data1['risk_factors']}")
        
        # 2. Test a suspicious lexical URL
        url_lex = "http://verify-bank-account-update.temporary-domain.com/login"
        print(f"\n--- Testing Lexical Phishing: {url_lex} ---")
        res2 = client.post("/scan", json={"url": url_lex})
        data2 = res2.json()
        print(f"Prediction: {data2['threat_level']}, Confidence: {data2['confidence']:.3f}")
        print(f"Risk Factors: {data2['risk_factors']}")
        
        # 3. Test a safe URL
        url_safe = "https://google.com"
        print(f"\n--- Testing Safe URL: {url_safe} ---")
        res3 = client.post("/scan", json={"url": url_safe})
        data3 = res3.json()
        print(f"Prediction: {data3['threat_level']}, Confidence: {data3['confidence']:.3f}")

if __name__ == "__main__":
    asyncio.run(test_ensemble_scoring())
