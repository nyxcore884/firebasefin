import requests
import json

PROJECT_ID = "studio-9381016045-4d625"
url = f"https://{PROJECT_ID}.web.app/api/process_transaction/anomalies"

print("--- Testing Anomaly Detection Engine ---")
response = requests.post(url, json={
    'action': 'anomalies',
    'company_id': 'SGG-001'
}, timeout=30)

if response.status_code == 200:
    data = response.json()
    anomalies = data.get('anomalies', [])
    print(f"Status: {data.get('status')}")
    print(f"Anomalies Count: {len(anomalies)}")
    for a in anomalies[:3]:
        print(f" - [{a['severity']}] {a['type']}: {a['description']}")
else:
    print(f"Error: {response.status_code} - {response.text[:200]}")
