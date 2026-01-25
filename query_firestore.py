"""
Query Firestore to see what data is actually stored in financial_transactions collection.
This will reveal:
1. What company_id values exist
2. What date values exist
3. Sample document structure
"""
import requests

# Use the deployed process_transaction endpoint directly to get metrics
# This is the same endpoint the Dashboard uses

PROJECT_ID = "studio-9381016045-4d625"
url = f"https://{PROJECT_ID}.web.app/api/process_transaction/metrics"

# Try different company_id values
for company in ['SGG-001', 'SGG-002', 'SGG-003', 'SOG']:
    print(f"\n--- Querying company_id: {company} ---")
    response = requests.post(url, json={
        'action': 'metrics',
        'company_id': company,
        'period': '2023-11'
    }, timeout=30)
    
    if response.status_code == 200:
        data = response.json()
        metrics = data.get('metrics', {})
        print(f"  Revenue: {metrics.get('revenue', 0)}")
        print(f"  Net Income: {metrics.get('net_income', 0)}")
        print(f"  Assets: {metrics.get('assets', 0)}")
    else:
        print(f"  Error: {response.status_code} - {response.text[:100]}")

# Also try without any period filter
print("\n--- Querying with no period filter ---")
response = requests.post(url, json={
    'action': 'metrics',
    'company_id': 'SGG-001'
}, timeout=30)

if response.status_code == 200:
    data = response.json()
    print(f"  Status: {data.get('status')}")
    print(f"  Metrics: {data.get('metrics', {})}")
else:
    print(f"  Error: {response.status_code}")
