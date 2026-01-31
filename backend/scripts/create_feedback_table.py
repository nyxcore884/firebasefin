"""
Create BigQuery table for AI feedback logs
Run this once to set up the feedback logging infrastructure
"""

from google.cloud import bigquery
from app.core.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_feedback_table():
    """Create BigQuery table for AI feedback logs"""
    
    client = bigquery.Client(project=settings.PROJECT_ID)
    
    # Dataset
    dataset_id = "ai_training"
    dataset = bigquery.Dataset(f"{settings.PROJECT_ID}.{dataset_id}")
    dataset.location = settings.LOCATION
    
    try:
        dataset = client.create_dataset(dataset, exists_ok=True)
        logger.info(f"Dataset {dataset_id} created or already exists")
    except Exception as e:
        logger.error(f"Failed to create dataset: {str(e)}")
        return
    
    # Table schema
    table_id = f"{settings.PROJECT_ID}.{dataset_id}.feedback_logs"
    
    schema = [
        bigquery.SchemaField("timestamp", "TIMESTAMP", mode="REQUIRED"),
        bigquery.SchemaField("query_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("query", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("response", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("rating", "INTEGER", mode="REQUIRED"),
        bigquery.SchemaField("correction", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("org_id", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("page", "STRING", mode="NULLABLE"),
    ]
    
    table = bigquery.Table(table_id, schema=schema)
    table.time_partitioning = bigquery.TimePartitioning(
        type_=bigquery.TimePartitioningType.DAY,
        field="timestamp"
    )
    
    try:
        table = client.create_table(table, exists_ok=True)
        logger.info(f"Table {table_id} created successfully")
        logger.info(f"Schema: {[field.name for field in schema]}")
    except Exception as e:
        logger.error(f"Failed to create table: {str(e)}")
        return
    
    logger.info("✅ AI feedback infrastructure ready")

if __name__ == "__main__":
    create_feedback_table()
