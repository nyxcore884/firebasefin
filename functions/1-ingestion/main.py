import functions_framework
import os

# Get the project ID from the environment
PROJECT_ID = os.environ.get("GCP_PROJECT")
# Define the Pub/Sub topic to which the message will be published
PUB_SUB_TOPIC = "files-to-process"

# Lazy global for publisher to avoid re-init on every warm invocation, 
# but only init when needed
publisher = None

def get_publisher_and_topic():
    global publisher, topic_path
    from google.cloud import pubsub_v1
    if publisher is None:
        publisher = pubsub_v1.PublisherClient()
        topic_path = publisher.topic_path(PROJECT_ID, PUB_SUB_TOPIC)
    return publisher, topic_path

# Define the required columns for the 'July SGG' file type
REQUIRED_COLUMNS = ["transactionNumber", "date", "amountDebitCurrency"]

@functions_framework.cloud_event
def process_file_upload(cloud_event):
    """
    This Cloud Function is the primary entry point for the Data Ingestion Service.
    It is triggered by a file upload to the raw-financial-data-ingestion bucket.
    
    It performs initial validation ("Document Intelligence") and, if successful,
    publishes a message to a Pub/Sub topic for further processing.
    """
    file_data = cloud_event.data
    bucket_name = file_data["bucket"]
    file_name = file_data["name"]

    print(f"[INGESTION] New file detected: {file_name} in bucket: {bucket_name}")

    # --- Document Intelligence --- #
    # Here we perform a simple validation based on the filename

    # For this example, we'll check if the file is 'July SGG'
    if "july sgg" in file_name.lower():
        print(f"[INGESTION] Detected 'July SGG' file type. Performing column validation...")
        if not validate_sgg_file(bucket_name, file_name):
            print(f"[INGESTION-ERROR] Validation failed for {file_name}. Halting processing.")
            # In a real system, you would move this file to an 'error' bucket
            # or log this failure to a monitoring system.
            return # Stop processing
        print(f"[INGESTION] Validation successful for {file_name}.")
    else:
        print(f"[INGESTION] No specific validation for file type '{file_name}'. Proceeding.")

    # --- Asynchronous Trigger --- #
    # If validation passes, publish a message to the Pub/Sub topic
    # This decouples ingestion from transformation, as per the architecture.
    try:
        publisher_client, topic = get_publisher_and_topic()
        message_data = f"{bucket_name}/{file_name}".encode("utf-8")
        future = publisher_client.publish(topic, data=message_data)
        print(f"[INGESTION] Published message to {PUB_SUB_TOPIC}. Message ID: {future.result()}")
    except Exception as e:
        print(f"[INGESTION-ERROR] Failed to publish message for {file_name}. Error: {e}")
        raise

def validate_sgg_file(bucket_name, file_name):
    """Reads a CSV file from GCS and checks for required columns."""
    from google.cloud import storage
    import pandas as pd
    from io import StringIO
    
    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(file_name)
        
        # Read the file content
        file_contents = blob.download_as_string().decode('utf-8')
        csv_data = StringIO(file_contents)
        df = pd.read_csv(csv_data)
        
        # Check for required columns
        missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
        
        if missing_columns:
            print(f"[INGESTION-ERROR] File {file_name} is missing required columns: {missing_columns}")
            return False
        
        return True
    except Exception as e:
        print(f"[INGESTION-ERROR] Could not read or validate file {file_name}. Error: {e}")
        return False

