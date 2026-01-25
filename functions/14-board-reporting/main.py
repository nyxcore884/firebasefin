from firebase_admin import firestore
import firebase_admin
from firebase_functions import https_fn
from datetime import datetime
import json

# Initialize Firebase Admin
if not firebase_admin._apps:
    firebase_admin.initialize_app()

db = firestore.client()

@https_fn.on_request(timeout_sec=540)
def generate_report(req: https_fn.Request) -> https_fn.Response:
    dataset_id = req.args.get("dataset_id")
    scenario_id = req.args.get("scenario_id")

    if not dataset_id:
         return https_fn.Response("dataset_id required", status=400)

    metrics = (
        db.collection("semantic_metrics")
        .where(filter=firestore.FieldFilter("dataset_id", "==", dataset_id))
        .where(filter=firestore.FieldFilter("scenario_id", "==", scenario_id))
        .stream()
    )

    report = {
        "dataset_id": dataset_id,
        "scenario_id": scenario_id,
        "generated_at": datetime.utcnow().isoformat(),
        "metrics": {}
    }

    for m in metrics:
        r = m.to_dict()
        report["metrics"][r.get("metric")] = r.get("value")

    return https_fn.Response(
        json.dumps(report, indent=2),
        mimetype="application/json"
    )
