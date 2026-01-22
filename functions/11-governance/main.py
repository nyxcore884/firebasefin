import functions_framework
import json
import base64
from google.cloud import firestore

db = firestore.Client()

@functions_framework.cloud_event
def audit_transaction_stream(cloud_event):
    """
    Trigger: Pub/Sub (same topic as Loader).
    Action: Passive monitoring. Flags risks to Firestore 'alerts' collection.
    """
    # Decode
    message_data = base64.b64decode(cloud_event.data["message"]["data"]).decode("utf-8")
    
    # Check if message is JSON (Clean) or Path (Raw)
    try:
        # User's new Ingestion sends JSON string
        record = json.loads(message_data)
        # If record is wrapped in "data" or "source", extract raw transaction logic
        # For simplicity, assuming record IS the data or we extract from it.
        # User Code snippet assumes 'record' has 'amount', 'id'.
        # The user's Ingestion publishes: {"source": file, "data": [rows...], "status": ...}
        # So we need to iterate rows if it's a batch.
        
        # Adaptation to handle user's structure which is a file-level event containing array
        if 'data' in record and isinstance(record['data'], list):
             process_batch(record['data'])
        elif isinstance(record, dict):
             # Single record
             process_batch([record])
             
    except json.JSONDecodeError:
        print(f"[AUDITOR] Received raw file path: {message_data}. Auditing unavailable for raw path without file read.")
        return

def process_batch(rows):
    alerts = []
    
    for record in rows:
        # Rule 1: High Value
        # Ensure ID exists or mock it
        tx_id = record.get('transaction_id', record.get('id', 'unknown'))
        
        try:
             amount = float(record.get('amount', 0))
        except:
             amount = 0
             
        if amount > 50000:
            alerts.append(f"High Value Transaction (> $50k): {tx_id}")
            
        # Rule 2: Risky Keywords
        risky_keywords = ["offshore", "shell", "casino"]
        desc = record.get('description', '').lower()
        if any(k in desc for k in risky_keywords):
            alerts.append(f"AML Risk Keyword Detected in {tx_id}")
            
    if alerts:
        print(f"[AUDITOR] Flagged {len(alerts)} risks.")
        db.collection("compliance_alerts").add({
            "detected_risks": alerts,
            "status": "open",
            "timestamp": firestore.SERVER_TIMESTAMP
        })
