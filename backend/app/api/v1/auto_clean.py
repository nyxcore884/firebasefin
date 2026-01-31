from fastapi import APIRouter, Body
from app.engines.automation.auto_clean import auto_clean_engine
from typing import Dict, Any

router = APIRouter()

@router.get("/suggestions")
async def get_mapping_suggestions():
    """
    Get suggested mappings for unmapped items.
    """
    return auto_clean_engine.suggest_mappings()

@router.post("/confirm")
async def confirm_mapping(payload: Dict[str, str] = Body(...)):
    """
    Confirm a mapping suggestion.
    Payload: {"raw_item": "foo", "keyword": "bar"}
    """
    raw_item = payload.get("raw_item")
    keyword = payload.get("keyword")
    return auto_clean_engine.confirm_mapping(raw_item, keyword)
