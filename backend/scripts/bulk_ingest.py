import os
import sys
import asyncio
import logging

# Logic to add 'backend' to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.append(backend_dir)

from app.services.parser_service import parser_service
from app.services.financial_engine import financial_engine
from app.services.bigquery_service import bq_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def bulk_ingest(directory_path: str):
    """
    Scans a directory for Excel files and ingests them.
    """
    if not os.path.exists(directory_path):
        logger.error(f"Directory not found: {directory_path}")
        return

    files = [f for f in os.listdir(directory_path) if f.endswith(('.xlsx', '.xls'))]
    logger.info(f"Found {len(files)} files to ingest.")

    for filename in files:
        file_path = os.path.join(directory_path, filename)
        try:
            logger.info(f"Processing {filename}...")
            
            with open(file_path, "rb") as f:
                content = f.read()
            
            # 1. Parse
            raw = parser_service.parse_excel(content, filename)
            
            # 2. Process (Assuming SGP)
            processed = financial_engine.process_records(raw, "SGP-001") # Defaulting to SGP for bulk
            
            # 3. Ingest
            bq_service.insert_financial_records(processed)
            
            logger.info(f"Successfully ingested {len(processed)} records from {filename}")
            
        except Exception as e:
            logger.error(f"Failed to ingest {filename}: {str(e)}")

    # 4. Trigger ETL
    logger.info("Triggering ETL to update training data...")
    bq_service.generate_training_data()
    logger.info("Bulk ingestion complete.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python bulk_ingest.py <directory_path>")
    else:
        asyncio.run(bulk_ingest(sys.argv[1]))
