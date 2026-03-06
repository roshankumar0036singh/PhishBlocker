import sys
import os

# Add src to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from fastapi.testclient import TestClient
from src.api.main import app, startup_event
import asyncio

async def test_form_hijacking():
    # Initialize components
    await startup_event()
    
    client = TestClient(app)
    url = "https://example-phish.com/login"
    payload = {
        "url": url,
        "dom_data": {
            "has_password_field": True,
            "brand_indicators": ["suspicious_form_action:attacker-collector.com"]
        }
    }
    
    response = client.post("/scan", json=payload)
    print(f"Status: {response.status_code}")
    if response.status_code != 200:
        print(f"Error Response: {response.text}")
        return
        
    data = response.json()
    print(f"Is Phishing: {data['is_phishing']}")
    print(f"Confidence: {data['confidence']}")
    print(f"Threat Level: {data['threat_level']}")
    print(f"Risk Factors: {data['risk_factors']}")

if __name__ == "__main__":
    asyncio.run(test_form_hijacking())
