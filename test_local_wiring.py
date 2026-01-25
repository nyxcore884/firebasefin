import requests
import json
import os

# Target Local Emulator
URL = "http://127.0.0.1:5001/studio-9381016045-4d625/us-central1/process_transaction"

def test_local_wired():
    print("🔍 Testing Local Full-Stack Wiring...")
    
    payload = {
        "action": "metrics",
        "company_id": "SGG-001",
        "period": "2023-11",
        "target_currency": "GEL"
    }
    
    try:
        response = requests.post(URL, json=payload, timeout=10)
        print(f"📡 API Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("✅ Backend is ALIVE and responding.")
            print(f"📊 Metrics Received: {json.dumps(data.get('metrics'), indent=2)}")
            print(f"🔗 Reconciliation: {data.get('reconciliation', {}).get('equation')}")
            return True
        else:
            print(f"❌ Backend returned error: {response.text}")
    except Exception as e:
        print(f"❌ Failed to connect to Local Emulator: {e}")
        print("💡 Ensure 'firebase emulators:start' is running in a terminal.")
        
    return False

if __name__ == "__main__":
    test_local_wired()
