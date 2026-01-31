import vertexai
from vertexai.generative_models import GenerativeModel
from app.core.config import settings
import logging
import os

logger = logging.getLogger(__name__)

class VertexAIService:
    """
    Service for interacting with Vertex AI models, 
    with support for custom tuned model IDs.
    """
    
    def __init__(self, model_id: str = None):
        # Initialize Vertex AI
        vertexai.init(project=settings.PROJECT_ID, location=settings.LOCATION)
        
        # Use provided model_id (e.g. from env or DB) or fallback to default
        self.model_name = model_id or os.environ.get("TUNED_MODEL_ID", settings.GEMINI_PRO_MODEL)
        self.model = GenerativeModel(self.model_name)

    async def generate_response(
        self, 
        user_query: str, 
        context: dict
    ) -> str:
        """
        Generates a context-aware response using the Gemini model.
        """
        org_id = context.get('org_id', 'Unknown')
        company_type = context.get('company_type', 'General')
        
        # SGP-specific context injection
        system_context = f"""
        You are a financial AI assistant for the {settings.PROJECT_NAME}.
        Current Organization ID: {org_id}
        Company Type: {company_type}
        
        Financial Logic Rules:
        - Revenue: Wholesale (Petrol, Diesel, Bitumen) vs Retail (Petrol, Diesel, CNG, LPG).
        - LPG is EXCLUSIVE to SOCAR Petroleum Georgia (SGP).
        - COGS = Account 6 + 7310 + 8230.
        - EBITDA = Gross Margin - G&A Expenses (Accounts 73, 74, 82, 92).
        """
        
        prompt = f"{system_context}\n\nUser Query: {user_query}\n\nProvide an accurate financial analysis or response based on the logic rules above."
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"VertexAI Generation Error: {str(e)}")
            return "I'm sorry, I'm having trouble processing that financial query right now."

    def export_training_data(self, samples: list) -> str:
        """
        Converts a list of samples [user, assistant] into JSONL string for tuning.
        """
        import json
        lines = []
        for sample in samples:
            line = {
                "messages": [
                    {"role": "user", "content": sample['user']},
                    {"role": "assistant", "content": sample['assistant']}
                ]
            }
            lines.append(json.dumps(line, ensure_ascii=False))
        return "\n".join(lines)
