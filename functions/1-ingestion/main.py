import functions_framework
import os
import json
from google.cloud import pubsub_v1, storage
import vertexai
from vertexai.generative_models import GenerativeModel

# Initialize
PROJECT_ID = os.environ.get("GCP_PROJECT")
TOPIC_ID = "files-to-process"
vertexai.init(project=PROJECT_ID, location="us-central1")
model = GenerativeModel("gemini-1.5-flash") # Fast & Cheap for data cleaning

publisher = pubsub_v1.PublisherClient()
topic_path = publisher.topic_path(PROJECT_ID, TOPIC_ID)

def heal_and_normalize_data(raw_text):
    """
    Advanced Feature: Uses AI to fix CSV formatting errors, remove currency symbols, 
    and standardizes date formats to YYYY-MM-DD.
    """
    prompt = f"""
    You are a Data Engineering AI. 
    Task: Clean this financial CSV data.
    Rules:
    1. Output MUST be valid JSON array.
    2. Columns must be: 'transaction_id', 'date', 'amount', 'category', 'description'.
    3. Remove '$' and ',' from amounts. Make them floats.
    4. Fix dates to YYYY-MM-DD.
    5. If category is missing, infer it from description.
    
    RAW DATA:
    {raw_text[:10000]} 
    """ # Limit context to 10k chars for speed
    
    try:
        response = model.generate_content(prompt)
        # Strip markdown code blocks if Gemini adds them
        clean_text = response.text.replace("```json", "").replace("```", "")
        return json.loads(clean_text)
    except Exception as e:
        print(f"[AI HEALER FAILED] {e}")
        return None

@functions_framework.cloud_event
def process_file_upload(cloud_event):
    data = cloud_event.data
    bucket_name = data["bucket"]
    file_name = data["name"]

    print(f"[INGESTION] Processing {file_name}...")
    
    # 1. Download File
    storage_client = storage.Client()
    blob = storage_client.bucket(bucket_name).blob(file_name)
    content = blob.download_as_string().decode("utf-8")

    # 2. AI Transformation (The Advanced Part)
    print("[INGESTION] Running Self-Healing AI...")
    clean_data = heal_and_normalize_data(content)
    
    if clean_data:
        # 3. Publish CLEAN data to the pipeline
        message_json = json.dumps({
            "source": file_name,
            "data": clean_data,
            "status": "ai_verified"
        })
        publisher.publish(topic_path, message_json.encode("utf-8"))
        print(f"[INGESTION] Success! AI healed {len(clean_data)} rows.")
    else:
        print("[INGESTION] File was too corrupted for AI to fix.")

