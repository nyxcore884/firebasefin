<<<<<<< Updated upstream
import functions_framework
from google.cloud import storage
import vertexai
from vertexai.generative_models import GenerativeModel, Part
import json
import os

# Initialize Vertex AI
PROJECT_ID = os.environ.get("GCP_PROJECT", "firebasefin-main") 
LOCATION = "us-central1"

try:
    vertexai.init(project=PROJECT_ID, location=LOCATION)
except Exception as e:
    print(f"[DOC-ANALYSIS-INIT-ERROR] {e}")

@functions_framework.http
def analyze_document(request):
    """
    Analyzes a document using Vertex AI (Gemini 1.5 Flash).
    Request Body: { "fileUrl": string, "enquiry": string }
    """
    
    # CORS
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    headers = { 'Access-Control-Allow-Origin': '*' }

    try:
        request_json = request.get_json(silent=True)
        file_url = request_json.get('fileUrl', '') # Expected: https://firebasestorage.googleapis.com/.../o/raw-financial-data-ingestion%2Ffilename?alt...
        enquiry = request_json.get('enquiry', '')

        print(f"[DOC-ANALYSIS] Processing {file_url} with enquiry: '{enquiry}'")

        # 1. Parse Bucket and Filename from URL (Simplified logic for Firebase Storage URLs)
        # OR assume we just get the filename if passed as ID. 
        # For robustness, let's assume the frontend passes the FULL download URL, 
        # but we need the GCS path to read it via Storage Client comfortably or we just download via HTTP.
        # However, Storage Client is safer for auth. 
        # Let's try to extract filename from the URL decoding.
        
        # Hacky extraction for "raw-financial-data-ingestion%2F<filename>"
        try:
            from urllib.parse import unquote
            path_part = unquote(file_url).split('/o/')[1].split('?')[0]
            bucket_name = "raw-financial-data-ingestion" # Known bucket
            blob_name = path_part.replace(f"{bucket_name}/", "") 
            # If path_part was "raw-financial-data-ingestion/file.txt"
        except:
             # Fallback: just use what's likely the filename if logic fails, or expect frontend to pass keys
             # For MVP, let's assume we can read the file directly if we knew the name.
             blob_name = file_url.split('%2F')[-1].split('?')[0] # Very rough
             bucket_name = "raw-financial-data-ingestion"

        # 2. Download File Content
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(blob_name)
        
        try:
            content = blob.download_as_text()
        except:
            # Fallback for binary or error
            content = f"Binary file: {blob_name} (Content not readable as text)"

        # 3. Call Gemini
        model = GenerativeModel("gemini-1.5-flash-001")
        
        prompt = f"""
        You are a Senior Financial Analyst. 
        Analyze the following financial document content based on the user's enquiry.
        
        DOCUMENT CONTENT:
        {content[:30000]} 
        (Truncated if too long)

        USER ENQUIRY:
        "{enquiry}"

        OUTPUT FORMAT:
        Return a valid JSON object ONLY, with these keys:
        - "insight": A clear, professional summary answering the enquiry (max 2 sentences).
        - "metrics": Object containing:
            - "variance": The calculated variance percentage (string).
            - "impact": Financial impact text (string).
            - "confidence": "High", "Medium", or "Low".
        """

        response = model.generate_content(prompt)
        text_response = response.text.replace('```json', '').replace('```', '').strip()
        
        # 4. Return Result
        try:
            ai_data = json.loads(text_response)
        except:
            # Fallback if AI didn't return valid JSON
            ai_data = {
                "insight": text_response,
                "metrics": { "variance": "N/A", "impact": "N/A", "confidence": "Low" }
            }

        result = {
            "status": "success",
            "file": blob_name,
            "insight": ai_data.get('insight', 'Analysis Complete'),
            "metrics": ai_data.get('metrics', {})
        }

        return (json.dumps(result), 200, headers)

    except Exception as e:
        print(f"[DOC-ANALYSIS-ERROR] {e}")
        return (json.dumps({"error": str(e)}), 500, headers)
=======
from firebase_functions import storage_fn
from firebase_admin import initialize_app, firestore
import google.cloud.firestore as firestore_lib
import hashlib
from datetime import datetime

# Initialize Firebase Logic
# Check if already initialized to avoid errors in hot reloads
try:
    if not firebase_admin._apps:
        initialize_app()
except Exception as e:
    # During deployment analysis, credentials might be missing.
    # We suppress this to allow the deploy to finish.
    # At runtime in Cloud, this will work.
    print(f"Warning: Firebase Init skipped (Deployment mode?): {e}")

# Global placeholders
_db = None

def get_db():
    global _db
    if _db is None:
        try:
            # Only initialize if not already done
            if not firebase_admin._apps:
                initialize_app()
            _db = firestore.client()
        except Exception as e:
            # During deployment analysis, this will fail.
            # We must not crash here or deployment fails.
            print(f"Lazy Init Warning: {e}")
            return None
    return _db

@storage_fn.on_object_finalized()
def process_document_upload(event: storage_fn.CloudEvent[storage_fn.StorageObjectData]) -> None:
    """
    Trigger: Upload to 'financial-docs' bucket.
    Action:
      - Register document as financial evidence
      - Bind to dataset_id + version
      - Index content for AI (non-authoritative)
      - Write audit trail
    """

    data = event.data
    file_name = data.name
    bucket = data.bucket

    # 🔒 1. Derive dataset identity
    # Assumption: Filename convention "dataset_id/filename" or just "dataset_id_..."
    # If file is "procurement_sog_2025_11/invoice.pdf", dataset_id is "procurement_sog_2025_11"
    # If file is "procurement_sog_2025_11.pdf", dataset_id is "procurement_sog_2025_11"
    
    parts = file_name.split("/")
    if len(parts) > 1:
        dataset_id = parts[0]
    else:
        # Fallback: remove extension
        dataset_id = file_name.rsplit('.', 1)[0]
        
    uploaded_at = datetime.utcnow().isoformat()

    # 🔒 2. Dataset version hash (immutability)
    version_hash = hashlib.sha256(
        f"{file_name}:{uploaded_at}".encode()
    ).hexdigest()[:12]

    db = get_db()

    # 🔒 3. Register dataset (if not exists)
    # This acts as the "Binder"
    dataset_ref = db.collection("dataset_registry").document(dataset_id)
    dataset_ref.set({
        "dataset_id": dataset_id,
        "source": "document_upload",
        "current_version": version_hash,
        "locked": False,
        "updated_at": firestore_lib.SERVER_TIMESTAMP
    }, merge=True)

    # 🧾 4. Audit log (THIS IS CRITICAL)
    db.collection("audit_log").add({
        "event": "DOCUMENT_UPLOADED",
        "dataset_id": dataset_id,
        "dataset_version": version_hash,
        "file_name": file_name,
        "bucket": bucket,
        "timestamp": firestore_lib.SERVER_TIMESTAMP
    })

    # 📄 5. Extract text (Stubbed Logic)
    # Ideally, this calls Vision API or Document AI.
    # We simulate extraction for the scope of this refactor.
    full_text = f"Financial supporting document: {file_name}\n\n[Content Placeholder]"

    chunks = [c for c in full_text.split("\n\n") if len(c) > 0]

    batch = db.batch()

    for chunk in chunks:
        # Note: We do NOT overwrite. We append knowledge fragments bound to this specific version.
        batch.set(db.collection("knowledge_base").document(), {
            "dataset_id": dataset_id,
            "dataset_version": version_hash,
            "content": chunk,
            "source_file": file_name,
            "scope": "supporting_document",
            "created_at": firestore_lib.SERVER_TIMESTAMP
        })

    batch.commit()

    print(f"[FINANCE] Document indexed for dataset {dataset_id} v{version_hash}")
>>>>>>> Stashed changes
