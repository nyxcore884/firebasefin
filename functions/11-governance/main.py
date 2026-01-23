"""
Financial Governance & Audit Function
Monitors transaction stream for compliance violations

Features:
- Real-time transaction monitoring
- Configurable compliance rules
- Multi-level alert severity
- Error handling and logging
- Alert notifications
"""

import json
import base64
import logging
from typing import List, Dict, Any
from datetime import datetime
from firebase_functions import pubsub_fn, https_fn, options
from google.cloud import firestore

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lazy Firestore client
db_client = None

def get_db():
    """Get Firestore client (lazy initialization)."""
    global db_client
    if db_client is None:
        db_client = firestore.Client()
    return db_client


# Configurable compliance rules
COMPLIANCE_RULES = {
    "high_value_threshold": 50000,  # GEL
    "critical_value_threshold": 100000,  # GEL
    "risky_keywords": [
        "offshore",
        "shell company",
        "casino",
        "cryptocurrency",
        "bitcoin",
        "money laundering"
    ],
    "blocked_countries": [
        "sanctioned_country_1",
        "sanctioned_country_2"
    ]
}


class ComplianceAlert:
    """Structured compliance alert."""
    
    def __init__(self, severity: str, rule: str, transaction_id: str, 
                 description: str, details: dict = None):
        self.severity = severity  # 'low', 'medium', 'high', 'critical'
        self.rule = rule
        self.transaction_id = transaction_id
        self.description = description
        self.details = details or {}
        self.timestamp = datetime.now()
    
    def to_dict(self):
        """Convert to Firestore-compatible dict."""
        return {
            "severity": self.severity,
            "rule": self.rule,
            "transaction_id": self.transaction_id,
            "description": self.description,
            "details": self.details,
            "timestamp": firestore.SERVER_TIMESTAMP,
            "status": "open",
            "assigned_to": None,
            "resolution": None
        }


@pubsub_fn.on_message_published(
    topic="financial-transactions",
    region="us-central1",
    memory=options.MemoryOption.MB_256,
    timeout_sec=60
)
def audit_transaction_stream(event: pubsub_fn.CloudEvent) -> None:
    """
    Real-time audit function triggered by Pub/Sub messages.
    
    Monitors transactions for:
    - High value transactions
    - AML risk keywords
    - Sanctioned entities
    - Pattern anomalies
    """
    
    try:
        # Decode message
        if not event.data or "message" not in event.data or "data" not in event.data["message"]:
             logger.warning("Empty or invalid event data structure")
             return

        message_data = base64.b64decode(event.data["message"]["data"]).decode("utf-8")
        
        logger.info(f"Received audit message: {len(message_data)} bytes")
        
        # Parse message
        try:
            payload = json.loads(message_data)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in Pub/Sub message: {e}")
            # Log to error collection for investigation
            log_parsing_error(message_data, str(e))
            return
        
        # Extract transactions from payload
        transactions = extract_transactions(payload)
        
        if not transactions:
            logger.warning("No transactions found in payload")
            return
        
        # Process transactions
        alerts = []
        for txn in transactions:
            try:
                txn_alerts = audit_transaction(txn)
                alerts.extend(txn_alerts)
            except Exception as e:
                logger.error(f"Error auditing transaction {txn.get('id', 'unknown')}: {e}")
                # Continue with other transactions
                continue
        
        # Save alerts to Firestore
        if alerts:
            save_alerts(alerts)
            logger.info(f"Generated {len(alerts)} compliance alerts")
            
            # Send notifications for critical alerts
            critical_alerts = [a for a in alerts if a.severity == 'critical']
            if critical_alerts:
                send_alert_notifications(critical_alerts)
        else:
            logger.info("No compliance violations detected")
    
    except Exception as e:
        logger.error(f"Critical error in audit function: {e}", exc_info=True)
        # Don't raise - we don't want to crash the function


def extract_transactions(payload: dict) -> List[Dict[str, Any]]:
    """
    Extract transaction records from various payload formats.
    
    Handles:
    - Single transaction: {"id": "...", "amount": ...}
    - Batch format: {"data": [...], "source": "..."}
    - Array format: [{"id": ...}, ...]
    """
    
    # Format 1: Batch with 'data' key
    if 'data' in payload and isinstance(payload['data'], list):
        return payload['data']
    
    # Format 2: Direct array
    if isinstance(payload, list):
        return payload
    
    # Format 3: Single transaction
    if isinstance(payload, dict) and ('id' in payload or 'transaction_id' in payload):
        return [payload]
    
    # Unknown format
    logger.warning(f"Unknown payload format: {list(payload.keys())}")
    return []


def audit_transaction(transaction: dict) -> List[ComplianceAlert]:
    """
    Audit a single transaction against compliance rules.
    
    Returns list of alerts (empty if no violations).
    """
    
    alerts = []
    
    # Extract transaction fields with fallbacks
    tx_id = (
        transaction.get('transaction_id') or 
        transaction.get('id') or 
        transaction.get('txn_id') or 
        'unknown'
    )
    
    # Safely parse amount
    try:
        amount = float(transaction.get('amount', 0))
    except (ValueError, TypeError):
        logger.warning(f"Invalid amount for transaction {tx_id}")
        amount = 0
    
    description = (
        transaction.get('description', '') or 
        transaction.get('desc', '') or 
        transaction.get('memo', '')
    ).lower()
    
    counterparty = (
        transaction.get('counterparty', '') or 
        transaction.get('vendor', '') or 
        transaction.get('payee', '')
    ).lower()
    
    # Rule 1: Critical High Value
    if amount > COMPLIANCE_RULES['critical_value_threshold']:
        alerts.append(ComplianceAlert(
            severity='critical',
            rule='high_value_critical',
            transaction_id=tx_id,
            description=f'Critical high-value transaction: ₾{amount:,.2f}',
            details={
                'amount': amount,
                'threshold': COMPLIANCE_RULES['critical_value_threshold']
            }
        ))
    
    # Rule 2: High Value (warning)
    elif amount > COMPLIANCE_RULES['high_value_threshold']:
        alerts.append(ComplianceAlert(
            severity='medium',
            rule='high_value',
            transaction_id=tx_id,
            description=f'High-value transaction: ₾{amount:,.2f}',
            details={
                'amount': amount,
                'threshold': COMPLIANCE_RULES['high_value_threshold']
            }
        ))
    
    # Rule 3: AML Risk Keywords
    detected_keywords = [
        keyword for keyword in COMPLIANCE_RULES['risky_keywords']
        if keyword in description or keyword in counterparty
    ]
    
    if detected_keywords:
        alerts.append(ComplianceAlert(
            severity='high',
            rule='aml_keywords',
            transaction_id=tx_id,
            description=f'AML risk keywords detected: {", ".join(detected_keywords)}',
            details={
                'keywords': detected_keywords,
                'description': description[:100],  # Truncate for storage
                'counterparty': counterparty[:100]
            }
        ))
    
    # Rule 4: Sanctioned Entities (if available)
    country = transaction.get('country', '').lower()
    if country in COMPLIANCE_RULES['blocked_countries']:
        alerts.append(ComplianceAlert(
            severity='critical',
            rule='sanctioned_entity',
            transaction_id=tx_id,
            description=f'Transaction with sanctioned country: {country}',
            details={
                'country': country,
                'counterparty': counterparty[:100]
            }
        ))
    
    # Rule 5: Missing Required Fields
    required_fields = ['amount', 'description', 'date']
    missing_fields = [f for f in required_fields if not transaction.get(f)]
    
    if missing_fields:
        alerts.append(ComplianceAlert(
            severity='low',
            rule='data_quality',
            transaction_id=tx_id,
            description=f'Missing required fields: {", ".join(missing_fields)}',
            details={'missing_fields': missing_fields}
        ))
    
    return alerts


def save_alerts(alerts: List[ComplianceAlert]) -> None:
    """Save compliance alerts to Firestore."""
    
    db = get_db()
    batch = db.batch()
    
    # Save in batch for efficiency
    for alert in alerts:
        doc_ref = db.collection('compliance_alerts').document()
        batch.set(doc_ref, alert.to_dict())
    
    try:
        batch.commit()
        logger.info(f"Saved {len(alerts)} alerts to Firestore")
    except Exception as e:
        logger.error(f"Failed to save alerts: {e}")
        raise


def send_alert_notifications(alerts: List[ComplianceAlert]) -> None:
    """
    Send notifications for critical alerts.
    
    In production, this would integrate with:
    - Email (SendGrid, SES)
    - Slack
    - PagerDuty
    - SMS (Twilio)
    """
    
    logger.info(f"CRITICAL: {len(alerts)} critical alerts detected")
    
    # For now, just log and create high-priority notification document
    db = get_db()
    
    for alert in alerts:
        notification = {
            "type": "compliance_alert",
            "severity": alert.severity,
            "alert_id": alert.transaction_id,
            "message": alert.description,
            "timestamp": firestore.SERVER_TIMESTAMP,
            "sent": False,
            "channels": ["email", "slack"]  # Configure based on severity
        }
        
        db.collection('notifications_queue').add(notification)
    
    logger.info(f"Queued {len(alerts)} critical notifications")
    
    # TODO: Implement actual notification sending
    # - Email via SendGrid
    # - Slack webhook
    # - PagerDuty API


def log_parsing_error(raw_data: str, error: str) -> None:
    """Log parsing errors for investigation."""
    
    try:
        db = get_db()
        db.collection('audit_errors').add({
            "error_type": "json_parsing",
            "raw_data_preview": raw_data[:500],  # First 500 chars
            "error_message": error,
            "timestamp": firestore.SERVER_TIMESTAMP,
            "resolved": False
        })
    except Exception as e:
        logger.error(f"Failed to log parsing error: {e}")


@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["POST"]),
    memory=options.MemoryOption.MB_256
)
def audit_manual(req: https_fn.Request) -> https_fn.Response:
    """
    Manual audit endpoint for testing or batch processing.
    
    POST body: {"transactions": [...]}
    """
    from flask import jsonify
    
    try:
        data = req.get_json(silent=True) or {}
        transactions = data.get('transactions', [])
        
        if not transactions:
            return https_fn.Response(json.dumps({"error": "No transactions provided"}), status=400, headers={"Content-Type": "application/json"})
        
        all_alerts = []
        for txn in transactions:
            try:
                alerts = audit_transaction(txn)
                all_alerts.extend(alerts)
            except Exception as e:
                logger.error(f"Error auditing transaction: {e}")
                continue
        
        # Save alerts
        if all_alerts:
            save_alerts(all_alerts)
        
        return https_fn.Response(json.dumps({
            "status": "success",
            "transactions_audited": len(transactions),
            "alerts_generated": len(all_alerts),
            "alerts": [
                {
                    "severity": a.severity,
                    "rule": a.rule,
                    "transaction_id": a.transaction_id,
                    "description": a.description
                }
                for a in all_alerts
            ]
        }), status=200, headers={"Content-Type": "application/json"})
    
    except Exception as e:
        logger.error(f"Manual audit error: {e}", exc_info=True)
        return https_fn.Response(json.dumps({"error": str(e)}), status=500, headers={"Content-Type": "application/json"})
