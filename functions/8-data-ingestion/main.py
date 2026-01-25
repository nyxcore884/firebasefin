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

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Firebase Admin
if not firebase_admin._apps:
    initialize_app()

db = firestore.Client()
publisher = pubsub_v1.PublisherClient()

PROJECT_ID = os.environ.get('GCP_PROJECT') or "firebasefin"
RAW_ROWS_TOPIC = os.environ.get('RAW_ROWS_TOPIC', 'raw-rows-created')

def calculate_checksum(file_bytes):
    """Immutable Fingerprint: SHA-256 is mandatory for audit safety."""
    return hashlib.sha256(file_bytes).hexdigest()

def persist_log(file_id, filename, checksum, size, status, meta=None):
    """Audit Logging: Tracks the lifecycle of the file processing."""
    doc = {
        'file_id': file_id,
        'file_name': filename,
        'checksum_sha256': checksum,
        'size_bytes': size,
        'status': status,
        'created_at': firestore.SERVER_TIMESTAMP,
        'meta': meta or {}
    }
    db.collection('file_processing_logs').document(file_id).set(doc)

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["post", "options"]),
    timeout_sec=540,
    memory=options.MemoryOption.GB_2,
)
def ingest_data(req: https_fn.Request) -> https_fn.Response:
    """
    STRICT INGESTION LAYER
    - Purpose: Raw data capture & validation.
    - MUST NOT: Perform accounting mapping or record debit/credits.
    - MUST: Ensure idempotency via SHA-256.
    """
    try:
        file_bytes = None
        filename = ""
        source_profile = "Generic_Financial_v1"
        user_id = "anonymous"

        # 1. Parse Input Payload
        json_data = req.get_json(silent=True)
        if json_data:
            user_id = json_data.get('userId', user_id)
            source_profile = json_data.get('source_profile', source_profile)

        if json_data and 'storagePath' in json_data:
            # Cloud Storage Path Source
            storage_path = json_data['storagePath']
            bucket_name = json_data.get('bucket')
            if not bucket_name:
                return https_fn.Response(json.dumps({"error": "Missing bucket"}), status=400, headers={"Content-Type": "application/json"})
            filename = os.path.basename(storage_path)
            storage_client = gcs_storage.Client()
            bucket = storage_client.bucket(bucket_name)
            blob = bucket.blob(storage_path)
            file_bytes = blob.download_as_bytes()
        elif 'file' in req.files:
            # Direct Multi-part Upload Source
            file_wrapper = req.files['file']
            filename = secure_filename(file_wrapper.filename)
            file_bytes = file_wrapper.read()
        else:
            return https_fn.Response(json.dumps({"error": "No file or storagePath provided"}), status=400, headers={"Content-Type": "application/json"})

        # 2. Fingerprinting & Idempotency Check
        checksum = calculate_checksum(file_bytes)
        existing = db.collection('file_processing_logs').where('checksum_sha256', '==', checksum).limit(1).get()
        if existing:
            # Prevent double-processing of identical financial files
            logger.info(f"Duplicate file detected: {existing[0].id}")
            return https_fn.Response(json.dumps({
                "message": "File already processed",
                "file_id": existing[0].id,
                "status": "DUPLICATE"
            }), status=200, headers={"Content-Type": "application/json"})

        file_id = f"f_{uuid.uuid4().hex[:12]}"
        persist_log(file_id, filename, checksum, len(file_bytes), 'RECEIVED', {'user_id': user_id, 'source_profile': source_profile})

        # 3. Structural Parsing (Preserving Raw State as strings)
        raw_rows = []
        file_stream = io.BytesIO(file_bytes)
        
        if filename.lower().endswith('.csv'):
            # Pandas handles encoding and delimiter variations better than native csv
            df = pd.read_csv(file_stream, dtype=str)
            raw_rows = df.to_dict(orient='records')
        elif filename.lower().endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file_stream, dtype=str)
            raw_rows = df.to_dict(orient='records')
        elif filename.lower().endswith('.pdf'):
            from pypdf import PdfReader
            reader = PdfReader(file_stream)
            text = "".join([p.extract_text() + "\n" for p in reader.pages])
            raw_rows = [{"content": text, "type": "pdf"}]
        else:
            raw_rows = [{"blob_preview": file_bytes.hex()[:200], "type": "unknown"}]

        # 4. Atomic Raw Row Persistence
        batch = db.batch()
        raw_ref = db.collection('raw_rows')
        for i, row in enumerate(raw_rows):
            doc_id = f"{file_id}_r{i}"
            batch.set(raw_ref.document(doc_id), {
                'file_id': file_id,
                'row_index': i,
                'source_profile': source_profile,
                'raw': row,
                'ingested_at': firestore.SERVER_TIMESTAMP,
                'file_name': filename
            })
            if (i + 1) % 400 == 0:
                batch.commit()
                batch = db.batch()
        batch.commit()

        # 5. Event-Driven Propagation
        persist_log(file_id, filename, checksum, len(file_bytes), 'INGESTED', {'row_count': len(raw_rows)})
        
        topic_path = publisher.topic_path(PROJECT_ID, RAW_ROWS_TOPIC)
        publisher.publish(topic_path, json.dumps({'file_id': file_id, 'source_profile': source_profile}).encode('utf-8'))

        logger.info(f"Ingestion complete: {file_id} with {len(raw_rows)} rows.")
        return https_fn.Response(json.dumps({
            "message": "File ingested successfully (raw rows stored)",
            "file_id": file_id,
            "rows": len(raw_rows)
        }), status=201, headers={"Content-Type": "application/json"})

    except Exception as e:
        logger.exception("Ingestion Error")
        return https_fn.Response(json.dumps({"error": str(e)}), status=500, headers={"Content-Type": "application/json"})
