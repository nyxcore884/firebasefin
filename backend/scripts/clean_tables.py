from google.cloud import bigquery
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def clean_tables():
    PROJECT_ID = os.getenv("PROJECT_ID", "studio-9381016045-4d625")
    DATASET_ID = "sgp_financial_intelligence"
    
    client = bigquery.Client(project=PROJECT_ID)
    
    tables = [
        "revenue_data",
        "cogs_data",
        "processing_pipeline",
        "ai_training_examples",
        "financial_records" # If this exists in other datasets
    ]
    
    # Also check other datasets
    datasets = ["sgp_financial_intelligence", "sgg_core", "sgp_core", "socar_consolidated"]
    
    for dataset_id in datasets:
        dataset_ref = f"{PROJECT_ID}.{dataset_id}"
        try:
            full_tables = client.list_tables(dataset_ref)
            for table in full_tables:
                table_id = f"{dataset_ref}.{table.table_id}"
                logger.info(f"Truncating table: {table_id}")
                try:
                    query = f"TRUNCATE TABLE `{table_id}`"
                    client.query(query).result()
                    logger.info(f"Successfully truncated {table_id}")
                except Exception as e:
                    logger.warning(f"Failed to truncate {table_id}: {e}")
        except Exception as e:
            logger.warning(f"Could not access dataset {dataset_id}: {e}")

if __name__ == "__main__":
    clean_tables()
