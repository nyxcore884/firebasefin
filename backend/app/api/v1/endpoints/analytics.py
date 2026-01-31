from fastapi import APIRouter, Depends, HTTPException
from app.services.bigquery_service import bq_service
from app.core.middleware import CompanyContextMiddleware # Assuming we can access state if needed
from pydantic import BaseModel
from typing import List, Optional
from datetime import date

router = APIRouter()

class TrainRequest(BaseModel):
    entity_id: str
    model_type: str = "forecasting"

class PredictionRequest(BaseModel):
    entity_id: str
    target_date: date
    features: dict

@router.post("/train")
async def trigger_training(request: TrainRequest):
    """
    Triggers a Vertex AI training pipeline.
    Fetching data from BigQuery to validate connection.
    """
    try:
        # 1. Fetch data to ensure pipeline has access
        data = bq_service.get_training_data(request.entity_id, limit=10)
        
        # 2. Trigger Vertex AI Pipeline (Placeholder)
        # vertex_ai_service.train_model(data)

        return {
            "status": "training_initiated",
            "message": f"Training pipeline started for {request.entity_id}",
            "data_sample_count": len(data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ingest")
async def ingest_data(records: List[dict]):
    """
    Manual ingestion endpoint for testing.
    """
    try:
        success = bq_service.insert_financial_records(records)
        return {"status": "success", "count": len(records)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
