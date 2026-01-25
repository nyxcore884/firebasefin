import logging
from google.cloud import firestore
from datetime import datetime

logger = logging.getLogger(__name__)

def log_ai_decision(company_id, action_type, input_params, output_summary):
    """
    Records an AI-driven decision or forecast in the immutable governance ledger.
    """
    try:
        db = firestore.Client()
        log_entry = {
            "company_id": company_id,
            "action_type": action_type,
            "timestamp": datetime.now().isoformat(),
            "input_params": input_params,
            "output_summary": output_summary,
            "status": "LOGGED"
        }
        
        # Use a timestamp-based ID for sequencing
        doc_id = f"gov-{action_type}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        db.collection('governance_audit_ledger').document(doc_id).set(log_entry)
        
        logger.info(f"AI Governance Log Created: {doc_id}")
        return doc_id
    except Exception as e:
        logger.error(f"Governance logging failed: {e}")
        return None

def get_recent_audit_logs(company_id, limit=10):
    """
    Retrieves the audit trail for a specific company.
    """
    db = firestore.Client()
    logs = db.collection('governance_audit_ledger')\
             .where('company_id', '==', company_id)\
             .order_by('timestamp', direction=firestore.Query.DESCENDING)\
             .limit(limit).stream()
             
    return [doc.to_dict() for doc in logs]

def get_system_audit_logs(limit=20):
    """
    Retrieves system-level audit logs (Transformations, Uploads).
    """
    db = firestore.Client()
    logs = db.collection('audit_log')\
             .order_by('timestamp', direction=firestore.Query.DESCENDING)\
             .limit(limit).stream()
             
    return [doc.to_dict() for doc in logs]
