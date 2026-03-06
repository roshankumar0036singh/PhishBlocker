import asyncio
import os
import sys

# Ensure src is in python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from src.api.main import URLRequest, scan_url

# We will mock the detector since we don't have a live FastAPI app running in this context easily
# Instead of booting the full server, we can write a quick requests-based test or just a simple async call 
# given detector is injected globally. However, because main.py requires startup_event(), 
# it's best to run a quick test using FastAPI's TestClient
import pytest
from fastapi.testclient import TestClient
from src.api.main import app, startup_event

async def run_dom_test():
    # Force initialization
    await startup_event()
    
    with TestClient(app) as client:
        print("--- Testing normal URL without DOM ---")
        res1 = client.post("/scan", json={
            "url": "http://example.com"
        })
        print(res1.json())
        
        print("\n--- Testing URL with highly suspicious DOM metadata ---")
        res2 = client.post("/scan", json={
            "url": "http://example.com",
            "dom_data": {
                "has_password_field": True,
                "hidden_iframes": 2,
                "suspicious_scripts": 1,
                "brand_indicators": ["paypal"]
            }
        })
        print(res2.json())
        
        data2 = res2.json()
        assert "Password field on insecure HTTP connection" in data2.get("risk_factors", [])
        assert data2.get("is_phishing") == True
        print("DOM payload properly flagged the site as phishing.")

if __name__ == "__main__":
    asyncio.run(run_dom_test())
