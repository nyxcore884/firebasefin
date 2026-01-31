from google.cloud import bigquery
import google.generativeai as genai
import pandas as pd
from app.core.config import settings

# Configuration
PROJECT_ID = settings.PROJECT_ID 
LOCATION = settings.LOCATION
DATASET_ID = f"{PROJECT_ID}.sgp_financial_intelligence"

class FinancialIntelligenceEngine:
    def __init__(self):
        self.bq_client = bigquery.Client(project=PROJECT_ID)
        # Initialize Google AI with API key
        if settings.GOOGLE_API_KEY:
            genai.configure(api_key=settings.GOOGLE_API_KEY)
            self.model = genai.GenerativeModel("gemini-2.0-flash") 

    def get_training_context(self):
        """Fetches AI training examples from BigQuery."""
        query = f"""
            SELECT user_query, ai_response 
            FROM `{DATASET_ID}.ai_training_examples`
        """
        try:
            results = self.bq_client.query(query).result()
            context_str = "\n".join([f"Q: {row.user_query}\nA: {row.ai_response}" for row in results])
            return context_str
        except Exception as e:
            print(f"Error fetching context: {e}")
            return ""

    def generate_sql(self, user_prompt: str):
        """
        Converts natural language user prompt to SQL using Vertex AI 
        and executes it against BigQuery.
        """
        
        # 1. Fetch AI Training Context
        training_context = self.get_training_context()
        
        # 2. Build the System Instruction
        system_instruction = f"""
        You are a financial analyst for SGP. Your goal is to generate BigQuery SQL queries based on user questions.
        
        Use the following examples as logic references (Chain of Thought):
        {training_context}
        
        Key Rules:
        - Standard VAT is 18%.
        - Account 1622 is COGS (Cost of Goods Sold).
        - Account 6110 is Revenue.
        - Table `product_mapping` is at `{DATASET_ID}.product_mapping`.
        - Use the `product_mapping` table to resolve product names to segments.
        - Important: When doing string matching for products, use `LOWER(source.product_name) LIKE CONCAT('%', LOWER(mapping.keyword), '%')`
        - Return ONLY the SQL query. Do not wrap in markdown or code blocks.
        """

        # 3. Generate SQL using Gemini
        chat = self.model.start_chat()
        response = chat.send_message(
            f"{system_instruction}\n\nUser Question: {user_prompt}\nSQL Query:"
        )
        generated_sql = response.text.strip().replace("```sql", "").replace("```", "")
        
        print(f"Generated SQL: {generated_sql}") # For debugging/audit
        return generated_sql

    def execute_query(self, sql_query: str) -> pd.DataFrame:
        """
        Executes a BigQuery SQL query and returns results as a Pandas DataFrame.
        """
        query_job = self.bq_client.query(sql_query)
        results = query_job.to_dataframe()
        return results

    def evaluate_result_confidence(self, df: pd.DataFrame, generated_sql: str) -> tuple[float, str]:
        """
        Self-evaluates the query result and assigns a safety score.
        """
        reason = "SAFE"
        score = 1.0

        # 1. Check for unmapped rows (Logic: look for 'Unmapped' or nulls in key columns if interpretable)
        # Assuming 'segment' or 'english_article' might be present
        if 'segment' in df.columns and df['segment'].str.contains('Unmapped', case=False, na=False).any():
             score = 0.6
             reason = "UNMAPPED_DATA"
        
        # 2. Check for negative prices/revenues (Anomaly)
        # Heuristic: if 'Amount_Gel' or 'revenue' is negative
        numeric_cols = df.select_dtypes(include=['number']).columns
        for col in numeric_cols:
             if 'revenue' in col.lower() or 'amount' in col.lower():
                 if df[col].min() < 0:
                     score = 0.4
                     reason = "DATA_ANOMALY"

        # 3. Check for AI Forecast horizon (Low History)
        if "forecast" in generated_sql.lower():
             # Mock check: logic would ideally check date range of input
             score = 0.75
             reason = "LOW_HISTORY"

        return score, reason

    def handle_financial_query(self, user_query: str) -> dict:
        """
        Main entry point: Query -> SQL -> BigQuery -> Pandas -> (Masking) -> Response
        """
        # 1. Generate SQL
        sql_query = self.generate_sql(user_query)
        if not sql_query:
             return {"error": "Failed to generate SQL"}

        try:
            # 2. Execute SQL
            df = self.execute_query(sql_query)
            
            # 3. Confidence Check
            confidence_score, confidence_reason = self.evaluate_result_confidence(df, sql_query)

            # 4. Security Masking (if applicable - simplistic call here if masking imported)
            # from app.engines.security.masking import mask_sensitive_data
            # df = mask_sensitive_data(df)

            result_dict = df.to_dict(orient="records")

            return {
                "sql": sql_query,
                "data": result_dict,
                "confidence_score": confidence_score,
                "confidence_reason": confidence_reason
            }

        except Exception as e:
            return {"error": str(e), "sql": sql_query}

    def validate_mappings(self, source_table: str):
        """
        Identifies missing mappings in a given source table.
        """
        sql = f"""
        SELECT 
            src.Product AS unknown_item,
            src.Amount_Gel,
            'MISSING_MAPPING' AS issue_type,
            'Action: Add keyword to product_mapping table' AS recommendation
        FROM `{source_table}` AS src
        LEFT JOIN `{DATASET_ID}.product_mapping` AS map
          ON LOWER(src.Product) LIKE CONCAT('%', LOWER(map.keyword), '%')
        WHERE map.keyword IS NULL
        GROUP BY src.Product, src.Amount_Gel
        LIMIT 100
        """
        # Note: The above query assumes source table schema. 
        # In a real dynamic scenario, we might need more flexible column selection.
        # Keeping it as per user's logic template for now.
        
        try:
            results = self.bq_client.query(sql).to_dataframe()
            return results.to_dict(orient="records")
        except Exception as e:
             return {"error": str(e)}

# Singleton instance
financial_intelligence_engine = FinancialIntelligenceEngine()
