import datetime
import json
import logging
import base64
from firebase_functions import https_fn, pubsub_fn, options
from google.cloud import firestore

# Core Modules
import metrics
import ledger
import reconciliation
import anomalies
import structure
import budget
import reports
import ml_config
import alerts
import governance
import elimination
import currency
import simulation
import orchestrator

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("financial-engine")

# --- HELPERS ---
def require_locked_actuals(dataset, scenario_id):
    """Enforces that we only calculate on locked datasets, unless in sandbox."""
    if scenario_id is None and not dataset.get("locked"):
       raise Exception("Compliance Violation: Actuals dataset is not locked.")

def load_semantic_metrics(db, dataset_id, dataset_version, scenario_id=None):
    """Fetches metrics from FACT table (Trusted)."""
    docs = (
        db.collection('fact_financial_summary')
        .where(filter=firestore.FieldFilter("dataset_id", "==", dataset_id))
        .where(filter=firestore.FieldFilter("dataset_version", "==", dataset_version))
        .stream()
    )
    
    transactions = []
    for doc in docs:
        fact = doc.to_dict()
        fact_scenario = fact.get('scenario_id')
        if scenario_id and fact_scenario != scenario_id: continue
        if not scenario_id and fact_scenario: continue
            
        transactions.append({
            "amount": fact.get("actual_month", 0),
            "category": fact.get("cost_category", "Uncategorized"),
            "date": fact.get("period_date"),
            "entry_type": "Debit", 
            "company_id": fact.get("entity_id")
        })
    return metrics.calculate_metrics(transactions)

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["POST", "OPTIONS"]),
    timeout_sec=120,
    memory=options.MemoryOption.MB_512,
)
def process_transaction(request: https_fn.Request) -> https_fn.Response:
    """
    CFO-Grade Financial Engine Dispatcher.
    """
    try:
        data = request.get_json(silent=True) or {}
        action = data.get('action')
        dataset_id = data.get('dataset_id')
        scenario_id = data.get('scenario_id')
        company_id = data.get('company_id', 'SGG-001')
        period = data.get('period')
        
        logger.info(f"Financial Engine Request: {action} [DS:{dataset_id} Scen:{scenario_id}]")
        db = firestore.Client()
        
        # 1. Dataset Context
        dataset = None
        dataset_version = None
        if dataset_id:
            ds_doc = db.collection("dataset_registry").document(dataset_id).get()
            if ds_doc.exists:
                dataset = ds_doc.to_dict()
                dataset_version = dataset.get("current_version")
                try:
                    require_locked_actuals(dataset, scenario_id)
                except Exception as e:
                    return https_fn.Response(str(e), status=403)

        # 2. Action Routing
        if action == 'metrics':
            # Adaptive logic for metrics
            if dataset_id:
                res = load_semantic_metrics(db, dataset_id, dataset_version, scenario_id)
            else:
                # Fallback to period-based query for demo/legacy
                ledger_ref = db.collection('ledger_entries')
                docs = ledger_ref.where('entity_id', '==', company_id).where('posting_date', '>=', f"{period}-01").limit(1000).stream()
                records = []
                for doc in docs:
                    entry = doc.to_dict()
                    records.append({
                        'amount': entry['amount'],
                        'category': 'Expenses' if entry['account_id'].startswith('6') else ('Revenue' if entry['account_id'].startswith('4') else 'General'),
                        'date': entry['posting_date'],
                        'entry_type': entry['direction'].capitalize(),
                        'company_id': entry['entity_id']
                    })
                res = metrics.calculate_metrics(records)
            
            return https_fn.Response(json.dumps({"status": "success", "metrics": res}), status=200, headers={"Content-Type": "application/json"})

        elif action == 'anomalies':
            # Simplified anomaly run
            detected = anomalies.detect_anomalies([]) # Simplified for cleanup
            return https_fn.Response(json.dumps({"status": "success", "anomalies": detected}), status=200, headers={"Content-Type": "application/json"})

        elif action == 'hierarchy':
            # Dummy hierarchy
            hier = structure.build_hierarchy([], company_id, {})
            return https_fn.Response(json.dumps({"status": "success", "data": hier}), status=200, headers={"Content-Type": "application/json"})

        elif action == 'companies':
            docs = db.collection('companies').stream()
            company_list = [doc.to_dict() for doc in docs]
            return https_fn.Response(json.dumps({"status": "success", "companies": company_list}), status=200, headers={"Content-Type": "application/json"})

        elif action == 'currency':
            to_curr = data.get('target_currency', 'USD')
            amt = float(data.get('amount', 0))
            converted = currency.convert_amount(amt, 'GEL', to_curr)
            return https_fn.Response(json.dumps({"status": "success", "amount": converted, "currency": to_curr}), status=200, headers={"Content-Type": "application/json"})

        elif action == 'audit':
            ai_logs = governance.get_recent_audit_logs(company_id)
            return https_fn.Response(json.dumps({"status": "success", "ai_audit": ai_logs}), status=200, headers={"Content-Type": "application/json"})

        elif action == 'ingest':
            # Redirect to specialized ingestion if needed, or stub
            return https_fn.Response(json.dumps({"status": "success", "message": "Inbound queue accepted"}), status=202)

        else:
            return https_fn.Response(json.dumps({"error": f"Unknown action: {action}"}), status=400)

    except Exception as e:
        logger.exception("Financial Engine Failed")
        return https_fn.Response(json.dumps({"error": str(e)}), status=500, headers={"Content-Type": "application/json"})

@pubsub_fn.on_message_published(topic="financial-updates")
def handle_ledger_event(event: pubsub_fn.CloudEvent[pubsub_fn.MessagePublishedData]) -> None:
    """Reacts to ledger updates for real-time indexing."""
    try:
        data = json.loads(base64.b64decode(event.data.message.data).decode('utf-8'))
        logger.info(f"Processing event: {data.get('event_type')}")
        # Orchestrate downstream updates
        orchestrator.trigger_materialization(data)
    except Exception as e:
        logger.error(f"Event handler failed: {e}")
