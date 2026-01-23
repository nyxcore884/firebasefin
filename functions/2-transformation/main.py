import os
import json
import logging
import csv
import io
from firebase_functions import pubsub_fn, options
from google.cloud import firestore

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize
db = None

def get_db():
    global db
    if db is None:
        db = firestore.Client()
    return db

def process_july_sgg(data):
    """
    Specific transformation logic for July SGG dataset.
    Expects data as a list of dicts.
    """
    transformed = []
    for row in data:
        # Example transformation: Normalize keys and types
        try:
            entry = {
                "transaction_id": row.get("id"),
                "date": row.get("date"),
                "amount": float(row.get("amount", 0)),
                "description": row.get("description", ""),
                "category": row.get("category", "General"),
                "status": "transformed"
            }
            transformed.append(entry)
        except Exception as e:
            logger.warning(f"Skipping row due to error: {e}")
            continue
    return transformed

@pubsub_fn.on_message_published(
    topic="files-to-process",
    region="us-central1",
    memory=options.MemoryOption.MB_256,
    timeout_sec=60
)
def transform_and_load_data(event: pubsub_fn.CloudEvent[pubsub_fn.MessagePublishedData]) -> None:
    """
    Triggered by messages on 'files-to-process' topic.
    Performs data transformation and loads into Firestore.
    """
    try:
        # Decode Pub/Sub message
        import base64
        message_data = base64.b64decode(event.data.message.data).decode("utf-8")
        payload = json.loads(message_data)
        
        file_source = payload.get("source", "unknown")
        raw_data = payload.get("data")
        
        logger.info(f"[TRANSFORMATION] Processing data from {file_source}...")
        
        # 1. Transformation Logic
        # (Simplified for demonstration - could branch based on file_source)
        if isinstance(raw_data, list):
            transformed_data = process_july_sgg(raw_data)
        else:
            logger.warning(f"[TRANSFORMATION] Unsupported data format from {file_source}")
            return

        # 2. Load to Firestore
        if transformed_data:
            db_client = get_db()
            batch = db_client.batch()
            collection_ref = db_client.collection("financial_records")
            
            for item in transformed_data:
                doc_ref = collection_ref.document()
                batch.set(doc_ref, item)
            
            batch.commit()
            logger.info(f"[TRANSFORMATION] Successfully loaded {len(transformed_data)} records to Firestore.")
        else:
            logger.info("[TRANSFORMATION] No data to load.")

    except Exception as e:
        logger.error(f"[TRANSFORMATION] Critical Error: {e}", exc_info=True)
