import logging
import json
import os
from vertexai.generative_models import GenerativeModel
import vertexai

logger = logging.getLogger(__name__)

def generate_flow_docs(nodes, edges, company_id="GLOBAL"):
    """
    Uses Gemini to synthesize technical and business documentation for the flow.
    """
    try:
        PROJECT_ID = "studio-9381016045-4d625"
        LOCATION = "us-central1"
        vertexai.init(project=PROJECT_ID, location=LOCATION)
        
        model = GenerativeModel("gemini-1.5-flash-001")
        
        # Prepare graph summary
        node_summaries = []
        for n in nodes:
            d = n.get('data', {})
            node_summaries.append(f"- {d.get('label')} ({d.get('kind')}): {json.dumps(d.get('config', d.get('params', {})))}")
            
        edge_summaries = []
        for e in edges:
            edge_summaries.append(f"- {e.get('source')} -> {e.get('target')}")
            
        prompt = f"""You are a Lead Financial Systems Architect. 
Analyze the following financial system flow graph for company {company_id} and generate a comprehensive technical documentation.

Nodes:
{chr(10).join(node_summaries)}

Topology:
{chr(10).join(edge_summaries)}

Structure the documentation as follows:
# System Architecture: FinSight Digital Twin
## Executive Summary
(Overall purpose of this flow)

## Data Lineage & Governance
(How data moves and where controls are enforced)

## AI & Business Logic
(Briefing on the models and metrics computed)

## Compliance & Security
(Notes on data privacy and audit trails)

Return valid Markdown.
"""

        response = model.generate_content(prompt)
        return {
            "status": "success",
            "documentation": response.text,
            "generatedAt": "now"
        }
        
    except Exception as e:
        logger.error(f"Doc generation failed: {e}")
        return {
            "status": "error",
            "message": str(e),
            "documentation": "Documentation synthesis failed. Check Vertex AI configuration."
        }
