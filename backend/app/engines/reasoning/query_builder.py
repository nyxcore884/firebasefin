from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class QueryBuilder:
    """
    Translates AI Intent (from SmartRouter) into executable BigQuery SQL.
    Ref: 'Query Builder' in Verification Guide.
    """
    
    async def build_query(self, user_query: str, context: Dict[str, Any] = None) -> str:
        """
        Translates Natural Language to SQL using Vertex AI.
        """
        from app.services.vertex_ai_service import vertex_ai_service
        
        # Use Vertex AI to generate the SQL based on the strict SGP Schema passed in context
        if not context:
            context = {"company": {"org_id": "SGP"}}
            
        sql = vertex_ai_service.generate_sql(user_query, context)
        
        # Basic validation
        if "DELETE" in sql.upper() or "DROP" in sql.upper() or "UPDATE" in sql.upper():
            return "SELECT 'Unsafe Query Blocked' as error"
            
        return sql

query_builder = QueryBuilder()
