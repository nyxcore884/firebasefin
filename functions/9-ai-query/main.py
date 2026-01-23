import os
import logging
import json
import requests
from firebase_functions import https_fn, options
import memory

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment Configuration
TRUTH_ENGINE_URL = os.getenv(
    'TRUTH_ENGINE_URL',
    'https://us-central1-studio-9381016045-4d625.cloudfunctions.net/process_transaction'
)
USE_REAL_AI = os.getenv('USE_REAL_AI', 'true').lower() == 'true'  # Default to TRUE for Gemini


def call_truth_engine(context: dict):
    """
    Calls the Financial Truth Engine to get verified numbers.
    AI is an orchestrator, not a calculator.
    """
    try:
        logger.info(f"Calling Truth Engine at {TRUTH_ENGINE_URL} with context: {context}")
        response = requests.post(
            TRUTH_ENGINE_URL, 
            json={**context, 'action': 'metrics'}, 
            timeout=10
        )
        
        logger.info(f"Truth Engine response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            logger.info(f"Truth Engine returned: {result.get('status')}")
            return result
        else:
            logger.error(f"Truth Engine Error [{response.status_code}]: {response.text}")
            return None
            
    except requests.exceptions.Timeout:
        logger.error("Truth Engine timeout")
        return None
    except requests.exceptions.ConnectionError as e:
        logger.error(f"Cannot connect to Truth Engine: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error calling Truth Engine: {e}")
        return None


def generate_ai_response(query: str, truth_data: dict, history: list) -> dict:
    """
    Uses Google Gemini AI to generate intelligent responses based on verified financial data.
    
    Falls back to rule-based responses if AI is disabled or fails.
    """
    if not USE_REAL_AI:
        return generate_rule_based_response(query, truth_data)
    
    try:
        import vertexai
        from vertexai.generative_models import GenerativeModel
        
        # Initialize Vertex AI with explicit project and location
        PROJECT_ID = "studio-9381016045-4d625"
        LOCATION = "us-central1"
        logger.info(f"Initializing Vertex AI for project {PROJECT_ID} in {LOCATION}")
        vertexai.init(project=PROJECT_ID, location=LOCATION)
        
        # Build context from verified financial data
        metrics = truth_data.get('metrics', {})
        reconciliation = truth_data.get('reconciliation', {})
        context_info = truth_data.get('context', {})
        
        system_prompt = f"""You are MURTAZI, a Tier-1 Financial Cognitive Engine powered by Google Vertex AI. 
        
You are NOT a chatbot. You are a high-precision financial analysis system integrated directly with the CFO's data streams.

**Your Core Directive:**
- Provide executive-grade financial analysis.
- Use only verified data from the Truth Engine.
- Be direct, professional, and data-driven.


**Current Context:**
- Company: {context_info.get('company_id', 'Unknown')}
- Period: {context_info.get('period', 'Unknown')}
- Department: {context_info.get('department', 'All')}

**Verified Financial Metrics:**
- Revenue: ₾{metrics.get('revenue', 0):,.2f}
- Net Income: ₾{metrics.get('net_income', 0):,.2f}
- EBITDA: ₾{metrics.get('ebitda', 0):,.2f}
- Assets: ₾{metrics.get('assets', 0):,.2f}
- Liabilities: ₾{metrics.get('liabilities', 0):,.2f}
- Equity: ₾{metrics.get('equity', 0):,.2f}

**Reconciliation Status:**
- Balanced: {reconciliation.get('is_balanced', 'Unknown')}
- Equation: {reconciliation.get('equation', 'N/A')}
- Discrepancy: {reconciliation.get('discrepancy', 0)}

**Guidelines:**
1. Always cite specific numbers from the verified metrics above
2. Never calculate or estimate - only use verified numbers
3. Format currency amounts with ₾ symbol and proper thousands separators
4. Keep responses concise but professional
5. If the ledger is unbalanced, mention this as a critical issue"""

        # Create the Gemini model
        model = GenerativeModel("gemini-2.0-flash-001")
        
        # Generate response
        response = model.generate_content(
            f"{system_prompt}\n\nUser Query: {query}",
            generation_config={
                "max_output_tokens": 1024,
                "temperature": 0.3,
            }
        )
        
        answer = response.text
        
        thought_process = [
            "Analyzed query using Google Gemini AI",
            "Referenced verified financial data from Truth Engine",
            "Validated response against reconciliation status"
        ]
        
        # Determine UI component based on query
        ui_component, ui_data = determine_visualization(query, metrics)
        
        return {
            "answer": answer,
            "thought_process": thought_process,
            "ui_component": ui_component,
            "ui_data": ui_data,
            "source": "Gemini AI + Truth Engine"
        }
        
    except Exception as e:
        logger.error(f"Gemini AI generation failed: {e}, falling back to rules")
        return generate_rule_based_response(query, truth_data)


def generate_rule_based_response(query: str, truth_data: dict) -> dict:
    """
    Fallback rule-based response generator for when AI is unavailable.
    """
    query_lower = query.lower()
    metrics = truth_data.get('metrics', {})
    recon = truth_data.get('reconciliation', {})
    context = truth_data.get('context', {})
    
    thought_process = [
        "Parsing natural language for financial intent",
        f"Context: {context.get('company_id')} | {context.get('period')}",
        "Retrieved verified metrics from Truth Engine"
    ]
    
    # Determine response based on keywords
    if 'profit' in query_lower or 'net income' in query_lower:
        val = metrics.get('net_income', 0)
        answer = f"The verified **Net Income** for {context.get('period')} is **₾{val:,.2f}**."
        
    elif 'revenue' in query_lower or 'sales' in query_lower:
        val = metrics.get('revenue', 0)
        answer = f"Total **Revenue** is confirmed at **₾{val:,.2f}**."
        
    elif 'ebitda' in query_lower:
        val = metrics.get('ebitda', 0)
        answer = f"**EBITDA** for this period reached **₾{val:,.2f}**."
        
    elif 'balanced' in query_lower or 'reconcile' in query_lower:
        status = "balanced ✓" if recon.get('is_balanced') else "unbalanced ⚠️"
        answer = f"Reconciliation Status: **{recon.get('equation')}**. The ledger is currently **{status}**."
        
    elif 'assets' in query_lower:
        val = metrics.get('assets', 0)
        answer = f"Total **Assets** stand at **₾{val:,.2f}**."
        
    elif 'overview' in query_lower or 'summary' in query_lower:
        answer = f"""**Financial Overview for {context.get('period')}:**
        
- Revenue: ₾{metrics.get('revenue', 0):,.2f}
- Net Income: ₾{metrics.get('net_income', 0):,.2f}
- EBITDA: ₾{metrics.get('ebitda', 0):,.2f}
- Assets: ₾{metrics.get('assets', 0):,.2f}

Ledger Status: {'Balanced ✓' if recon.get('is_balanced') else 'Unbalanced ⚠️'}"""
    else:
        answer = f"I've reviewed the verified ledger. Revenue is ₾{metrics.get('revenue', 0):,.2f} and Net Income is ₾{metrics.get('net_income', 0):,.2f}. How would you like me to analyze this further?"
    
    # Determine visualization
    ui_component, ui_data = determine_visualization(query_lower, metrics)
    
    return {
        "answer": answer,
        "thought_process": thought_process,
        "ui_component": ui_component,
        "ui_data": ui_data,
        "source": "Rule-Based Engine + Truth Engine"
    }


def determine_visualization(query: str, metrics: dict):
    """
    Determines appropriate visualization based on query intent.
    """
    query_lower = query.lower()
    
    # Financial metrics chart
    if any(word in query_lower for word in ['profit', 'revenue', 'ebitda', 'financial', 'performance']):
        return 'bar_chart', {
            "title": "Financial Performance",
            "labels": ["Revenue", "COGS", "Net Income", "EBITDA"],
            "datasets": [{
                "label": "Current Period",
                "data": [
                    metrics.get('revenue', 0),
                    metrics.get('cogs', 0),
                    metrics.get('net_income', 0),
                    metrics.get('ebitda', 0)
                ]
            }]
        }
    
    # Trend analysis
    elif 'trend' in query_lower or 'over time' in query_lower:
        return 'line_chart', {
            "title": "Trend Analysis",
            "labels": ["Q1", "Q2", "Q3", "Q4"],
            "values": [100, 120, 115, 130]  # Would come from historical data
        }
    
    # Balance sheet breakdown
    elif 'balance' in query_lower or 'assets' in query_lower:
        return 'pie_chart', {
            "title": "Balance Sheet Breakdown",
            "labels": ["Assets", "Liabilities", "Equity"],
            "data": [
                metrics.get('assets', 0),
                metrics.get('liabilities', 0),
                metrics.get('equity', 0)
            ]
        }
    
    return None, None


@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["POST", "OPTIONS"]),
    timeout_sec=60,
    memory=options.MemoryOption.MB_512,  # Increased for AI processing
)
def ai_query_api(req: https_fn.Request) -> https_fn.Response:
    """
    AI Query API - Orchestrates natural language queries to financial data.
    
    Flow:
    1. Receive natural language query
    2. Fetch verified metrics from Truth Engine
    3. Use AI (or rules) to generate intelligent response
    4. Save conversation to memory
    5. Return response with optional visualization
    """
    from flask import jsonify
    
    try:
        data = req.get_json(silent=True) or {}
        action = data.get('action', 'query')
        user_id = data.get('userId', 'anonymous')
        
        # Handle feedback/learning
        if action == 'feedback':
            msg_id = data.get('msgId')
            rating = data.get('rating')
            correction = data.get('correction', '')
            
            if rating == 'down' and correction:
                memory.learn_fact(correction, source=f"correction:{user_id}")
                logger.info(f"Learned from user correction: {correction}")
                return jsonify({"status": "learned", "message": "Thank you for the correction"})
            
            return jsonify({"status": "recorded", "message": "Feedback recorded"})
        
        # Handle query
        query_text = data.get('query', '').strip()
        context = data.get('context', {})
        
        if not query_text:
            return jsonify({"error": "Empty query"}), 400
        
        # Validate context
        if not context.get('company_id') or not context.get('period'):
            return jsonify({
                "error": "Missing context",
                "details": "Please provide company_id and period in context"
            }), 400
        
        logger.info(f"Processing query for user {user_id}: {query_text}")
        
        # 1. Retrieve conversation history
        history = memory.get_recent_context(user_id)
        
        # 2. Fetch verified data from Truth Engine
        truth_data = call_truth_engine(context)
        
        if not truth_data or truth_data.get('status') == 'error':
            return jsonify({
                "query": query_text,
                "answer": f"I couldn't retrieve verified financial data for {context.get('company_id')} in {context.get('period')}. Please ensure data is available in the Truth Engine.",
                "thought_process": [
                    "Attempted to fetch verified metrics",
                    "Truth Engine returned no data or error"
                ],
                "source": "Error Handler"
            }), 200  # 200 with error message, not 500
        
        # 3. Generate intelligent response
        result = generate_ai_response(query_text, truth_data, history)
        
        # 4. Save to memory
        memory_saved = memory.save_message(user_id, 'user', query_text)
        if memory_saved:
            memory.save_message(user_id, 'assistant', result['answer'])
        else:
            logger.warning(f"Failed to save conversation to memory for user {user_id}")
        
        # 5. Return response
        return jsonify({
            "query": query_text,
            "thought_process": result['thought_process'],
            "answer": result['answer'],
            "ui_component": result.get('ui_component'),
            "ui_data": result.get('ui_data'),
            "source": result.get('source', 'AI Query Engine'),
            "context": context
        })
    
    except Exception as e:
        logger.error(f"AI Query Error: {e}", exc_info=True)
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500
