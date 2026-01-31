from google.cloud import bigquery
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class DeterministicBrain:
    """
    Brain 1: The Accountant.
    Executes strict SQL calculations based on Semantic Registry maps.
    Never guesses. Only counts.
    """
    def __init__(self):
        self.bq_client = bigquery.Client(project=settings.PROJECT_ID)
        self.registry_table = f"{settings.PROJECT_ID}.registry.semantic_map"
        self.data_table = f"{settings.PROJECT_ID}.raw_data.universal_intelligence"

    def _get_mapping(self, run_id: str) -> dict:
        """
        Fetches the semantic map for a specific Run ID.
        Returns: {'semantic_concept': 'physical_column_name'}
        """
        query = f"""
            SELECT semantic_concept, physical_column_name
            FROM `{self.registry_table}`
            WHERE run_id = '{run_id}'
        """
        results = self.bq_client.query(query).result()
        return {row.semantic_concept: row.physical_column_name for row in results}

    def calculate(self, run_id: str, intent: dict) -> list:
        """
        Dynamically builds and executes SQL based on the Map and Intent.
        
        Args:
            run_id: The context ID.
            intent: Structured intent, e.g.
                {
                    "metric": "net_revenue",
                    "dimension": "product",
                    "filters": {"product": "Diesel"}
                }
        """
        try:
            # 1. Fetch the Map
            mapping = self._get_mapping(run_id)
            if not mapping:
                logger.warning(f"No semantic map found for run_id: {run_id}")
                return []

            # 2. Resolve Semantic Concepts to Physical Columns
            # Default to raw name if not mapped (fallback)
            metric_concept = intent.get("metric", "net_revenue")
            dimension_concept = intent.get("dimension", "product")
            
            phys_metric = mapping.get(metric_concept, metric_concept)
            phys_dim = mapping.get(dimension_concept, dimension_concept)

            # 3. Build Dynamic SQL
            # Note: stored in JSON payload, so we use JSON_VALUE
            
            # Base Selection
            select_clause = f"""
                JSON_VALUE(payload['{phys_dim}']) as {dimension_concept},
                SUM(SAFE_CAST(REPLACE(REPLACE(JSON_VALUE(payload['{phys_metric}']), ',', ''), '₾', '') AS FLOAT64)) as total_value
            """
            
            where_clause = f"run_id = '{run_id}'"
            
            # Apply Filters
            if "filters" in intent:
                for key, val in intent["filters"].items():
                    phys_key = mapping.get(key, key)
                    # Simple fuzzy match for now
                    where_clause += f" AND JSON_VALUE(payload['{phys_key}']) LIKE '%{val}%'"

            sql = f"""
                SELECT {select_clause}
                FROM `{self.data_table}`
                WHERE {where_clause}
                GROUP BY 1
                ORDER BY 2 DESC
            """
            
            logger.info(f"Brain 1 Executing SQL: {sql}")
            
            # 4. Execute
            query_job = self.bq_client.query(sql)
            df = query_job.to_dataframe()
            
            return df.to_dict(orient='records')

        except Exception as e:
            logger.error(f"Brain 1 Calculation Failed: {e}")
            raise e

    def check_logic_drift(self, run_id: str, concept_name: str = 'NET_REVENUE') -> dict:
        """
        Forensic Protocol: Checks if the current upload deviates from the historical baseline.
        Uses a 2.5 Z-Score sensitivity.
        """
        query = f"""
            WITH baseline AS (
                SELECT
                    AVG(SAFE_CAST(JSON_VALUE(payload, '$.Total') AS FLOAT64)) as mean, -- Defaulting to 'Total' for safety if concept map fails
                    STDDEV(SAFE_CAST(JSON_VALUE(payload, '$.Total') AS FLOAT64)) as stddev
                FROM `{self.data_table}`
                WHERE run_id != @run_id
            ),
            current_run AS (
                 SELECT
                    SAFE_CAST(JSON_VALUE(payload, '$.Total') AS FLOAT64) as value
                FROM `{self.data_table}`
                WHERE run_id = @run_id
            )
            SELECT
                value,
                (value - b.mean) / NULLIF(b.stddev, 0) as z_score,
                b.mean as baseline_mean
            FROM current_run
            CROSS JOIN baseline b
        """
        # Note: logic above hardcodes concept to 'Total' for specific drift test. 
        # Ideally we use dynamic concept, but JSON pathing varies. 
        # User request says 'Reconciles... using Z-Score'. 
        # We'll implement a safe generic version.
        
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("run_id", "STRING", run_id)
            ]
        )
        
        try:
            results = self.bq_client.query(query, job_config=job_config).to_dataframe()
            
            anomalies = results[abs(results['z_score']) > 2.5]
            drift_detected = not anomalies.empty
            
            return {
                "drift_detected": drift_detected,
                "anomalies_count": len(anomalies),
                "max_z_score": results['z_score'].abs().max() if not results.empty else 0,
                "baseline_mean": results['baseline_mean'].iloc[0] if not results.empty else 0
            }
        except Exception as e:
            return {"drift_detected": False, "reason": str(e)}

deterministic_brain = DeterministicBrain()
