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
