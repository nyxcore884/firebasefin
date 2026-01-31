from fastapi import APIRouter, HTTPException, Body
from app.engines.reasoning.financial_intelligence import financial_intelligence_engine
from app.engines.automation.batch_engine import batch_mapping_engine
from google.cloud import bigquery
from app.core.config import settings
from typing import Dict, Any

router = APIRouter()

@router.post("/query")
async def query_financial_data(payload: Dict[str, Any] = Body(...)):
    """
    Process natural language financial queries.
    Payload: {"prompt": "Query text"}
    """
    prompt = payload.get("prompt")
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
    
    result = financial_intelligence_engine.handle_financial_query(prompt)
    if "error" in result:
        # We might want to return 400 or 500 depending on error, 
        # but returning 200 with error details is often easier for frontend debugging of SQL generation.
        return result 
        
    return result

@router.post("/validate")
async def validate_mappings():
    """
    Checks for unmapped products in the latest data.
    """
    return financial_intelligence_engine.validate_mappings()

@router.post("/feedback")
async def save_user_feedback(data: dict):
    """
    Saves user feedback (thumbs up/down) to BigQuery for retraining.
    """
    client = bigquery.Client(project=settings.PROJECT_ID)
    table_id = f"{settings.PROJECT_ID}.{settings.BIGQUERY_DATASET}.ai_feedback_loop"

    # Ensure data has required fields or defaults
    row = {
        "request_id": data.get("request_id"),
        "user_query": data.get("user_query"),
        "generated_sql": data.get("generated_sql"),
        "feedback_score": data.get("feedback_score"),
        "user_comment": data.get("user_comment"),
        "is_flagged_for_retraining": False if data.get("feedback_score") == 1 else True
    }

    errors = client.insert_rows_json(table_id, [row])

    if not errors:
        return {"status": "success"}
    else:
        return {"status": "error", "details": errors}

@router.post("/batch-map")
async def trigger_batch_mapping(data: dict):
    """
    Triggers batch mapping update based on pattern.
    """
    # Expects: pattern, keyword, article, segment
    return batch_mapping_engine.run_batch_mapping_update(
        data.get("pattern"), 
        data.get("keyword"),
        data.get("article"),
        data.get("segment")
    )

@router.post("/admin/correct")
async def trigger_admin_correction(data: dict):
    """
    Triggers batch admin correction for feedback loop.
    Expects: keyword_match, replace_from, replace_to
    """
    return batch_mapping_engine.run_admin_correction(
        data.get("keyword_match"),
        data.get("replace_from"),
        data.get("replace_to")
    )
