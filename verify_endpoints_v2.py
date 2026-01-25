
import requests
import json

BASE_URL = "https://studio-9381016045-4d625.web.app"

print("=== VERIFICATION CHECKLIST RESULTS ===\n")

# 1. Ingestion (Checking for HTML vs JSON)
url = f"{BASE_URL}/api/ingest"
try:
    print(f"Checking Ingestion ({url})...")
    # Just checking reachability 
    resp = requests.post(url, timeout=10) 
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text[:300]}")
    
    # Check if HTML
    if "<!DOCTYPE html>" in resp.text or "<html" in resp.text:
        print("[FAIL] Endpoint returned HTML (Hosting Rewrite Miss)")
    else:
        print("[PASS] Endpoint returned API response")
        
except Exception as e:
    print(f"Error: {e}")

print("\n------------------------------------------------\n")
