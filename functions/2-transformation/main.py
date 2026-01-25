<<<<<<< Updated upstream
import functions_framework
import base64

# Lazy globals
db = None
storage_client = None

def get_clients():
    global db, storage_client
    from google.cloud import firestore, storage
    
    if db is None:
        db = firestore.Client()
    if storage_client is None:
        storage_client = storage.Client()
    return db, storage_client

# This function is triggered by a message published to a Pub/Sub topic.
@functions_framework.cloud_event
def transform_and_load_data(cloud_event):
    """
    It reads the file, detects its type, transforms the data into a clean schema,
    and loads it into the appropriate Firestore collection.
    """
    import pandas as pd
    from io import StringIO
    
    # The message data is base64-encoded
    message_data = base64.b64decode(cloud_event.data["message"]["data"]).decode('utf-8')
    bucket_name, file_name = message_data.split('/', 1)

    print(f"[TRANSFORMATION] Received request to process file: {file_name} from bucket: {bucket_name}")

    try:
        firestore_db, gcs_client = get_clients()
        bucket = gcs_client.bucket(bucket_name)
        blob = bucket.blob(file_name)
        file_contents = blob.download_as_string().decode('utf-8')
        csv_data = StringIO(file_contents)
        df = pd.read_csv(csv_data)

        # --- Routing Logic --- #
        # Based on file type, route to the specific processing function
        if "july sgg" in file_name.lower():
            print(f"[TRANSFORMATION] Routing {file_name} to 'July SGG' processor.")
            process_july_sgg(df)
        # Add other routes here, e.g.:
        # elif "budget" in file_name.lower():
        #     process_budget_file(df)
        # elif "loans" in file_name.lower():
        #     process_loans_file(df)
        else:
            print(f"[TRANSFORMATION-WARN] No specific transformer for {file_name}. Skipping.")

    except Exception as e:
        print(f"[TRANSFORMATION-ERROR] Failed to process {file_name}. Error: {e}")
        raise

def process_july_sgg(df):
    """
    Transforms the 'July SGG' data and loads it into the 'transactions' collection in Firestore.
    """
    print(f"[TRANSFORMATION] Processing {len(df)} rows from the SGG file.")
    
    # Rename columns to match the Firestore schema
    df.rename(columns={
        'transactionNumber': 'transaction_id',
        'amountDebitCurrency': 'amount'
    }, inplace=True)

    # Ensure date is in a consistent format (optional, but good practice)
    df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%d')
    
    # Select only the columns we want to save
    df_to_load = df[['transaction_id', 'date', 'amount']]

    # --- Firestore Load --- #
    # Use a batch writer for efficient writes
    firestore_db, _ = get_clients()
    batch = firestore_db.batch()
    collection_ref = firestore_db.collection('sgg_transactions')
    
    for index, row in df_to_load.iterrows():
        # Create a unique document ID, for example, using the transaction_id
        doc_ref = collection_ref.document(str(row['transaction_id']))
        batch.set(doc_ref, row.to_dict())
        
        # Commit the batch every 500 documents to avoid exceeding limits
        if (index + 1) % 500 == 0:
            print(f"[TRANSFORMATION] Committing batch of 500 documents...")
            batch.commit()
            batch = firestore_db.batch() # Start a new batch

    # Commit any remaining documents
    batch.commit()
    print(f"[TRANSFORMATION] Successfully loaded {len(df_to_load)} documents into 'sgg_transactions' collection.")
=======
import os
import logging
from firebase_functions import https_fn, options
from firebase_admin import firestore, initialize_app

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global lazy initialization
_db = None

def get_db():
    global _db
    if _db is None:
        from firebase_admin import firestore, initialize_app
        import firebase_admin
        if not firebase_admin._apps:
            initialize_app()
        _db = firestore.client()
    return _db

@https_fn.on_request(
    timeout_sec=540,
    memory=options.MemoryOption.GB_1
)
def run_transformation(req: https_fn.Request) -> https_fn.Response:
    """
    Runs deterministic transformation for a locked dataset version.
    """
    from firebase_admin import firestore
    # Import Transformers inside to avoid top-level cost
    from procurement_sog_transformer import normalize_row

    dataset_id = req.args.get("dataset_id")
    actor = req.headers.get("X-User", "system")

    if not dataset_id:
        return https_fn.Response("Missing dataset_id", status=400)

    # 1️⃣ Resolve dataset + version
    db = get_db()
    dataset_ref = db.collection("dataset_registry").document(dataset_id)
    dataset = dataset_ref.get().to_dict()

    if not dataset:
        return https_fn.Response("Dataset not found", status=404)

    if dataset.get("locked"):
        return https_fn.Response("Dataset is locked", status=403)

    dataset_version = dataset["current_version"]

    logger.info(f"Transforming {dataset_id} v{dataset_version}")

    try:
        # 2️⃣ Read RAW LEDGER (VERSIONED)
        raw_stream = (
            db.collection("raw_ledger")
            .where(filter=firestore.FieldFilter("dataset_id", "==", dataset_id))
            .where(filter=firestore.FieldFilter("dataset_version", "==", dataset_version))
            .stream()
        )

        batch = db.batch()
        out = db.collection("fact_financial_summary")

        count = 0
        written = 0

        for doc in raw_stream:
            raw = doc.to_dict()

            normalized = normalize_row(
                raw_row=raw["row"],
                dataset_id=dataset_id
            )

            if not normalized:
                continue

            # 3️⃣ Enforce finance identity
            normalized.update({
                "dataset_id": dataset_id,
                "dataset_version": dataset_version,
                "entity_id": raw.get("entity_id", "DEFAULT"),
                "source_row_id": doc.id,
                "created_at": firestore.SERVER_TIMESTAMP
            })

            batch.set(out.document(), normalized)
            written += 1
            count += 1

            if count >= 400:
                batch.commit()
                batch = db.batch()
                count = 0

        if count:
            batch.commit()

        # 4️⃣ Audit trail (MANDATORY)
        db.collection("audit_log").add({
            "event": "TRANSFORMATION_RUN",
            "dataset_id": dataset_id,
            "dataset_version": dataset_version,
            "records_written": written,
            "actor": actor,
            "timestamp": firestore.SERVER_TIMESTAMP
        })

        return https_fn.Response(
            f"Transformation complete: {written} facts written",
            status=200
        )

    except Exception as e:
        logger.error("Transformation failed", exc_info=True)
        return https_fn.Response(str(e), status=500)
>>>>>>> Stashed changes
