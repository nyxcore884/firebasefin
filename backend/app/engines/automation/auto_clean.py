from google.cloud import bigquery
from app.core.config import settings
import difflib

class AutoCleanEngine:
    def __init__(self):
        self.bq_client = bigquery.Client(project=settings.PROJECT_ID)
        self.mapping_table = f"{settings.PROJECT_ID}.{settings.BIGQUERY_DATASET}.product_mapping"
        self.master_view = f"{settings.PROJECT_ID}.{settings.BIGQUERY_DATASET}.v_financial_master"

    def suggest_mappings(self):
        """
        Finds UNMAPPED items and suggests keywords.
        """
        # 1. Fetch valid keywords
        kw_query = f"SELECT keyword FROM `{self.mapping_table}`"
        try:
            keywords = [row.keyword for row in self.bq_client.query(kw_query).result()]
        except Exception:
            keywords = [] # Fallback

        # 2. Identify unmapped
        unmapped_query = f"SELECT DISTINCT raw_name FROM `{self.master_view}` WHERE segment = 'UNMAPPED' LIMIT 50"
        try:
            unmapped_items = [row.raw_name for row in self.bq_client.query(unmapped_query).result()]
        except Exception:
            unmapped_items = []

        suggestions = []
        for item in unmapped_items:
            # Fuzzy match
            match = difflib.get_close_matches(item.lower(), [k.lower() for k in keywords], n=1, cutoff=0.4)
            # We map back to original casing if possible, or just use the match
            suggestion = match[0] if match else "MANUAL_ENTRY_REQUIRED"
            
            # Simple heuristic: if no fuzzy match, check if parts of string match? 
            # User logic was simple close_matches.
            
            suggestions.append({
                "raw_item": item, 
                "suggested_keyword": suggestion,
                "confidence": 0.8 if match else 0.0
            })

        return suggestions

    def confirm_mapping(self, raw_item: str, keyword: str):
        """
        Saves a new mapping.
        """
        # In a real app, we'd determine proper English Article, Segment etc. based on the Keyword or user input.
        # For this demo, we assume the user confirms 'raw_item' maps to existing 'keyword' rules, 
        # OR we insert a new keyword rule. 
        # User logic: "Save mapping". 
        # If we are adding a NEW keyword to the table that maps to a segment, that's an INSERT.
        # Let's assume we map the specific raw text to a known category via a new keyword entry (the raw text itself becomes a keyword)
        # OR we just update the mapping table to include a new keyword variation.
        
        sql = f"""
        INSERT INTO `{self.mapping_table}` 
        (mapping_id, keyword, english_article, segment, unit_type, account_code_prefix)
        VALUES (GENERATE_UUID(), '{keyword}', 'Mapped Article ({keyword})', 'Retail', 'L', '1622')
        """
        # This is very simplified. Real app needs values for the columns.
        
        try:
            self.bq_client.query(sql).result()
            return {"status": "success", "message": f"Mapping confirmed for {keyword}"}
        except Exception as e:
            return {"error": str(e)}

auto_clean_engine = AutoCleanEngine()
