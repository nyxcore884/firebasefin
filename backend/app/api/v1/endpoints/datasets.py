from fastapi import APIRouter, Depends, HTTPException, Query
from app.services.bigquery_service import bq_service
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("")
async def list_datasets(org_id: str = Query(..., description="Organization ID to fetch datasets for")):
    """
    List all uploaded datasets (files) for a specific organization.
    Connects to the isolated BigQuery bucket.
    """
    try:
        datasets = bq_service.list_uploaded_files(org_id)
        return datasets
    except Exception as e:
        logger.error(f"Error fetching datasets: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
