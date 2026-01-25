import logging
import json
from firebase_functions import https_fn, options
from firebase_admin import initialize_app
import firebase_admin

if not firebase_admin._apps:
    initialize_app()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lazy DB & Imports
_db = None
def get_db():
    global _db
    if _db is None:
        from firebase_admin import firestore
        _db = firestore.client()
    return _db

def calculate_z_score(data_points, current_value):
    """Calculates Z-Score of current_value against data_points history."""
    import numpy as np
    if not data_points or len(data_points) < 2:
        return 0.0
    
    mean = np.mean(data_points)
    std = np.std(data_points)
    
    if std == 0:
        return 0.0
        
    return (current_value - mean) / std

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["POST", "OPTIONS"]),
    timeout_sec=60,
    memory=options.MemoryOption.MB_512,
)
def detect_financial_anomalies(req: https_fn.Request) -> https_fn.Response:
    """
    Scans for anomalies in the latest period.
    Body: { "entity": "SGG-001", "period": "2024-01" }
    """
    from firebase_admin import firestore
    try:
        data = req.get_json(silent=True) or {}
        entity = data.get("entity", "SGG-001")
        target_period = data.get("period") # Optional, defaults to finding latest
        
        # 1. Fetch History (last 6 months)
        # We query the "financial_truth_warehouse" if available, or raw facts.
        # Fallback to 'fact_financial_summary' aggregation if warehouse empty.
        # Ideally, we read from 'financial_truth_warehouse' for speed.
        
        db = get_db()
        truth_docs = (
            db.collection("financial_truth_warehouse")
            .where(filter=firestore.FieldFilter("entity", "==", entity))
            .order_by("period", direction=firestore.Query.DESCENDING)
            .limit(12)
            .stream()
        )
        
        history = []
        target_doc = None
        
        for doc in truth_docs:
            d = doc.to_dict()
            if target_period and d['period'] == target_period:
                target_doc = d
            elif not target_period and not target_doc:
                target_doc = d # Take latest as target if not specified
            else:
                history.append(d)
                
        if not target_doc:
            return https_fn.Response(json.dumps({"status": "no_data"}), status=200)

        # 2. Analyze Metrics
        anomalies = []
        metrics = target_doc.get("metrics", {})
        
        # For each key metric, compare against history
        keys_to_check = ["REVENUE", "OPEX", "EBITDA", "NET_INCOME"]
        
        for key in keys_to_check:
            curr_val = metrics.get(key, 0)
            hist_vals = [h.get("metrics", {}).get(key, 0) for h in history]
            
            # Simple Z-Score
            z = calculate_z_score(hist_vals, curr_val)
            
            if abs(z) > 1.5: # Threshold (Lowered for demo visibility)
                severity = "High" if abs(z) > 3 else "Medium"
                direction = "Spike" if z > 0 else "Drop"
                
                # Check bounds
                mean_val = np.mean(hist_vals) if hist_vals else 0
                
                anomalies.append({
                    "id": f"{key}-{target_doc['period']}",
                    "type": "Statistical Outlier (Z-Score)",
                    "description": f"{key} {direction} detected. Value {curr_val:,.0f} vs Avg {mean_val:,.0f} (Z: {z:.1f})",
                    "severity": severity,
                    "metric": key,
                    "score": z
                })
        
        # 3. Protocol: Check for missing data (Zero values where history exists)
        for key in keys_to_check:
            if metrics.get(key, 0) == 0 and any(h.get("metrics", {}).get(key, 0) > 0 for h in history):
                 anomalies.append({
                    "id": f"MISSING-{key}",
                    "type": "Data Integrity",
                    "description": f"Missing data for {key} in active period.",
                    "severity": "Critical",
                    "metric": key
                })

        return https_fn.Response(json.dumps(anomalies), status=200)

    except Exception as e:
        logger.error(f"Anomaly Engine Error: {e}")
        return https_fn.Response(str(e), status=500)
