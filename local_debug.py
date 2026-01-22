
import base64
import json
import os
from unittest.mock import MagicMock
import firebase_admin
from firebase_admin import credentials, firestore

# --- Local Firestore Emulator Setup ---
os.environ["FIRESTORE_EMULATOR_HOST"] = "localhost:8080"
if not firebase_admin._apps:
    cred = credentials.Anonymous()
    firebase_admin.initialize_app(cred, {"projectId": "test-project"})

# --- Import the function to test ---
from functions.data_transformation.main import transform_and_load_data

# --- Mock Pub/Sub Event ---
def create_mock_event(data):
    """Creates a mock Pub/Sub event dictionary."""
    return {
        "data": base64.b64encode(json.dumps(data).encode("utf-8")),
    }

# --- Test Data ---
test_data = {
    "metadata": {
        "gcsPath": "gs://raw-financial-data-ingestion/July SGG (1).csv",
        "documentType": "TRANSACTION_LOG_SGG",
        "correlationId": "local-debug-run"
    }
}

# --- Create Mock Event and Context ---
mock_event = create_mock_event(test_data)
mock_context = MagicMock()

# --- Run the Function ---
try:
    transform_and_load_data(mock_event, mock_context)
    print("Function executed successfully.")
except Exception as e:
    print(f"An error occurred: {e}")

# --- Verify Firestore ---
try:
    db = firestore.client()
    collections = [col.id for col in db.collections()]
    print(f"Collections in local Firestore: {collections}")
    if "july_sgg_transactions" in collections:
        print("Success: 'july_sgg_transactions' collection was created.")
    else:
        print("Failure: 'july_sgg_transactions' collection was NOT created.")
except Exception as e:
    print(f"Error connecting to Firestore or listing collections: {e}")
