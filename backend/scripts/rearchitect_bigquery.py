from google.cloud import bigquery
from google.api_core.exceptions import NotFound
import os
import sys

# Add parent dir to path to allow imports if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings

def rearchitect_db():
    client = bigquery.Client(project=settings.PROJECT_ID)
    location = "us-central1"

    # 1. Define the strictly separated datasets
    datasets = {
        "sgg_core": "SOCAR Georgia Gas - Core Data",
        "sgp_core": "SOCAR Georgia Petroleum - Core Data",
        "socar_consolidated": "SOCAR Group - Consolidated View"
    }

    # 2. Cleanup (WIPE EVERYTHING as requested)
    # Also delete the old one 'sgp_analytics' if exists
    old_datasets = ["sgp_analytics", "sgg_core", "sgp_core", "socar_consolidated"]
    
    print("--- 🗑️ CLEANING OLD DATA BUCKETS ---")
    for ds_id in old_datasets:
        ds_ref = f"{settings.PROJECT_ID}.{ds_id}"
        try:
            client.delete_dataset(ds_ref, delete_contents=True, not_found_ok=True)
            print(f"Deleted dataset (if existed): {ds_id}")
        except Exception as e:
            print(f"Error deleting {ds_id}: {e}")

    # 3. Create New Datasets & Tables
    print("\n--- 🏗️ CREATING SEPARATE DATA WAREHOUSES ---")
    
    # Common Schema for Financials
    schema_financial = [
        bigquery.SchemaField("entity_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("account_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("amount", "FLOAT", mode="REQUIRED"),
        bigquery.SchemaField("date", "TIMESTAMP", mode="REQUIRED"),
        bigquery.SchemaField("description", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("currency", "STRING", mode="NULLABLE"),
        # Metadata
        bigquery.SchemaField("ingested_at", "TIMESTAMP", mode="NULLABLE"),
        bigquery.SchemaField("source_file", "STRING", mode="NULLABLE"),
    ]

    for name, desc in datasets.items():
        ds_ref = bigquery.Dataset(f"{settings.PROJECT_ID}.{name}")
        ds_ref.location = location
        ds_ref.description = desc
        
        try:
            ds = client.create_dataset(ds_ref, exists_ok=True)
            print(f"✅ Created Dataset: {name} [{desc}]")
            
            # Create Financial Records Table in EACH (Isolation)
            table_ref = ds.table("financial_records")
            table = bigquery.Table(table_ref, schema=schema_financial)
            client.create_table(table, exists_ok=True)
            print(f"   Created Table: {name}.financial_records")
            
            # SGP Specific Table
            if name == "sgp_core":
                schema_stations = [
                    bigquery.SchemaField("station_id", "STRING"),
                    bigquery.SchemaField("fuel_type", "STRING"),
                    bigquery.SchemaField("liters_sold", "FLOAT"),
                ]
                client.create_table(bigquery.Table(ds.table("station_sales"), schema=schema_stations), exists_ok=True)
                print(f"   Created Table: {name}.station_sales (SGP Exclusive)")

            # SGG Specific Table
            if name == "sgg_core":
                schema_pipeline = [
                    bigquery.SchemaField("pipeline_id", "STRING"),
                    bigquery.SchemaField("pressure_bar", "FLOAT"),
                    bigquery.SchemaField("flow_rate", "FLOAT"),
                ]
                client.create_table(bigquery.Table(ds.table("pipeline_metrics"), schema=schema_pipeline), exists_ok=True)
                print(f"   Created Table: {name}.pipeline_metrics (SGG Exclusive)")

        except Exception as e:
            print(f"Failed to setup {name}: {e}")

if __name__ == "__main__":
    rearchitect_db()
