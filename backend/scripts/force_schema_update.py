import os
import sys
from google.cloud import bigquery
from google.api_core.exceptions import NotFound

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings
from scripts.setup_bigquery import setup_bigquery

def force_update():
    client = bigquery.Client(project=settings.PROJECT_ID, location=settings.LOCATION)
    dataset_id = f"{settings.PROJECT_ID}.{settings.BIGQUERY_DATASET}"
    
    tables_to_reset = ["financial_records"]
    
    print(f"Resetting tables in {dataset_id}...")
    
    for table_name in tables_to_reset:
        table_id = f"{dataset_id}.{table_name}"
        try:
            client.delete_table(table_id, not_found_ok=True)
            print(f"Deleted {table_id}")
        except Exception as e:
            print(f"Error deleting {table_id}: {e}")

    print("Re-running setup to recreate with new schema...")
    setup_bigquery()
    print("Schema update complete.")

if __name__ == "__main__":
    force_update()
