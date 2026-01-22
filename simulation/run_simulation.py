import time
import requests
import json
from google.cloud import storage, firestore, pubsub_v1
import os

# Configuration (Ensure you have Google Cloud Credentials set up locally)
PROJECT_ID = os.environ.get("GCP_PROJECT", "your-project-id") # Replace with actual if known or let env handle
BUCKET_NAME = "raw-financial-data-ingestion"
TOPIC_ID = "files-to-process"
API_BASE_URL = "http://127.0.0.1:5001/api" # Or your deployed URL

# Init Clients
try:
    storage_client = storage.Client()
    db = firestore.Client()
    publisher = pubsub_v1.PublisherClient()
except Exception as e:
    print(f"Warning: Could not initialize GCP clients. Ensure credentials are set. Error: {e}")

def print_header(text):
    print(f"\n{'='*50}\n{text}\n{'='*50}")

def step_1_upload_malformed_csv():
    print_header("Step 1: The 'Clumsy' User Upload (Self-Healing Test)")
    
    malformed_csv = """transaction_id,dates,amt,desc
tx_101,2024/01/01,$50000.00,Contract Payment
tx_102,Jan 02 2024,1200,Office Supplies
tx_103,2024-01-03,$100,500.00,Offshore Consulting Services (Misc)"""
    
    file_name = "clumsy_upload_simulation.csv"
    try:
        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(file_name)
        blob.upload_from_string(malformed_csv, content_type="text/csv")
        print(f"[Ghost User] Uploaded '{file_name}' with bad dates and currency symbols.")
        return file_name
    except Exception as e:
        print(f"[Ghost User] Upload FAILED: {e}")
        return None

def step_2_monitor_ingestion_and_transformation(file_name):
    print_header("Step 2: Checking Ingestion & Self-Healing")
    
    if not file_name: return False
    
    print("[Ghost User] Waiting for AI to heal the data...")
    # In a real sim, we might poll the 'files-to-process' topic or check the bucket for a replaced file,
    # or check the 'transactions' table/collection if transformation ran.
    
    # Let's check Firestore for the result of Transformation
    # Transformation writes to 'sgg_transactions' (or 'financial_transactions' depending on update) based on the code.
    # The updated transformation code didn't explicitly show the Firestore write collection change, 
    # but the previous summary said 'sgg_transactions'.
    
    max_retries = 10
    for i in range(max_retries):
        try:
            # We query for one of the expected IDs from the healed data
            docs = db.collection("sgg_transactions").where("transaction_id", "==", "tx_101").limit(1).stream()
            found = list(docs)
            
            if found:
                print(f"[Ghost User] SUCCESS! Found healed transaction 'tx_101' in Firestore.")
                print(f"Data: {found[0].to_dict()}")
                return True
        except Exception as e:
            print(f"Error checking Firestore: {e}")
        
        print(f"Waiting... ({i+1}/{max_retries})")
        time.sleep(3)
        
    print("[Ghost User] FAILED: Transaction not found in Firestore after timeout.")
    return False

def step_3_check_governance_alerts():
    print_header("Step 3: Auditor Agent Check (Governance)")
    
    # We expect 'tx_103' to flag 'Offshore' or 'High Value'? 
    # The malformed data had 'Offshore Consulting Services' and '$100,500.00' (if healed correctly to 100500.0)
    
    print("[Ghost User] Checking 'compliance_alerts' for flags...")
    
    # Allow some time for the concurrent subscriber to pick it up
    time.sleep(5)
    
    try:
        docs = db.collection("compliance_alerts").order_by("timestamp", direction=firestore.Query.DESCENDING).limit(5).stream()
        
        alerts_found = False
        for doc in docs:
            data = doc.to_dict()
            print(f"[Alert Found]: {data.get('detected_risks')}")
            if any("High Value" in str(r) or "Offshore" in str(r) for r in data.get('detected_risks', [])):
                alerts_found = True
                
        if alerts_found:
            print("[Ghost User] SUCCESS! Governance Auditor caught the suspicious transaction.")
        else:
            print("[Ghost User] WARNING: No alerts found. Check Governance Function.")
    except Exception as e:
        print(f"Error checking alerts: {e}")

def step_4_sim_ai_query():
    print_header("Step 4: Executive Query (Generative UI)")
    
    query = "Show me high value transactions and check for fraud risks."
    print(f"[Ghost User] Asking AI: '{query}'")
    
    # Assuming local emulator or deployed URL
    # For simulation script, we might just print what we WOULd do if we can't easily hit the auth-protected endpoint without a token.
    # But if we assume using `gcloud auth print-identity-token` is too complex for this script, we can skip or try.
    
    print("(Skipping actual HTTP call in this standalone script due to Auth complexity, but logically this follows.)")
    print("Expected Output: A JSON response with 'ui_component': 'alert_box' and 'narrative'.")

if __name__ == "__main__":
    print("Starting End-to-End Simulation...")
    try:
        file_name = step_1_upload_malformed_csv()
        if step_2_monitor_ingestion_and_transformation(file_name):
            step_3_check_governance_alerts()
            step_4_sim_ai_query()
    except Exception as e:
        print(f"[CRITICAL FAILURE] {e}")
