import functions_framework
from firebase_functions import storage_fn, https_fn, options
import firebase_admin
from firebase_admin import initialize_app, firestore
import google.cloud.firestore as firestore_lib
from google.cloud import storage
import vertexai
from vertexai.generative_models import GenerativeModel, Part
import json
import os
import hashlib
from datetime import datetime

# Initialize Firebase Logic
if not firebase_admin._apps:
    initialize_app()

PROJECT_ID = os.environ.get("GCP_PROJECT", "firebasefin-main") 
LOCATION = "us-central1"

try:
    vertexai.init(project=PROJECT_ID, location=LOCATION)
except Exception as e:
    print(f"[DOC-ANALYSIS-INIT-ERROR] {e}")

# --- 1. HTTP Handler: On-demand Analysis ---

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["POST", "OPTIONS"]),
    timeout_sec=120,
    memory=options.MemoryOption.MB_512,
)
def analyze_document(req: https_fn.Request) -> https_fn.Response:
    """
    Analyzes a document using Vertex AI (Gemini 1.5 Flash).
    Request Body: { "fileUrl": string, "enquiry": string }
    """
    try:
        data = req.get_json(silent=True) or {}
        file_url = data.get('fileUrl', '')
        enquiry = data.get('enquiry', '')

        print(f"[DOC-ANALYSIS] Processing {file_url} with enquiry: '{enquiry}'")

        # Basic path extraction
        from urllib.parse import unquote
        try:
            path_part = unquote(file_url).split('/o/')[1].split('?')[0]
            bucket_name = "raw-financial-data-ingestion" # Default
            blob_name = path_part.replace(f"{bucket_name}/", "") 
        except:
             blob_name = file_url.split('%2F')[-1].split('?')[0]
             bucket_name = "raw-financial-data-ingestion"

        # Download
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(blob_name)
        content = blob.download_as_text(errors='ignore')[:30000]

        # Call Gemini
        model = GenerativeModel("gemini-1.5-flash-001")
        prompt = f"""
        You are a Senior Financial Analyst. 
        Analyze the following financial document content based on the user's enquiry.
        DOCUMENT CONTENT: {content}
        USER ENQUIRY: "{enquiry}"
        Return a valid JSON object with keys: "insight", "metrics" (variance, impact, confidence).
        """

        response = model.generate_content(prompt)
        text_response = response.text.replace('```json', '').replace('```', '').strip()
        
        try:
            ai_data = json.loads(text_response)
        except:
            ai_data = {"insight": text_response, "metrics": { "variance": "N/A", "impact": "N/A", "confidence": "Low" }}

        result = {
            "status": "success",
            "file": blob_name,
            "insight": ai_data.get('insight', 'Analysis Complete'),
            "metrics": ai_data.get('metrics', {})
        }
        return https_fn.Response(json.dumps(result), status=200, headers={"Content-Type": "application/json"})

    except Exception as e:
        print(f"[DOC-ANALYSIS-ERROR] {e}")
        return https_fn.Response(json.dumps({"error": str(e)}), status=500, headers={"Content-Type": "application/json"})

# --- 2. Storage Trigger: Automatic Indexing ---

@storage_fn.on_object_finalized()
def process_document_upload(event: storage_fn.CloudEvent[storage_fn.StorageObjectData]) -> None:
    """
    Trigger: Upload to bucket.
    """
    data = event.data
    file_name = data.name
    bucket_name = data.bucket
    
    parts = file_name.split("/")
    dataset_id = parts[0] if len(parts) > 1 else file_name.rsplit('.', 1)[0]
    uploaded_at = datetime.utcnow().isoformat()
    version_hash = hashlib.sha256(f"{file_name}:{uploaded_at}".encode()).hexdigest()[:12]

    db = firestore.client()

    # Register dataset
    db.collection("dataset_registry").document(dataset_id).set({
        "dataset_id": dataset_id,
        "source": "document_upload",
        "current_version": version_hash,
        "locked": False,
        "updated_at": firestore_lib.SERVER_TIMESTAMP
    }, merge=True)

    # Audit log
    db.collection("audit_log").add({
        "event": "DOCUMENT_UPLOADED",
        "dataset_id": dataset_id,
        "dataset_version": version_hash,
        "file_name": file_name,
        "bucket": bucket_name,
        "timestamp": firestore_lib.SERVER_TIMESTAMP
    })

    # Knowledge indexing fragment
    db.collection("knowledge_base").add({
        "dataset_id": dataset_id,
        "dataset_version": version_hash,
        "content": f"Document {file_name} was indexed for financial review.",
        "source_file": file_name,
        "scope": "supporting_document",
        "created_at": firestore_lib.SERVER_TIMESTAMP
    })
    print(f"[FINANCE] Document indexed: {dataset_id}")
