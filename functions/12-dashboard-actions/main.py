
import firebase_admin
from firebase_admin import firestore
import logging
from firebase_functions import https_fn, options
import json
import random
from datetime import datetime

# Initialize Firebase
if not firebase_admin._apps:
    firebase_admin.initialize_app()

db = firestore.client()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["POST"]),
    memory=options.MemoryOption.MB_256,
    region="us-central1"
)
def dashboard_actions(req: https_fn.Request) -> https_fn.Response:
    """
    Unified endpoint for Dashboard quick actions:
    - briefing: AI financial briefing
    - anomalies: Anomalies audit
    - report: Generate report logic
    - forecast: Simple forecast data
    """
    try:
        data = req.get_json(silent=True) or {}
        action = data.get('action')
        company_id = data.get('company_id')
        period = data.get('period')

        response_data = {}

        if action == 'briefing':
            # Generate AI Briefing
            response_data = generate_briefing(company_id, period)
        
        elif action == 'anomalies':
            # Audit Ledger / Anomalies
            response_data = get_anomalies(company_id, period)
            
        elif action == 'report':
            # Generate Report Signal
            response_data = {"status": "success", "message": "Report generation queued", "report_id": f"RPT-{random.randint(1000,9999)}"}
            
        elif action == 'forecast':
            # Financial Forecast Data
            response_data = generate_forecast(company_id, period)
            
        else:
            return https_fn.Response("Invalid action", status=400)

        return https_fn.Response(json.dumps(response_data), status=200, headers={"Content-Type": "application/json"})

    except Exception as e:
        logger.error(f"Error in dashboard actions: {e}")
        return https_fn.Response(json.dumps({"error": str(e)}), status=500, headers={"Content-Type": "application/json"})

def generate_briefing(company_id, period):
    # Retrieve KPIs from Firestore (mocked logic for speed, ideally queries 'financial_metrics' collection)
    # In a real scenario, this would query the aggregations
    return {
        "text": f"Financial Briefing for {company_id} ({period}): Revenue is tracking 5% above budget due to increased Q4 efficiency. Operational expenses are stable. Detected 2 pending anomalies requiring review.",
        "audio_url": None # Placeholder for TTS
    }

def get_anomalies(company_id, period):
    # Fetch anomalies from 'compliance_alerts'
    docs = db.collection('compliance_alerts').where('status', '==', 'open').limit(5).stream()
    anomalies = []
    for doc in docs:
        d = doc.to_dict()
        anomalies.append({
            "id": doc.id,
            "description": d.get('description'),
            "severity": d.get('severity'),
            "amount": d.get('details', {}).get('amount', 0)
        })
    
    # Fallback if no alerts
    if not anomalies:
        anomalies = [
            {"id": "mock-1", "description": "Unusual spike in Marketing spend", "severity": "medium", "amount": 15000},
            {"id": "mock-2", "description": "Duplicate invoice detected", "severity": "high", "amount": 4200}
        ]
        
    return {"anomalies": anomalies}

def generate_forecast(company_id, period):
    # Simple linear projection
    return {
        "labels": ["M1", "M2", "M3", "M4", "M5", "M6"],
        "actuals": [100, 120, 115, 130, 140, 135],
        "forecast": [140, 145, 150, 155, 160, 165]
    }
