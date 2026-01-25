"""
Test Dashboard metrics query with flexible filter
"""
import requests
import json

PROJECT_ID = "studio-9381016045-4d625"
url = f"https://{PROJECT_ID}.web.app/api/process_transaction/metrics"

# Test 1: Query with ONLY company_id (no period) - should return ALL data for that company
print("--- Test 1: Company only (no period) ---")
response = requests.post(url, json={
    'action': 'metrics',
    'company_id': 'SGG-001'
    # No period - triggers new fallback logic
}, timeout=30)

if response.status_code == 200:
    data = response.json()
    metrics = data.get('metrics', {})
    print(f"  Status: {data.get('status')}")
    print(f"  Revenue: {metrics.get('revenue', 0)}")
    print(f"  Net Income: {metrics.get('net_income', 0)}")
    print(f"  Assets: {metrics.get('assets', 0)}")
else:
    print(f"  Error: {response.status_code} - {response.text[:200]}")

# Test 2: Query with NO filters at all - should return ALL global data
print("\n--- Test 2: No filters (global) ---")
response = requests.post(url, json={
    'action': 'metrics'
    # No company_id or period - triggers global fallback
}, timeout=30)

if response.status_code == 200:
    data = response.json()
    metrics = data.get('metrics', {})
    print(f"  Status: {data.get('status')}")
    print(f"  Revenue: {metrics.get('revenue', 0)}")
    print(f"  Net Income: {metrics.get('net_income', 0)}")
    print(f"  Assets: {metrics.get('assets', 0)}")
else:
    print(f"  Error: {response.status_code} - {response.text[:200]}")
