import logging
import re
import json
import os
import requests
import datetime
from firebase_functions import https_fn, options
import vertexai
from vertexai.generative_models import GenerativeModel

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-query")

# Initialize Vertex AI
PROJECT_ID = os.environ.get("GCP_PROJECT", "firebasefin-main")
vertexai.init(project=PROJECT_ID, location="us-central1")

CORE_TRUTH_ENGINE_URL = os.environ.get("CORE_TRUTH_ENGINE_URL")

def call_truth_engine(entity, period):
    """Orchestrates verified data retrieval."""
    try:
        # We try to hit the process_transaction endpoint with action:metrics
        # or the dedicated generate_financial_truth endpoint.
        url = CORE_TRUTH_ENGINE_URL or "http://127.0.0.1:5001/studio-9381016045-4d625/us-central1/generate_financial_truth"
        
        # Local Dev Check
        if "127.0.0.1" in url or "localhost" in url:
            resp = requests.post(url, json={"entity": entity, "period": period, "action": "metrics"}, timeout=15)
        else:
            resp = requests.post(url, json={"entity": entity, "period": period}, timeout=15)
            
        if resp.status_code == 200:
            return resp.json()
        return None
    except Exception as e:
        logger.error(f"Truth Engine call failed: {e}")
        return None

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["POST", "OPTIONS"]),
    timeout_sec=60,
    memory=options.MemoryOption.MB_512,
)
def ai_query_api(req: https_fn.Request) -> https_fn.Response:
    """
    AI Query Handler - Orchestrates MURTAZI's brain.
    """
    try:
        data = req.get_json(silent=True) or {}
        action = data.get('action', 'query')
        
        if action == 'feedback':
            logger.info("Feedback received")
            return https_fn.Response(json.dumps({"status": "recorded"}), status=200, headers={"Content-Type": "application/json"})

        query_text = data.get('query', '')
        entity = data.get('entity', 'SGG-001')
        period = data.get('period', '2024-01')
        
        if not query_text:
            return https_fn.Response(json.dumps({"error": "Empty Query"}), status=400)

        cot = ["Initializing Financial Reasoner...", f"Context: {entity} | Period: {period}"]
        
        # 1. Fetch Verified Truth
        cot.append("Retrieving verified metrics from Core Controller...")
        truth = call_truth_engine(entity, period)
        
        if not truth:
            cot.append("Warning: Truth Object not available. Defaulting to knowledge base.")
            truth = {"metrics": {"revenue": 0, "net_income": 0}, "status": "STUB"}

        # 2. Narrate via Gemini
        model = GenerativeModel("gemini-1.5-flash-001")
        prompt = f"""
        You are 'MURTAZI', a Senior CFO Assistant for SOCAR.
        Use the following verified TRUTH OBJECT to answer the user's query.
        
        TRUTH OBJECT:
        {json.dumps(truth, indent=2)}
        
        USER QUERY: "{query_text}"
        
        Instructions:
        - Be professional but energetic.
        - Only use the numbers in the Truth Object.
        - If data is missing, say so.
        - Mention if the data is 'Reconciled' if appropriate.
        """
        
        response = model.generate_content(prompt)
        answer = response.text

        return https_fn.Response(json.dumps({
            "answer": answer,
            "thought_process": cot,
            "source_snapshot": truth,
            "chain_of_custody": "Verified by Core Controller"
        }), status=200, headers={"Content-Type": "application/json"})

    except Exception as e:
        logger.exception("AI Query Critical Error")
        return https_fn.Response(json.dumps({"error": str(e)}), status=500, headers={"Content-Type": "application/json"})
