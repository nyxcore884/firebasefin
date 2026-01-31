from google.cloud import bigquery
from app.core.config import settings
import uuid
import logging

logger = logging.getLogger(__name__)

class EvolutionEngine:
    """
    Manages the Self-Evolving capability of the system.
    Promotes verified feedback to permanent training memory.
    """
    def __init__(self):
        self.bq_client = bigquery.Client(project=settings.PROJECT_ID)
        self.project_id = settings.PROJECT_ID
        self.candidates_view = f"{self.project_id}.sgp_financial_intelligence.v_retrain_candidates"
        self.training_table = f"{self.project_id}.sgp_financial_intelligence.ai_training_examples"

    def promote_retrain_candidates(self) -> str:
        """
        Identifies high-score feedback and 'promotes' it to ai_training_examples.
        """
        logger.info("Evolution Engine: Checking for logic to promote...")
        
        try:
            # Note: v_retrain_candidates columns based on v5 schema:
            # feedback_id, run_id, user_query, ai_response, rating, user_comment, created_at, logic_context
            query = f"""
                SELECT user_query, user_comment, logic_context
                FROM `{self.candidates_view}`
            """
            candidates = self.bq_client.query(query).to_dataframe()

            if candidates.empty:
                return "No candidates for promotion."

            examples_to_insert = []
            for _, row in candidates.iterrows():
                # Prefer explicit user comment if provided (e.g. "Actually, Diesel implies Wholesale"), 
                # otherwise use the AI's explanation that was approved.
                verified_content = row['user_comment'] if row['user_comment'] else row['logic_context']
                
                examples_to_insert.append({
                    "example_id": f"EVOLVE_{uuid.uuid4().hex[:6]}",
                    "example_category": "Evolution",
                    "user_query": row['user_query'],
                    "ai_response": verified_content,
                    "processing_steps": ["retrieved_from_feedback_loop"],
                    "requires_data": ["universal_intelligence"]
                })

            if examples_to_insert:
                errors = self.bq_client.insert_rows_json(self.training_table, examples_to_insert)

                if not errors:
                    return f"Successfully promoted {len(examples_to_insert)} logic patterns."
                else:
                    return f"Promotion error: {errors}"
            return "No valid examples to promote."
            
        except Exception as e:
            logger.error(f"Evolution Failed: {e}")
            return f"Error: {str(e)}"

    def promote_simulated_logic(self, approved_sql: str, description: str) -> dict:
        """
        Brain 3 Promotion Protocol:
        1. Deprecates existing Logic Version.
        2. Activates new Simulated Logic.
        3. Emits 'Retrain Signal' to Brain 2 via ai_training_examples.
        """
        # 1. Atomic Transaction: Deprecate old, Activate new
        update_query = f"""
            UPDATE `{self.training_table}`
            SET is_active = FALSE, deprecated_at = CURRENT_TIMESTAMP()
            WHERE is_active = TRUE AND example_category = 'Standard_Report';

            INSERT INTO `{self.training_table}` 
            (example_id, example_category, user_query, ai_response, logic_version, is_active)
            VALUES (
                'PROMOTED_{uuid.uuid4().hex[:6]}', 
                'Standard_Report', 
                '{description}', 
                @approved_sql, 
                (SELECT COALESCE(MAX(logic_version), 0) + 1 FROM `{self.training_table}`), 
                TRUE
            );
        """
        job_config = bigquery.QueryJobConfig(
            query_parameters=[bigquery.ScalarQueryParameter("approved_sql", "STRING", approved_sql)]
        )

        try:
            self.bq_client.query(update_query, job_config=job_config).result()
            return {"status": "SUCCESS", "signal": "RETRAIN_EMITTED"}
        except Exception as e:
            return {"status": "ERROR", "message": str(e)}

evolution_engine = EvolutionEngine()
