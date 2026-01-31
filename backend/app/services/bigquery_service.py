from google.cloud import bigquery
from app.core.config import settings
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class BigQueryService:
    def __init__(self):
        self.client = bigquery.Client(project=settings.PROJECT_ID, location=settings.LOCATION)
        self.dataset_ref = f"{settings.PROJECT_ID}.{settings.BIGQUERY_DATASET}"

    def get_dataset_for_org(self, org_id: str) -> str:
        """
        Determines the correct BigQuery dataset based on the Organization ID.
        Strict separation: SGG, SGP, and SOCAR Group.
        """
        if not org_id:
            logger.warning("No org_id provided for dataset routing. Falling back to consolidated.")
            return f"{settings.PROJECT_ID}.socar_consolidated"
        
        normalized = str(org_id).upper()
        if "SGG" in normalized or "GAS" in normalized:
            return f"{settings.PROJECT_ID}.sgg_core"
        elif "SGP" in normalized or "PETROLEUM" in normalized:
            return f"{settings.PROJECT_ID}.sgp_core"
        else:
            return f"{settings.PROJECT_ID}.socar_consolidated"

    def insert_financial_records(self, records: list[dict]):
        """
        Stream financial records to BigQuery in strict isolation.
        Routes data to sgg_core, sgp_core, or socar_consolidated based on record['orgId'].
        """
        # Group records by target dataset to minimize API calls
        dataset_batches = {}

        for record in records:
            if "ingested_at" not in record:
                record["ingested_at"] = datetime.utcnow().isoformat()
            
            # Determine routing
            org_id = record.get("orgId") or record.get("org_id", "SOCAR_GROUP")
            dataset_id = self.get_dataset_for_org(org_id)
            
            if dataset_id not in dataset_batches:
                dataset_batches[dataset_id] = []
            dataset_batches[dataset_id].append(record)

        # Batch insert into respective warehouses
        for ds_ref, batch in dataset_batches.items():
            try:
                table_id = f"{ds_ref}.financial_records"
                errors = self.client.insert_rows_json(table_id, batch)
                if errors:
                    logger.error(f"BigQuery Insert Errors for {table_id}: {errors}")
                    # We continue trying other batches if one fails, but log error
                else:
                    logger.info(f"Successfully inserted {len(batch)} records into {table_id}")
            except Exception as e:
                logger.error(f"BigQuery Exception for {table_id}: {str(e)}")
                # Decide: Raise or continue? For robust ingestion, we might log and continue, 
                # but if ALL fail, we should probably raise.
                # For now, simplistic re-raise:
                raise e
        
        return True

    def get_training_data(self, entity_id: str, limit: int = 1000):
        """
        Fetch historical data for model training.
        """
        query = f"""
            SELECT date, revenue, volume, features
            FROM `{self.dataset_ref}.training_data`
            WHERE entity_id = @entity_id
            ORDER BY date DESC
            LIMIT @limit
        """
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("entity_id", "STRING", entity_id),
                bigquery.ScalarQueryParameter("limit", "INTEGER", limit)
            ]
        )
        
        try:
            query_job = self.client.query(query, job_config=job_config)
            return [dict(row) for row in query_job]
        except Exception as e:
            logger.error(f"BigQuery Query Failed: {str(e)}")
            raise

    def generate_training_data(self):
        """
        ETL: Aggregates raw financial records into daily training data.
        Source: financial_records
        Target: training_data
        """
        query = f"""
            INSERT INTO `{self.dataset_ref}.training_data` (entity_id, date, revenue, volume)
            SELECT
                entity as entity_id,
                date(ingested_at) as date,
                SUM(amount) as revenue,
                COUNT(*) as volume
            FROM `{self.dataset_ref}.financial_records`
            GROUP BY 1, 2
        """
        try:
            query_job = self.client.query(query)
            query_job.result() # Wait for job to complete
            logger.info("Successfully generated training data from financial records.")
            return True
        except Exception as e:
            logger.error(f"ETL Job Failed: {str(e)}")
            raise

    def list_uploaded_files(self, org_id: str):
        """
        Lists uploaded files from the organization's specific dataset.
        Returns metadata: filename, upload date, record count.
        """
        dataset_id = self.get_dataset_for_org(org_id)
        
        # Check if table exists first prevents errors on empty buckets
        # But simpler to just try/catch query
        
        query = f"""
            SELECT 
                source_file as name,
                MAX(ingested_at) as updatedAt,
                COUNT(*) as records,
                'Actual' as type, -- Inference or metadata could improve this
                '{org_id}' as entity_count -- Placeholder, effectively
            FROM `{dataset_id}.financial_records`
            GROUP BY source_file
            ORDER BY updatedAt DESC
        """
        
        try:
            job = self.client.query(query)
            results = []
            for row in job:
                # Convert BigQuery row to dict
                r = dict(row)
                # Format timestamp
                if r['updatedAt']:
                    r['updatedAt'] = r['updatedAt'].isoformat()
                
                # Mock missing fields for UI compatibility
                r['id'] = r['name'] # Use filename as ID
                r['status'] = 'Validated'
                r['quality'] = 100 # Placeholder
                r['period'] = '2025-Current'
                r['entities'] = 1
                results.append(r)
                
            return results
        except Exception as e:
            # If table doesn't exist (empty bucket), return empty list
            if "Not found" in str(e):
                return []
            logger.error(f"List Files Failed: {str(e)}")
            return []

    def perform_universal_discovery(self, table_id: str, numeric_columns: list[str], org_id: str):
        """
        Brain 1: Auto-Scan any uploaded table for outliers using UNPIVOT.
        Flags potential forensic anomalies immediately after upload.
        """
        if not numeric_columns:
            return []

        cols_str = ", ".join(numeric_columns)
        query = f"""
            SELECT 
                column_name, 
                CAST(AVG(val) AS FLOAT64) as mean, 
                CAST(STDDEV(val) AS FLOAT64) as stddev,
                CAST(MAX(val) AS FLOAT64) as max_outlier
            FROM `{table_id}`
            UNPIVOT(val FOR column_name IN ({cols_str}))
            GROUP BY 1
            HAVING max_outlier > (mean + (3 * stddev))
        """
        try:
            query_job = self.client.query(query)
            anomalies = [dict(row) for row in query_job]
            
            if anomalies:
                logger.info(f"Universal Discovery found {len(anomalies)} anomalies in {table_id}")
                # Log to systemic feedback loop for Brain 2/LLM to see later
                self._log_anomalies_to_feedback(table_id, anomalies, org_id)
                
            return anomalies
        except Exception as e:
            logger.error(f"Universal Discovery Failed for {table_id}: {str(e)}")
            return []

    def _log_anomalies_to_feedback(self, source_table: str, anomalies: list[dict], org_id: str):
        """
        Logs discovered anomalies into the feedback loop for future logic synthesis.
        """
        feedback_table = f"{settings.PROJECT_ID}.sgp_financial_intelligence.ai_feedback_loop"
        try:
            records = [
                {
                    "request_id": f"system_scan_{datetime.now().strftime('%Y%m%d')}",
                    "org_id": org_id,
                    "user_query": f"SYSTEM_SCAN_{source_table}",
                    "user_comment": f"Detected outlier in {a['column_name']}: {a['max_outlier']} (Mean: {a['mean']:.2f})",
                    "was_corrected": False, # FIX: System scans should NOT be treated as institutional "memories"
                    "timestamp": datetime.now().isoformat()
                } for a in anomalies
            ]
            self.client.insert_rows_json(feedback_table, records)
        except Exception as e:
            logger.warning(f"Failed to log anomalies to feedback loop: {e}")

    def ingest_large_file(self, content: bytes, filename: str, run_id: str):
        """
        Brain 1: High-Volume Ingestion Logic (30MB+).
        Uses chunking to stage massive datasets for the Forensic Engine.
        """
        import pandas as pd
        import io
        try:
            if filename.endswith('.xlsx'):
                df = pd.read_excel(io.BytesIO(content))
            else:
                df = pd.read_csv(io.BytesIO(content))

            # Sanitize columns
            df.columns = [c.lower().replace(' ', '_').strip() for c in df.columns]

            table_id = f"temp_staging.upload_{run_id}"
            full_table_id = f"{settings.PROJECT_ID}.{table_id}"

            # Chunked ingestion
            df.to_gbq(
                destination_table=table_id,
                project_id=settings.PROJECT_ID,
                if_exists='replace',
                chunksize=10000,
                progress_bar=False
            )
            logger.info(f"High-volume ingestion successful: {full_table_id}")
            return full_table_id
        except Exception as e:
            logger.error(f"Ingestion Engine Failure: {str(e)}")
            return None

bq_service = BigQueryService()
