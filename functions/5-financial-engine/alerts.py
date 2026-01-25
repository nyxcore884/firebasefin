import logging
from google.cloud import firestore
from datetime import datetime

logger = logging.getLogger(__name__)

def check_for_alerts(company_id, metrics, anomalies):
    """
    Scans metrics and anomalies to generate critical alerts.
    """
    alerts = []
    
    # 1. Budget Breach Alert
    variance = metrics.get('variance_pct', 0)
    if abs(variance) > 15:
        alerts.append({
            "id": f"alert-budget-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "type": "BUDGET_BREACH",
            "severity": "CRITICAL" if variance < -20 else "WARNING",
            "message": f"Critical Budget Variance: {variance}% detected in {company_id}.",
            "timestamp": datetime.now().isoformat()
        })
        
    # 2. Critical Anomaly Alert
    for anomaly in anomalies:
        if anomaly.get('severity') == 'High':
            alerts.append({
                "id": f"alert-anomaly-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "type": "ANOMALY_DETECTED",
                "severity": "CRITICAL",
                "message": f"High Severity Anomaly: {anomaly.get('explanation')}",
                "timestamp": datetime.now().isoformat()
            })
            break # Just one high-level alert for now
            
    # Store in Firestore for persistent alerting
    if alerts:
        db = firestore.Client()
        batch = db.batch()
        for alert in alerts:
            doc_ref = db.collection('executive_alerts').document(alert['id'])
            batch.set(doc_ref, {**alert, "company_id": company_id, "read": False})
        batch.commit()
        logger.info(f"Generated {len(alerts)} alerts for {company_id}")
        
    return alerts

def get_active_alerts(company_id):
    """
    Retrieves unread alerts for the company.
    """
    db = firestore.Client()
    docs = db.collection('executive_alerts')\
             .where('company_id', '==', company_id)\
             .where('read', '==', False)\
             .order_by('timestamp', direction=firestore.Query.DESCENDING)\
             .limit(5).stream()
             
    return [doc.to_dict() for doc in docs]
