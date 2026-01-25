
import requests
import pandas as pd
import io
import json

# 1. Create a "Cross-Tab" Excel File with NOVEMBER data (matches Dashboard period 2023-11)
data = {
    "Description": ["Test Expense", "Test Revenue"],
    "GL Account": ["5-001", "4-001"],
    "Company": ["SGG-001", "SGG-001"],
    "November": [1000, 5000],  # Changed from January
    "December": [2000, 6000],  # Changed from February
}

df = pd.DataFrame(data)
file_buffer = io.BytesIO()
with pd.ExcelWriter(file_buffer, engine='openpyxl') as writer:
    df.to_excel(writer, index=False)
file_buffer.seek(0)

# 2. Upload to Cloud Endpoint
url = "https://studio-9381016045-4d625.web.app/api/ingest"
files = {'file': ('test_payload.xlsx', file_buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}

print(f"Uploading request to {url}...")
try:
    resp = requests.post(url, files=files, timeout=60)
    print(f"Status: {resp.status_code}")
    print("Response:")
    print(resp.text)
except Exception as e:
    print(f"Error: {e}")
