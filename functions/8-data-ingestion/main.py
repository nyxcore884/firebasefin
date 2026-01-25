#!/usr/bin/env python3
import os
import json
import logging
import io
import hashlib
import uuid
import datetime
import pandas as pd
from firebase_functions import https_fn, options
from werkzeug.utils import secure_filename
import firebase_admin
from firebase_admin import initialize_app
from google.cloud import firestore, pubsub_v1, storage as gcs_storage

# Initialize Firebase Admin
if not firebase_admin._apps:
    initialize_app()

db = firestore.Client()
publisher = pubsub_v1.PublisherClient()
PROJECT_ID = os.environ.get('GCP_PROJECT') or "firebasefin"
RAW_ROWS_TOPIC = os.environ.get('RAW_ROWS_TOPIC', 'raw-rows-created')

# P1.4: Structured Logging Adapter
def get_logger(file_id="N/A"):
    """Returns a logger that includes the file_id in every message."""
    return logging.LoggerAdapter(logging.getLogger(__name__), {"file_id": file_id})

logging.basicConfig(level=logging.INFO, format='%(levelname)s [%(file_id)s] %(message)s')
logger = get_logger()

def calculate_checksum(file_path):
    """Immutable Fingerprint: Uses a file path to avoid loading whole file into memory."""
    h = hashlib.sha256()
    with open(file_path, 'rb') as f:
        while True:
            chunk = f.read(8192)
            if not chunk: break
            h.update(chunk)
    return h.hexdigest()

def persist_log(file_id, filename, checksum, size, status, meta=None):
    doc = {
        'file_id': file_id,
        'file_name': filename,
        'checksum_sha256': checksum,
        'size_bytes': size,
        'status': status,
        'updated_at': firestore.SERVER_TIMESTAMP,
        'meta': meta or {}
    }
    # Use set with merge=True to allow status updates without losing original meta
    db.collection('file_processing_logs').document(file_id).set(doc, merge=True)

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["post", "options"]),
    timeout_sec=540,
    memory=options.MemoryOption.GB_2,
)
def ingest_data(req: https_fn.Request) -> https_fn.Response:
    """
    P1.2: Hardened Ingestion Layer
    - Streams large files to /tmp.
    - Uses SHA-256 for strict idempotency.
    - Implements structured logging.
    """
    temp_path = f"/tmp/{uuid.uuid4().hex}"
    file_id = "pending"
    try:
        source_profile = "Generic_Financial_v1"
        user_id = "anonymous"

        # 1. Capture Payload
        json_data = req.get_json(silent=True)
        if json_data:
            user_id = json_data.get('userId', user_id)
            source_profile = json_data.get('source_profile', source_profile)

        # 2. Stream to /tmp (P1.2)
        if json_data and 'storagePath' in json_data:
            storage_path = json_data['storagePath']
            bucket_name = json_data.get('bucket')
            if not bucket_name:
                return https_fn.Response(json.dumps({"error": "Missing bucket"}), status=400)
            filename = os.path.basename(storage_path)
            
            storage_client = gcs_storage.Client()
            bucket = storage_client.bucket(bucket_name)
           
            blob = bucket.blob(storage_path)
            blob.download_to_filename(temp_path)
        elif 'file' in req.files:
            file_wrapper = req.files['file']
            filename = secure_filename(file_wrapper.filename)
            file_wrapper.save(temp_path)
        else:
            return https_fn.Response(json.dumps({"error": "No data source"}), status=400)

        # 3. Validation & Idempotency (P1.1)
        checksum = calculate_checksum(temp_path)
        size_bytes = os.path.getsize(temp_path)
        
        existing = db.collection('file_processing_logs').where('checksum_sha256', '==', checksum).limit(1).get()
        if existing:
            duplicate = existing[0].to_dict()
            if duplicate.get('status') != 'FAILED':
                logger.info(f"Duplicate upload detected. Existing ID: {existing[0].id}")
                return https_fn.Response(json.dumps({
                    "message": "File already ingested",
                    "file_id": existing[0].id,
                    "status": duplicate.get('status')
                }), status=200)

        file_id = f"f_{uuid.uuid4().hex[:12]}"
        # Update Logger with real file_id
        current_logger = get_logger(file_id)
        current_logger.info(f"Starting ingestion for {filename}")

        persist_log(file_id, filename, checksum, size_bytes, 'PROCESSING', {'user_id': user_id, 'source_profile': source_profile})

        # 4. Parsing (P1.2: Robust Chunked Reading)
        raw_rows = []
        if filename.lower().endswith('.csv'):
            # Chunking could be added if files are > 500MB, for now read_csv on disk is efficient
            df = pd.read_csv(temp_path, dtype=str)
            raw_rows = df.to_dict(orient='records')
        elif filename.lower().endswith(('.xlsx', '.xls')):
            df = pd.read_excel(temp_path, dtype=str)
            raw_rows = df.to_dict(orient='records')
        elif filename.lower().endswith('.pdf'):
            from pypdf import PdfReader
            reader = PdfReader(temp_path)
            text = "".join([p.extract_text() + "\n" for p in reader.pages])
            raw_rows = [{"content": text, "type": "pdf"}]
        else:
            raw_rows = [{"type": "binary", "note": "unsupported_format_scanned"}]

        # 5. Batch Persistence
        batch = db.batch()
        raw_ref = db.collection('raw_rows')
        for i, row in enumerate(raw_rows):
            doc_id = f"{file_id}_r{i}"
            batch.set(raw_ref.document(doc_id), {
                'file_id': file_id,
                'row_index': i,
                'source_profile': source_profile,
                'raw': row,
                'ingested_at': firestore.SERVER_TIMESTAMP
            })
            if (i + 1) % 400 == 0:
                batch.commit()
                batch = db.batch()
        batch.commit()

        # 6. Finalize & Notify
        persist_log(file_id, filename, checksum, size_bytes, 'INGESTED', {'row_count': len(raw_rows)})
        
        topic_path = publisher.topic_path(PROJECT_ID, RAW_ROWS_TOPIC)
        publisher.publish(topic_path, json.dumps({'file_id': file_id, 'source_profile': source_profile}).encode('utf-8'))

        current_logger.info(f"Ingestion complete: {len(raw_rows)} rows stored.")
        return https_fn.Response(json.dumps({"file_id": file_id, "rows": len(raw_rows)}), status=201)

    except Exception as e:
        logger.error(f"Ingestion Error: {str(e)}")
        if file_id != "pending":
            persist_log(file_id, "unknown", "unknown", 0, 'FAILED', {'error': str(e)})
        return https_fn.Response(json.dumps({"error": str(e)}), status=500)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
