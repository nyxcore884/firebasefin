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
