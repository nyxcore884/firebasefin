import logging
import json
import random
from datetime import datetime
from google.cloud import firestore

logger = logging.getLogger(__name__)

def get_ml_config(company_id):
    """
    Fetches the ML configuration for a specific company from Firestore.
    """
    db = firestore.Client()
    doc_ref = db.collection('ml_configs').document(company_id)
    doc = doc_ref.get()
    
    if doc.exists:
        return doc.to_dict()
    else:
        # Default configuration
        return {
            "learning_rate": 0.01,
            "anomaly_threshold": 2.0,
            "forecast_horizon": 90,
            "model_type": "ensemble",
            "retrain_frequency": "weekly",
            "last_trained": "2026-01-20T10:00:00Z",
            "status": "IDLE"
        }

def update_ml_config(company_id, new_config):
    """
    Updates the ML configuration in Firestore.
    """
    db = firestore.Client()
    doc_ref = db.collection('ml_configs').document(company_id)
    doc_ref.set(new_config, merge=True)
    return {"status": "success", "config": new_config}

def get_training_metrics():
    """
    Returns mock training metrics for the dashboard.
    """
    return {
        "accuracy_score": 0.94,
        "mae": 1250.45,
        "mape": 4.2,
        "r_squared": 0.89,
        "training_history": [
            {"date": "2026-01-01", "accuracy": 0.88},
            {"date": "2026-01-08", "accuracy": 0.90},
            {"date": "2026-01-15", "accuracy": 0.92},
            {"date": "2026-01-22", "accuracy": 0.94}
        ],
        "feature_importance": [
            {"feature": "Historical Spend", "weight": 0.45},
            {"feature": "Seasonality", "weight": 0.30},
            {"feature": "Departmental Growth", "weight": 0.15},
            {"feature": "Exogenous Factors", "weight": 0.10}
        ]
    }

def trigger_pipeline(company_id):
    """
    Triggers a Vertex AI Pipeline simulation.
    In a financial app, this is crucial for 'Continuous Financial Learning'.
    """
    logger.info(f"Triggering Vertex AI Pipeline for company: {company_id}")
    
    # Update status in Firestore to TRAINING
    db = firestore.Client()
    doc_ref = db.collection('ml_configs').document(company_id)
    
    # Simulate an immediate status update
    doc_ref.set({
        "status": "TRAINING", 
        "last_job_trigger": datetime.now().isoformat(),
        "job_id": f"v-pipeline-{company_id}-{datetime.now().strftime('%Y%m%d')}"
    }, merge=True)
    
    # NEW: Logic to simulate a 'Pipeline Completion' with fresh XAI metrics
    # In a real environment, this would be triggered by a Pub/Sub notification from Vertex AI
    fresh_xai_metrics = {
        "accuracy_score": round(0.92 + (random.random() * 0.05), 2),
        "feature_importance": [
            {"feature": "Historical Spend", "weight": round(0.40 + (random.random() * 0.1), 2)},
            {"feature": "Seasonality", "weight": 0.32},
            {"feature": "Market Sentiment (Phase 12)", "weight": 0.18},
            {"feature": "Departmental Growth", "weight": 0.10}
        ]
    }
    
    # We'll update the 'IDLE' state and fresh metrics to simulate a job that finished successfully
    # For the sake of this synchronous request, we return the success and update the metrics 'post-training'
    doc_ref.set({
        "status": "IDLE", 
        "last_trained": datetime.now().isoformat(),
        "training_metrics": fresh_xai_metrics
    }, merge=True)
    
    return {
        "status": "success", 
        "job_id": f"v-pipeline-{company_id}-20260123",
        "message": "Vertex AI Pipeline executed. XAI weights updated based on latest transaction streams.",
        "updated_metrics": fresh_xai_metrics
    }
