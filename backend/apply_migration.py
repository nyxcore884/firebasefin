from google.cloud import bigquery
from app.core.config import settings
import logging

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migration():
    client = bigquery.Client(project=settings.PROJECT_ID)
    
    # Read SQL file
    with open("backend/migrations/v7_financial_governance.sql", "r", encoding="utf-8") as f:
        sql = f.read()
        
    # Replace project ID placeholder if needed (script has hardcoded project, but good to be safe)
    # The script uses 'studio-9381016045-4d625', ensuring it matches config
    
    logger.info("Running Semantic Lake Migration...")
    try:
        # Run query
        query_job = client.query(sql)
        query_job.result()  # Wait for job to complete
        logger.info("Migration successful!")
    except Exception as e:
        logger.error(f"Migration failed: {e}")

if __name__ == "__main__":
    run_migration()
