import requests
import json

def test_financial_engine_actions():
    url = "http://127.0.0.1:5001/firebasefin-main/us-central1/financial_engine"
    
    # Test Companies Action
    print("Testing 'companies' action...")
    payload_companies = {
        "action": "companies",
        "data": []
    }
    try:
        response = requests.post(url, json=payload_companies)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error testing companies: {e}")

    # Test Consolidation Action
    print("\nTesting 'consolidation' action...")
    payload_consolidation = {
        "action": "consolidation",
        "company_ids": ["SGG-001", "SGG-002"],
        "data": []
    }
    try:
        response = requests.post(url, json=payload_consolidation)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error testing consolidation: {e}")

if __name__ == "__main__":
    test_financial_engine_actions()
