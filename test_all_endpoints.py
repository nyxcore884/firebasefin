import requests

# Get project ID
PROJECT_ID = "studio-9381016045-4d625"

# Firebase Functions Gen 2 URLs (derived from function names)
endpoints = [
    f"https://us-central1-{PROJECT_ID}.cloudfunctions.net/ingest_data",
    f"https://us-central1-{PROJECT_ID}.cloudfunctions.net/ai_query_api",
    f"https://us-central1-{PROJECT_ID}.cloudfunctions.net/process_transaction",
    # Also try Cloud Run URLs (kebab-case)
    f"https://ingest-data-nbchxauaca-uc.a.run.app",
    # Hosting rewrites
    f"https://{PROJECT_ID}.web.app/api/ingest",
    f"https://{PROJECT_ID}.web.app/api/query",
]

print("Testing Cloud Function / Hosting accessibility...")
print("=" * 60)

for url in endpoints:
    try:
        resp = requests.post(url, json={"ping": "pong"}, timeout=10)
        content_type = resp.headers.get('Content-Type', '')
        is_html = 'html' in content_type.lower() or resp.text.startswith('<!DOCTYPE')
        
        status = f"[{resp.status_code}]"
        if is_html:
            status += " [HTML Response - Likely 404 fallback]"
        
        print(f"{status} {url}")
        if not is_html:
            print(f"    -> {resp.text[:100]}")
    except Exception as e:
        print(f"[FAIL] {url}")
        print(f"    -> {e}")
    print()
