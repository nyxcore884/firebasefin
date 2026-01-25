import requests
import json

PROJECT_ID = "studio-9381016045-4d625"
url = f"https://{PROJECT_ID}.web.app/api/process_transaction/metrics"

print("--- Testing Hierarchy Builder ---")
response = requests.post(url, json={
    'action': 'hierarchy',
    'company_id': 'SGG-001',
    'company_name': 'SOCAR Georgia'
}, timeout=30)

if response.status_code == 200:
    data = response.json()
    hier = data.get('data', [])
    print(f"Status: {data.get('status')}")
    if hier:
        company = hier[0]
        print(f"Company: {company['name']}")
        depts = company['subsidiaries'][0]['departments']
        print(f"Departments Found: {len(depts)}")
        for d in depts:
            print(f"  - {d['name']}")
    else:
        print("No hierarchy data returned.")
else:
    print(f"Error: {response.status_code} - {response.text[:200]}")
