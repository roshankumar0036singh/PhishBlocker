import asyncio
import httpx
import json

async def test_xposed_integration():
    identifier = "test@example.com"
    url = f"https://api.xposedornot.com/v1/check-email/{identifier}"
    print(f"Testing XposedOrNot API for: {identifier}")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=10.0)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("Response JSON:")
                print(json.dumps(data, indent=2))
                
                breaches = data.get("breaches", [])
                if breaches and isinstance(breaches[0], list):
                    breaches = breaches[0]
                
                print(f"Breaches found: {len(breaches)}")
                for b in breaches[:5]:
                    print(f"- {b}")
            elif response.status_code == 404:
                print("No breaches found (Clean).")
            else:
                print(f"Unexpected response: {response.text}")
                
        except Exception as e:
            print(f"Request failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_xposed_integration())
