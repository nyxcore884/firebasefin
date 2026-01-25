import requests
import json

def test_report_action():
    url = "http://127.0.0.1:5001/firebasefin-main/us-central1/financial_engine"
    
    # Payload for the 'report' action
    payload = {
        "action": "report",
        "data": [
            {"category": "Revenue", "amount_gel": 100000, "department": "Sales"},
            {"category": "Opex", "amount_gel": 50000, "department": "Logistics"},
            {"category": "Opex", "amount_gel": 10000, "department": "HR"},
            {"category": "Tax", "amount_gel": 5000, "department": "Finance"}
        ]
    }
    
    print("Testing 'report' action...")
    try:
        response = requests.post(url, json=payload)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error testing report: {e}")

if __name__ == "__main__":
    test_report_action()
