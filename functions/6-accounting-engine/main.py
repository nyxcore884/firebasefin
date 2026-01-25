import os
import json
import logging
import datetime
from firebase_functions import pubsub_fn, options
import firebase_admin
from firebase_admin import initialize_app
from google.cloud import firestore, bigquery

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Firebase Admin
if not firebase_admin._apps:
    initialize_app()

db = firestore.Client()
bq_client = bigquery.Client()
PROJECT_ID = os.environ.get('GCP_PROJECT') or "firebasefin"
BQ_DATASET = "financial_data"
BQ_TABLE = "consolidated_ledger"

def stream_to_bigquery(rows):
    """
    STREAMS TO ANALYTICAL WAREHOUSE
    Enables DuckDB queries and Vertex AI forecasting.
    """
    table_id = f"{PROJECT_ID}.{BQ_DATASET}.{BQ_TABLE}"
    try:
        errors = bq_client.insert_rows_json(table_id, rows)
        if errors:
            logger.error(f"BigQuery Insert Errors: {errors}")
        else:
            logger.info(f"Streamed {len(rows)} rows to BigQuery.")
    except Exception as e:
        logger.error(f"BigQuery Connection Error: {e}")

def generate_ledger_entries_from_normalized(norm_doc, doc_id):
    """
    DOUBLE-ENTRY GENERATOR
    - Purpose: Creates atomic Debit/Credit pairs.
    - Flat Structure: Adapted to handle fields at the top level of the document.
    """
    # Use transactional date for accounting accurately
    posting_date = norm_doc.get('date') or norm_doc.get('posting_date')
    if not posting_date:
        # Fallback to normalized time if data is missing
        posting_date = datetime.datetime.now().strftime("%Y-%m-%d")
    elif isinstance(posting_date, datetime.datetime):
        posting_date = posting_date.strftime("%Y-%m-%d")

    amount = float(norm_doc.get('amount') or 0)
    gl_account = str(norm_doc.get('gl_account') or norm_doc.get('account_code') or '6100')
    currency = norm_doc.get('currency', 'GEL')
    entity_id = norm_doc.get('entity_id', 'SOCAR_GEO_GAS_001')
    
    entries = []
    
    # Simple Rule-Based Engine (Patch 005 logic)
    if gl_account.startswith('4'):
        # REVENUE: Debit Assets (Receivables 1100), Credit Revenue (GL)
        entries.append({
            'account_id': '1100',
            'direction': 'DEBIT',
            'amount': amount
        })
        entries.append({
            'account_id': gl_account,
            'direction': 'CREDIT',
            'amount': amount
        })
    else:
        # EXPENSE: Debit Expense (GL), Credit Liabilities (Payables 2100)
        entries.append({
            'account_id': gl_account,
            'direction': 'DEBIT',
            'amount': amount
        })
        entries.append({
            'account_id': '2100',
            'direction': 'CREDIT',
            'amount': amount
        })

    # Add shared metadata to all entries
    for e in entries:
        e.update({
            'entity_id': entity_id,
            'currency': currency,
            'source_row_id': doc_id, # Link back to normalized_row for audit
            'posting_date': posting_date,
            'processed_at': firestore.SERVER_TIMESTAMP
        })
        
    return entries

@pubsub_fn.on_message_published(topic="normalized-rows-created", region="us-central1")
def accounting_handler(event: pubsub_fn.CloudEvent) -> None:
    """
    Accounting Engine Entry Point.
    Centralizes the transition from standardized data to the Atomic Financial Truth (Ledger).
    """
    try:
        # Decode Pub/Sub message
        import base64
        message_data = base64.b64decode(event.data.message.data).decode('utf-8')
        payload = json.loads(message_data)
        
        file_id = payload.get('file_id')
        if not file_id:
            logger.warning("normalized-rows-created missing file_id")
            return

        logger.info(f"Accounting Engine: Processing ledger for {file_id}")
        
        # 1. Fetch normalized rows for this file
        norm_ref = db.collection('normalized_rows').where('source_file_id', '==', file_id).stream()
        
        ledger_coll = db.collection('ledger_entries')
        batch = db.batch()
        
        commit_count = 0
        total_ledger_entries = 0
        
        for doc in norm_ref:
            nd = doc.to_dict()
            entries = generate_ledger_entries_from_normalized(nd, doc.id)
            
            for i, e in enumerate(entries):
                # Unique ID: <normalized_doc_id>_e<0|1>
                ledger_id = f"l_{doc.id.replace('n_', '')}_{i}"
                batch.set(ledger_coll.document(ledger_id), e)
                
                commit_count += 1
                total_ledger_entries += 1
                
                if commit_count >= 400:
                    batch.commit()
                    batch = db.batch()
                    commit_count = 0
                    
        if commit_count > 0:
            batch.commit()

        # 2. Sync to BigQuery for Analytics Engine
        # Prepare BQ rows with schema: [transactionDate, amount, itemCode, accountId]
        bq_rows = []
        # Re-fetch or pass data? Re-fetching is safer for large batches
        ledger_docs = db.collection('ledger_entries').where('source_row_id', 'in', [d.id for d in docs]).stream()
        for doc in ledger_docs:
            e = doc.to_dict()
            bq_rows.append({
                "transactionDate": e.get('posting_date'),
                "amount": float(e.get('amount', 0)),
                "itemCode": e.get('entity_id', 'Generic'),
                "accountId": e.get('account_id'),
                "direction": e.get('direction'),
                "processedAt": datetime.datetime.now().isoformat()
            })
        
        if bq_rows:
            stream_to_bigquery(bq_rows)

        # 3. Update processing log
        db.collection('file_processing_logs').document(file_id).update({
            'status': 'COMPLETED',
            'ledger_count': total_ledger_entries,
            'ledger_written_at': firestore.SERVER_TIMESTAMP
        })
        
        logger.info(f"Success: Wrote {total_ledger_entries} ledger entries for {file_id}")

    except Exception as e:
        logger.error(f"Accounting Engine Error: {e}", exc_info=True)
