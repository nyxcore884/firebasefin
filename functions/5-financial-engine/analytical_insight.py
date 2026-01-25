import json
import logging
from vertexai.generative_models import GenerativeModel

logger = logging.getLogger(__name__)

def generate_financial_analysis(metrics, company_id, period, view='executive'):
    """
    Uses Vertex AI to synthesize metrics into a high-end Strategic Dossier.
    """
    try:
        model = GenerativeModel("gemini-1.5-flash")
        
        prompt = f"""
        You are a World-Class Financial Intelligence Architect.
        Analyze metrics for {company_id} [Period: {period}] from the {view.upper()} perspective.
        
        METRICS DATA:
        {json.dumps(metrics, indent=2)}
        
        TASK:
        Generate a "High-End Analysis Dossier" in JSON format.
        The content MUST be data-driven, strategic, and professional. Avoid generic filler.

        SCHEMA:
        {{
            "header": {{
                "title": "Short punchy report title",
                "summary": "1-sentence strategic bottom-line"
            }},
            "intelligence_modules": [
                {{
                    "category": "Growth, Risk, or Efficiency",
                    "title": "Module Title",
                    "insight": "Data-driven detail",
                    "value": "Calculated KPI or metric string",
                    "status": "positive | warning | critical"
                }}
            ],
            "swot": {{
                "strengths": ["..."],
                "opportunities": ["..."],
                "risks": ["..."]
            }},
            "executive_briefing": "A 3-paragraph deep-dive logic of the current situation including recommendations.",
            "kpi_ribbon": [
                {{ "label": "Revenue Flow", "value": "₾...", "trend": "+/- %" }},
                {{ "label": "Burn Velocity", "value": "₾...", "trend": "+/- %" }}
            ],
            "visual_recommendation": "Describe a specific infographic we should show (e.g. 'Intercompany Elimination Waterfall')"
        }}

        PERSONA GUIDELINES:
        - EXECUTIVE: Focus on Net Profit, Market Position, Intercompany discrepancies.
        - FINANCE: Focus on GL anomalies, Budget variance, Tax risk, Audit readiness.
        - DEPARTMENT: Focus on Operational efficiency, Headcount productivity, Social Gas volume.

        Return ONLY the raw JSON object.
        """
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        
        return json.loads(text)
    except Exception as e:
        logger.error(f"AI Insights Error: {e}")
        return {
            "header": {"title": "System Alert", "summary": "Metrics synthesis delayed."},
            "intelligence_modules": [],
            "swot": {"strengths": [], "opportunities": [], "risks": ["Vertex AI Timeout"]},
            "executive_briefing": "Unable to generate deep-dive analysis at this moment.",
            "kpi_ribbon": [],
            "visual_recommendation": "Standard Table"
        }
