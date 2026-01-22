import os
import logging
import re
import json
import datetime
from firebase_functions import https_fn, options
import memory  # Import the new memory module

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lazy Global
db = None

def get_db():
    global db
    if db is None:
        from google.cloud import firestore
        db = firestore.Client()
    return db

def extract_entities(query: str):
    """
    Simple Regex-based Entity Extraction (Mocking NLP for speed/dependency simplicity).
    """
    entities = {}
    query_lower = query.lower()
    
    # Date/Year
    year_match = re.search(r'\b(202[0-9])\b', query)
    if year_match:
        entities['year'] = year_match.group(1)
        
    # Company
    if 'sgg' in query_lower:
        entities['company'] = 'SGG'
    elif 'socar' in query_lower:
        entities['company'] = 'SOCAR'
        
    # Intents
    if 'risk' in query_lower or 'exposure' in query_lower:
        entities['intent'] = 'risk_assessment'
    elif 'strat' in query_lower or 'overview' in query_lower:
        entities['intent'] = 'strategic_overview'
    elif 'optimiz' in query_lower or 'save' in query_lower or 'cut' in query_lower:
        entities['intent'] = 'optimization'
    elif 'profit' in query_lower:
        entities['metric'] = 'profit'
    elif 'transaction' in query_lower:
        entities['metric'] = 'transactions'
    elif 'online' in query_lower or 'status' in query_lower:
         entities['intent'] = 'status_check'
    elif 'hello' in query_lower or 'hi' in query_lower:
         entities['intent'] = 'greeting'
    elif 'help' in query_lower:
         entities['intent'] = 'help'
        
    return entities

def call_truth_engine(context: dict):
    """
    Calls the Financial Truth Engine to get verified numbers.
    AI is an orchestrator, not a calculator.
    """
    import requests
    try:
        # Use the local emulator endpoint for the Truth Engine
        # In production, this would be a verified internal VPC URL
        truth_endpoint = "http://127.0.0.1:5001/studio-9381016045-4d625/us-central1/process_transaction"
        
        response = requests.post(truth_endpoint, json={**context, 'action': 'metrics'}, timeout=10)
        if response.status_code == 200:
            return response.json()
        else:
            logger.error(f"Truth Engine Error: {response.text}")
            return None
    except Exception as e:
        logger.error(f"Failed to call Truth Engine: {e}")
        return None

def generate_cot_response(query_text: str, context: dict, history: list) -> dict:
    """
    Generates a response with a verified 'Chain of Thought' from the Truth Engine.
    """
    query_lower = query_text.lower()
    cot = ["Parsing natural language for financial intent...", f"Context: {context.get('company_id')} | {context.get('period')}"]
    
    # 1. Trigger the Truth Engine
    cot.append("Delegating mathematical validation to the Truth Engine...")
    truth = call_truth_engine(context)
    
    if not truth or truth.get('status') == 'no_data':
        cot.append("No verified data found for current context.")
        return {
            "thought_process": cot,
            "answer": f"I couldn't find any verified financial records for {context.get('company_id')} in {context.get('period')}. Please ensure data is ingested in the Data Hub."
        }

    metrics = truth.get('metrics', {})
    recon = truth.get('reconciliation', {})
    
    # 2. Logic Layer (Interpreter)
    answer = ""
    if 'profit' in query_lower or 'net income' in query_lower:
        cot.append("Extracting Net Income from verified metrics.")
        val = metrics.get('net_income', 0)
        answer = f"The verified **Net Income** for {context.get('period')} is **₾{val:,.2f}**. "
    elif 'revenue' in query_lower or 'sales' in query_lower:
        cot.append("Extracting Total Revenue from verified metrics.")
        val = metrics.get('revenue', 0)
        answer = f"Total **Revenue** is confirmed at **₾{val:,.2f}**. "
    elif 'ebitda' in query_lower:
        cot.append("Extracting EBITDA from verified metrics.")
        val = metrics.get('ebitda', 0)
        answer = f"**EBITDA** for this period reached **₾{val:,.2f}**. "
    elif 'balanced' in query_lower or 'reconcile' in query_lower:
        cot.append("Checking Reconciliation Status.")
        answer = f"Reconciliation Status: **{recon.get('equation')}**. The ledger is currently **{'balanced' if recon.get('is_balanced') else 'unbalanced'}**."
    else:
        answer = "I've reviewed the verified ledger. Revenue is ₾{revenue:,.2f} and Net Income is ₾{net_income:,.2f}. How would you like me to analyze this further?".format(**metrics)

    if recon.get('is_balanced'):
        answer += "\n\n✅ *Note: This figure is fully reconciled (Assets = L+E).* "
    else:
        answer += "\n\n⚠️ *Warning: Discrepancies detected in the ledger for this period.* "

    return {
        "thought_process": cot,
        "answer": answer
    }

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["POST", "OPTIONS"]),
    timeout_sec=60,
    memory=options.MemoryOption.MB_256,
)
def ai_query_api(req: https_fn.Request) -> https_fn.Response:
    from flask import jsonify
    try:
        data = req.get_json(silent=True) or {}
        action = data.get('action', 'query')
        user_id = data.get('userId', 'anonymous')
        
        if action == 'feedback':
            # Handle Learning
            msg_id = data.get('msgId')
            rating = data.get('rating') # 'up' or 'down'
            correction = data.get('correction', '')
            
            if rating == 'down' and correction:
                memory.learn_fact(correction, source=f"correction:{user_id}")
                return jsonify({"status": "learned"})
            
            return jsonify({"status": "recorded"})

        # Handle Query
        query_text = data.get('query', '')
        context = data.get('context', {}) # Global Financial Context from Spine
        
        if not query_text:
             return jsonify({"error": "Empty Query"}), 400
             
        # 1. Retrieve Memory (History)
        history = memory.get_recent_context(user_id)
        
        # 2. Thinking & External Tool Execution (Truth Engine)
        result = generate_cot_response(query_text, context, history)
        
        # 3. Save Context
        memory.save_message(user_id, 'user', query_text)
        memory.save_message(user_id, 'ai', result['answer'])
        
        return jsonify({
            "query": query_text,
            "thought_process": result['thought_process'],
            "answer": result['answer'],
            "source": "Cognitive Engine v2"
        })

    except Exception as e:
        logger.error(f"AI Query Error: {e}")
        return jsonify({"error": str(e)}), 500
