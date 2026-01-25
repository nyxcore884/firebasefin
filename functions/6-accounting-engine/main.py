import os
import json
import logging
import datetime
import uuid
from firebase_functions import pubsub_fn, options
import firebase_admin
from firebase_admin import initialize_app
from google.cloud import firestore, bigquery, storage as gcs_storage

# Initialize Firebase Admin
if not firebase_admin._apps:
    initialize_app()

db = firestore.Client()
bq_client = bigquery.Client()
storage_client = gcs_storage.Client()

PROJECT_ID = os.environ.get('GCP_PROJECT') or "firebasefin"
BQ_DATASET = "financial_data"
BQ_TABLE = "consolidated_ledger"
STAGING_BUCKET = os.environ.get('STAGING_BUCKET') or f"{PROJECT_ID}-bq-staging"

# P1.4: Structured Logging
def get_logger(file_id="N/A"):
    return logging.LoggerAdapter(logging.getLogger(__name__), {"file_id": file_id})

logging.basicConfig(level=logging.INFO, format='%(levelname)s [%(file_id)s] %(message)s')
logger = get_logger()

def trigger_bq_load_job(file_id, gcs_uri):
    """
    P1.3: Use BigQuery Load Jobs for high-throughput batch ingestion.
    """
    current_logger = get_logger(file_id)
    table_id = f"{PROJECT_ID}.{BQ_DATASET}.{BQ_TABLE}"
    
    job_config = bigquery.LoadJobConfig(
        source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
        write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
        autodetect=True # Or specify schema strictly
    )

    load_job = bq_client.load_table_from_uri(
        gcs_uri,
        table_id,
        job_config=job_config
    )
    
    current_logger.info(f"Started BQ Load Job: {load_job.job_id}")
    load_job.result() # Wait for completion
    current_logger.info(f"BQ Load Job {load_job.job_id} completed successfully.")

def generate_ledger_entries_from_normalized(norm_doc, doc_id):
    """Generates standard double-entry records."""
    posting_date = norm_doc.get('date') or norm_doc.get('posting_date')
    if not posting_date:
        posting_date = datetime.datetime.now().strftime("%Y-%m-%d")
    elif isinstance(posting_date, datetime.datetime):
        posting_date = posting_date.strftime("%Y-%m-%d")

    amount = float(norm_doc.get('amount') or 0)
    gl_account = str(norm_doc.get('gl_account') or norm_doc.get('account_code') or '6100')
    currency = norm_doc.get('currency', 'GEL')
    
    # Use metadata propagated from transformation layer
    company_id = norm_doc.get('company_id', 'SOCAR_GEO_GAS_001')
    period = norm_doc.get('period', 'UNKNOWN')
    
    entries = []
    if gl_account.startswith('4'):
        entries.append({'account_id': '1100', 'direction': 'DEBIT', 'amount': amount})
        entries.append({'account_id': gl_account, 'direction': 'CREDIT', 'amount': amount})
    else:
        entries.append({'account_id': gl_account, 'direction': 'DEBIT', 'amount': amount})
        entries.append({'account_id': '2100', 'direction': 'CREDIT', 'amount': amount})

    for e in entries:
        e.update({
            'company_id': company_id,
            'period': period,
            'currency': currency,
            'source_row_id': doc_id,
            'posting_date': posting_date,
            'processed_at': firestore.SERVER_TIMESTAMP
        })
    return entries

@pubsub_fn.on_message_published(topic="normalized-rows-created", region="us-central1")
def accounting_handler(event: pubsub_fn.CloudEvent) -> None:
    """
    P1.3: Implementation of Batch Loading to BigQuery.
    """
    import base64
    try:
        message_data = base64.b64decode(event.data.message.data).decode('utf-8')
        payload = json.loads(message_data)
        
        file_id = payload.get('file_id')
        if not file_id: return
        
        current_logger = get_logger(file_id)
        current_logger.info(f"Starting Accounting & BQ Batch Load")

        # 1. Fetch normalized rows
        norm_docs = db.collection('normalized_rows').where('source_file_id', '==', file_id).stream()
        
        ledger_coll = db.collection('ledger_entries')
        batch = db.batch()
        
        all_ledger_entries = []
        commit_count = 0
        
        # 2. Process & Batch to Firestore (for transactional state)
        for doc in norm_docs:
            nd = doc.to_dict()
            entries = generate_ledger_entries_from_normalized(nd, doc.id)
            
            for i, e in enumerate(entries):
                ledger_id = f"l_{doc.id.replace('n_', '')}_{i}"
                batch.set(ledger_coll.document(ledger_id), e)
                
                # Prepare for BQ (remove firestore timestamp for JSON)
                bq_entry = {**e}
                bq_entry['processed_at'] = datetime.datetime.now().isoformat()
                # Rename for BQ schema compatibility with dashboard
                bq_entry['transactionDate'] = e.get('posting_date')
                bq_entry['company_id'] = e.get('company_id')
                bq_entry['period'] = e.get('period')
                bq_entry['accountId'] = e.get('account_id')
                all_ledger_entries.append(bq_entry)

                commit_count += 1
                if commit_count >= 400:
                    batch.commit()
                    batch = db.batch()
                    commit_count = 0
        if commit_count > 0:
            batch.commit()

        # 3. Batch Load to BigQuery (P1.3)
        if all_ledger_entries:
            # Create JSONL in /tmp
            local_jsonl = f"/tmp/{uuid.uuid4().hex}.jsonl"
            with open(local_jsonl, 'w') as f:
                for entry in all_ledger_entries:
                    f.write(json.dumps(entry) + "\n")
            
            # Upload to Staging GCS
            staging_path = f"bq_loads/{file_id}_{datetime.datetime.now().timestamp()}.jsonl"
            bucket = storage_client.bucket(STAGING_BUCKET)
            blob = bucket.blob(staging_path)
            blob.upload_from_filename(local_jsonl)
            
            # Trigger Job
            trigger_bq_load_job(file_id, f"gs://{STAGING_BUCKET}/{staging_path}")
            
            # Cleanup
            os.remove(local_jsonl)

        # 4. Finalize
        db.collection('file_processing_logs').document(file_id).update({
            'status': 'COMPLETED',
            'ledger_count': len(all_ledger_entries),
            'ledger_written_at': firestore.SERVER_TIMESTAMP
        })
        current_logger.info(f"Accounting & BQ Load success: {len(all_ledger_entries)} entries.")

    except Exception as e:
        logger.error(f"Accounting Engine Error: {str(e)}", exc_info=True)
