from google import genai
from google.genai.types import HttpOptions
from app.core.config import settings
import json
import logging

logger = logging.getLogger(__name__)

class SmartRouter:
    """
    Decides if a user query needs:
    1. DATA (Simple retrieval/SQL-like)
    2. ACTION (System processes like Consolidation)
    3. REASONING (Complex cross-entity analysis)
    """
    def __init__(self):
        # Initialize the client with Vertex AI options
        self.client = genai.Client(
            http_options=HttpOptions(api_version="v1"),
            vertexai=True,
            project=settings.PROJECT_ID,
            location=settings.LOCATION
        )
        self.model_name = settings.GEMINI_FLASH_LITE_MODEL

    async def route(self, query: str):
        prompt = f"""
        You are a financial system router. Analyze the user request: "{query}"
        
        Classify the intent and extract key parameters. 
        Return ONLY a JSON object with:
        - "type": "DATA" | "ACTION" | "REASONING"
        - "parameters": (extracted entities, periods, metrics, etc.)
        
        Examples:
        "Show revenue for Jan 2024" -> {{"type": "DATA", "parameters": {{"period": "2024-01", "metric": "revenue"}}}}
        "Run month-end consolidation" -> {{"type": "ACTION", "parameters": {{"action": "consolidation"}}}}
        "Why is my margin dropping in the West region?" -> {{"type": "REASONING", "parameters": {{"entity": "West", "focus": "gross_margin"}}}}
        """
        
        try:
            # Use the new SDK method
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            
            # Additional safety check for text availability
            if not response.text:
                raise ValueError("Empty response from AI model")

            # Basic cleanup for JSON parsing
            clean_text = response.text.replace('```json', '').replace('```', '').strip()
            return json.loads(clean_text)
        except Exception as e:
            logger.error(f"Router classification failed: {str(e)}")
            # Robust fallback to REASONING if AI logic fails
            return {
                "type": "REASONING", 
                "parameters": {"query": query, "error": "fallback_mode"}
            }
