import pandas as pd
import json
import logging
import io
from google.cloud import bigquery
from app.core.config import settings

logger = logging.getLogger(__name__)

class MetadataDiscoveryService:
    def __init__(self):
        self.bq_client = bigquery.Client(project=settings.PROJECT_ID)
        self.table_id = f"{settings.PROJECT_ID}.raw_data.universal_intelligence"

    def discover_and_ingest(self, file_content: bytes, sheet_name: str, run_id: str, org_id: str = "SGP"):
        """
        Ingests file content into the Universal Intelligence JSON table.
        This enables 'Schema-Less' flexibility.
        """
        try:
            # 1. Load data
            # Determine if it's Excel or CSV. For now assume Excel based on user context, 
            # but ideally we check extension. IntelligenceService usually splits this.
            # We'll try Excel first.
            try:
                df = pd.read_excel(io.BytesIO(file_content), sheet_name=sheet_name if sheet_name else 0)
            except:
                # Fallback to CSV
                df = pd.read_csv(io.BytesIO(file_content))

            # 2. Convert to JSON rows
            # Convert Timestamps to string to avoid serialization errors
            df = df.astype(object).where(pd.notnull(df), None)
            
            json_data = df.to_dict(orient='records')

            rows_to_insert = [
                {
                    "run_id": run_id,
                    "sheet_name": sheet_name or "Unknown",
                    "org_id": org_id,
                    "payload": json.dumps(row, ensure_ascii=False, default=str)
                } for row in json_data
            ]

            # 3. Ingest into Landing Table
            if rows_to_insert:
                errors = self.bq_client.insert_rows_json(self.table_id, rows_to_insert)
                if errors:
                    logger.error(f"BQ Insert Errors (Universal Intelligence): {errors}")
                else:
                    logger.info(f"Successfully ingested {len(rows_to_insert)} rows into Semantic Lake.")
            
            return len(rows_to_insert)

        except Exception as e:
            logger.error(f"Metadata Discovery & Ingestion failed: {e}")
            raise e

    def _register_intent(self, run_id, sheet, cols):
        """
        Future: Uses LLM to map columns to business definitions.
        """
        pass

# Singleton
metadata_discovery_service = MetadataDiscoveryService()
