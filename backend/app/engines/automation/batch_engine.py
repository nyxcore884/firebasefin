from google.cloud import bigquery
from app.core.config import settings

class BatchMappingEngine:
    def __init__(self):
        self.bq_client = bigquery.Client(project=settings.PROJECT_ID)
        self.mapping_table = f"{settings.PROJECT_ID}.{settings.BIGQUERY_DATASET}.product_mapping"
        # Using a raw source table for pattern matching. 
        # In setup script we created `raw_uploads`.
        self.source_table = f"{settings.PROJECT_ID}.financial_data.raw_uploads"

    def run_batch_mapping_update(self, pattern: str, keyword: str, article: str, segment: str):
        """
        Maps all items matching `pattern` to the specified keyword/article/segment.
        Uses MERGE statement for efficiency.
        """
        # User defined pattern, e.g. '%Imagine%'
        # We find distinct new items in source matching this pattern
        # And insert them into mapping table
        
        sql = f"""
        MERGE `{self.mapping_table}` T
        USING (
          SELECT DISTINCT 
            GENERATE_UUID() as mapping_id,
            '{keyword}' as keyword, 
            '{article}' as english_article, 
            '{segment}' as segment,
            'Batch' as unit_type,
            '0000' as account_code_prefix
          FROM `{self.source_table}` 
          WHERE Product LIKE '{pattern}'
        ) S
        ON T.keyword = S.keyword
        WHEN NOT MATCHED THEN
          INSERT (mapping_id, keyword, english_article, segment, unit_type, account_code_prefix)
          VALUES (S.mapping_id, S.keyword, S.english_article, S.segment, S.unit_type, S.account_code_prefix);
        """
        
        try:
            job = self.bq_client.query(sql)
            job.result()
            return {"status": "success", "message": f"Batch update triggered for pattern: {pattern}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def run_admin_correction(self, keyword_match: str, replace_from: str, replace_to: str):
        """
        Fixes multiple entries in the feedback loop simultaneously.
        Example: Fix all 'VAT Logic Error' where user_comment like '%vat%'.
        """
        # Sanitize inputs to prevent basic injection (though mostly internal tool)
        safe_keyword = keyword_match.replace("'", "\\'")
        safe_from = replace_from.replace("'", "\\'")
        safe_to = replace_to.replace("'", "\\'")

        sql = f"""
        UPDATE `{settings.PROJECT_ID}.{settings.BIGQUERY_DATASET}.ai_feedback_loop`
        SET 
          was_corrected = TRUE,
          is_flagged_for_retraining = TRUE,
          corrected_sql = REPLACE(generated_sql, '{safe_from}', '{safe_to}')
        WHERE 
          feedback_score = -1 
          AND (LOWER(user_comment) LIKE '%{safe_keyword}%')
          AND was_corrected = FALSE
        """
        
        try:
            job = self.bq_client.query(sql)
            job.result() # Wait for job to complete
            return {"status": "success", "message": f"Admin correction applied for keyword: {keyword_match}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

batch_mapping_engine = BatchMappingEngine()
