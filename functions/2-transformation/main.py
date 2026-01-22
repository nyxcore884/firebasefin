import functions_framework
import base64
import os
import sqlalchemy
from google.cloud import firestore, storage
import pandas as pd
from io import StringIO

# Lazy globals
db = None
storage_client = None
db_pool = None

def get_clients():
    global db, storage_client
    
    if db is None:
        db = firestore.Client()
    if storage_client is None:
        storage_client = storage.Client()
    return db, storage_client

def get_db_pool():
    global db_pool
    if db_pool is None:
        db_user = os.environ.get("DB_USER", "postgres")
        db_pass = os.environ.get("DB_PASS", "password")
        db_name = os.environ.get("DB_NAME", "postgres")
        db_host = os.environ.get("DB_HOST", "127.0.0.1") # Or Cloud SQL Instance Connection Name
        db_port = os.environ.get("DB_PORT", "5432")
        
        # Determine connection URL based on environment
        # For Cloud SQL via Unix Socket (often used in GCF)
        # db_url = sqlalchemy.engine.url.URL.create(
        #     drivername="postgresql+pg8000",
        #     username=db_user,
        #     password=db_pass,
        #     database=db_name,
        #     query={"unix_sock": f"/cloudsql/{db_host}/.s.PGSQL.5432"}
        # )
        
        # For Cloud SQL via TCP (Local dev or generalized)
        db_url = f"postgresql+pg8000://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"

        db_pool = sqlalchemy.create_engine(db_url)
    return db_pool

# This function is triggered by a message published to a Pub/Sub topic.
@functions_framework.cloud_event
def transform_and_load_data(cloud_event):
    """
    It reads the file, detects its type, transforms the data into a clean schema,
    and loads it into the appropriate Firestore collection AND Cloud SQL.
    """
    
    import json
    
    # 1. Decode Data
    if not cloud_event.data:
         print("[TRANSFORMATION-ERROR] No data in cloud event")
         return

    message_payload = base64.b64decode(cloud_event.data["message"]["data"]).decode('utf-8')
    
    # Check if we got JSON (New Flow) or String (Old Flow)
    try:
        payload = json.loads(message_payload)
        
        # If it's the new "Clean Data" packet
        if isinstance(payload, dict) and "data" in payload:
             print(f"[TRANSFORMATION] Received PRE-CLEANED data for {payload.get('source')}")
             # Convert list of dicts directly to DataFrame
             import pandas as pd
             df = pd.DataFrame(payload['data'])
             file_name = payload.get('source', 'unknown_file')
             
             # Skip the GCS Download part
             process_dataframe(df, file_name)
             return
             
    except json.JSONDecodeError:
        # Fallback to old path (GCS Path String)
        pass

    try:
        bucket_name, file_name = message_payload.split('/', 1)
    except ValueError:
        print(f"[TRANSFORMATION-ERROR] Invalid message format: {message_payload}")
        return

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
        # Add other routes here...
        else:
            print(f"[TRANSFORMATION-WARN] No specific transformer for {file_name}. Skipping.")

    except Exception as e:
        print(f"[TRANSFORMATION-ERROR] Failed to process {file_name}. Error: {e}")
        raise

def process_july_sgg(df):
    """
    Transforms the 'July SGG' data and loads it into the 'transactions' collection in Firestore
    AND 'transactions' table in Cloud SQL.
    """
    print(f"[TRANSFORMATION] Processing {len(df)} rows from the SGG file.")
    
    # Rename columns to match the Schema
    # Adapting to likely column names based on user context
    df.rename(columns={
        'transactionNumber': 'transaction_id',
        'amountDebitCurrency': 'amount',
        'transactionDate': 'transaction_date',
        'itemCode': 'item_code'
    }, inplace=True)

    # Ensure date is in a consistent format
    if 'transaction_date' in df.columns:
        df['transaction_date'] = pd.to_datetime(df['transaction_date']).dt.strftime('%Y-%m-%d')
    else:
         # Fallback if date column missing or named differently
         print("[TRANSFORMATION-WARN] 'transaction_date' column not found or mapped. Using current date.")
         df['transaction_date'] = pd.Timestamp.now().strftime('%Y-%m-%d')

    # Ensure amount is numeric
    if 'amount' in df.columns:
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)

    # Select columns for load
    target_columns = ['transaction_id', 'transaction_date', 'amount', 'item_code']
    # Filter only existing columns
    df_to_load = df[[c for c in target_columns if c in df.columns]].copy()

    # --- Firestore Load (Keeping for Real-Time UI) --- #
    firestore_db, _ = get_clients()
    batch = firestore_db.batch()
    collection_ref = firestore_db.collection('sgg_transactions')
    
    count = 0
    for index, row in df_to_load.iterrows():
        # Create a unique document ID
        doc_id = str(row.get('transaction_id', index))
        doc_ref = collection_ref.document(doc_id)
        batch.set(doc_ref, row.to_dict())
        count += 1
        
        if count % 500 == 0:
            batch.commit()
            batch = firestore_db.batch()

    batch.commit()
    print(f"[TRANSFORMATION-FIRESTORE] Loaded {count} documents.")

    # --- Cloud SQL Load (For Prophet/BigQuery Federation) --- #
    try:
        pool = get_db_pool()
        with pool.connect() as conn:
            # Using pandas to_sql for simplicity
            # 'transactions' table must exist or be created. if_exists='append' is standard.
            df_to_load.to_sql('transactions', conn, if_exists='append', index=False)
            print(f"[TRANSFORMATION-SQL] Loaded {len(df_to_load)} rows into 'transactions' table.")
    except Exception as e:
        print(f"[TRANSFORMATION-SQL-ERROR] Failed to load to Cloud SQL: {e}")
        # We don't raise here to avoid failing the whole function if just SQL fails,
        # but in production you might want to retry.

