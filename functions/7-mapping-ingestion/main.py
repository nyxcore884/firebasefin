from firebase_functions import https_fn, options
import logging
import json
import os
from uuid import uuid4
from typing import List, Dict, Any

# Google clients
from google.cloud import firestore, pubsub_v1

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mapping-ingestion")

PROJECT_ID = os.environ.get("GCP_PROJECT") or os.environ.get("PROJECT_ID") or "studio-9381016045-4d625"
MAPPING_CHANGED_TOPIC = os.environ.get("MAPPING_CHANGED_TOPIC", "mapping-set-changed")

def get_db():
    return firestore.Client()

def get_publisher():
    return pubsub_v1.PublisherClient()

def validate_rule_row(row: Dict[str, Any]) -> bool:
    # Minimal validations for a single rule row
    required = ["raw_value", "raw_field", "target_field", "target_value"]
    for k in required:
        if not row.get(k):
            return False
    # priority should be int
    try:
        row["priority"] = int(row.get("priority", 0))
    except Exception:
        row["priority"] = 0
    return True

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["POST", "OPTIONS"]),
    timeout_sec=120,
    memory=options.MemoryOption.MB_256,
)
def mapping_upload(req: https_fn.Request) -> https_fn.Response:
    """
    Ingests mapping sets from business users.
    Enables pattern-based overrides of canonical financial schemas.
    """
    try:
        body = req.get_json(silent=True) or {}
        name = body.get("name") or f"mapping_{uuid4().hex[:8]}"
        source_profile = body.get("source_profile", "default")
        description = body.get("description", "")
        rules = body.get("rules", [])
        activate = bool(body.get("activate", False))
        uploaded_by = body.get("uploaded_by", "ui")

        if not rules or not isinstance(rules, list):
            return https_fn.Response(json.dumps({"error": "No rules provided"}), status=400, headers={"Content-Type": "application/json"})

        db = get_db()

        # Create mapping_set metadata
        mapping_set_id = f"mappingset_{uuid4().hex[:12]}"
        mapping_set_doc = {
            "mapping_set_id": mapping_set_id,
            "name": name,
            "source_profile": source_profile,
            "description": description,
            "uploaded_by": uploaded_by,
            "uploaded_at": firestore.SERVER_TIMESTAMP,
            "row_count": len(rules),
            "status": "pending",
            "active": False
        }

        db.collection("mapping_sets").document(mapping_set_id).set(mapping_set_doc)

        # Bulk insert mapping_rules (batched)
        batch = db.batch()
        batch_count = 0
        created = 0
        for i, r in enumerate(rules):
            # Normalize fields
            rule = {
                "mapping_set_id": mapping_set_id,
                "raw_field": r.get("raw_field", "budget_article"),
                "raw_value": r.get("raw_value"),
                "match_type": r.get("match_type", "equals"),
                "structural_unit": r.get("structural_unit") or "",
                "counterparty": r.get("counterparty") or "",
                "region": r.get("region") or "",
                "target_field": r.get("target_field"),
                "target_value": r.get("target_value"),
                "priority": int(r.get("priority", 0)),
                "active": True,
                "created_at": firestore.SERVER_TIMESTAMP,
                "created_by": uploaded_by
            }
            if not validate_rule_row(rule):
                logger.warning("Skipping invalid rule row: %s", r)
                continue
            doc_ref = db.collection("mapping_rules").document()
            batch.set(doc_ref, rule)
            batch_count += 1
            created += 1
            if batch_count >= 400:
                batch.commit()
                batch = db.batch()
                batch_count = 0

        if batch_count > 0:
            batch.commit()

        # Optionally activate this mapping_set
        if activate:
            sets_q = db.collection("mapping_sets").where("source_profile", "==", source_profile).where("active", "==", True).stream()
            to_deactivate = [s.id for s in sets_q]
            for sid in to_deactivate:
                db.collection("mapping_sets").document(sid).update({"active": False, "status": "archived"})
            db.collection("mapping_sets").document(mapping_set_id).update({"active": True, "status": "active"})
        else:
            db.collection("mapping_sets").document(mapping_set_id).update({"status": "created"})

        # Notify pipeline of configuration change
        publisher = get_publisher()
        topic_path = publisher.topic_path(PROJECT_ID, MAPPING_CHANGED_TOPIC)
        publisher.publish(topic_path, json.dumps({
            "mapping_set_id": mapping_set_id,
            "source_profile": source_profile,
            "action": "activated" if activate else "created"
        }).encode("utf-8"))

        return https_fn.Response(json.dumps({"status": "ok", "mapping_set_id": mapping_set_id, "created_rules": created}), status=201, headers={"Content-Type": "application/json"})

    except Exception as e:
        logger.exception("Mapping upload error: %s", e)
        return https_fn.Response(json.dumps({"error": str(e)}), status=500, headers={"Content-Type": "application/json"})
