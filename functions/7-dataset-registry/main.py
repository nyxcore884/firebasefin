import os
import time
import logging
import json
from firebase_functions import https_fn, options
from google.cloud import firestore

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dataset-registry")

# Lazy Firestore
_db = None
def get_db():
    global _db
    if _db is None:
        _db = firestore.Client()
    return _db

# --- Model ---
class Dataset:
    def __init__(self, name, description=None, schema=None, tags=None, 
                 owner=None, lineage=None, quality_rules=None, id=None,
                 locked=False, current_version="v1"):
        self.id = id
        self.name = name
        self.description = description
        self.schema = schema
        self.tags = tags or []
        self.owner = owner
        self.lineage = lineage or []
        self.quality_rules = quality_rules or []
        self.locked = locked
        self.current_version = current_version
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "schema": self.schema,
            "tags": self.tags,
            "owner": self.owner,
            "lineage": self.lineage,
            "quality_rules": self.quality_rules,
            "locked": self.locked,
            "current_version": self.current_version
        }

    @classmethod
    def query_get(cls, dataset_id):
        db = get_db()
        doc = db.collection('registry_datasets').document(str(dataset_id)).get()
        if doc.exists:
            data = doc.to_dict()
            return cls(**data)
        return None

# --- API HELPERS ---
def json_response(data, status=200):
    return https_fn.Response(json.dumps(data), status=status, headers={"Content-Type": "application/json"})

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]),
    timeout_sec=60,
    memory=options.MemoryOption.MB_256,
)
def registry_api(req: https_fn.Request) -> https_fn.Response:
    try:
        db = get_db()
        path = req.path
        method = req.method
        
        # 1. Dataset Operations (POST/GET/PUT/DELETE)
        dataset_id = req.args.get('id')
        action = req.args.get('action')

        if method == 'GET':
            if dataset_id:
                dataset = Dataset.query_get(dataset_id)
                if not dataset: return json_response({"error": "Not found"}, 404)
                return json_response(dataset.to_dict())
            else:
                docs = db.collection('registry_datasets').stream()
                return json_response([d.to_dict() for d in docs])

        elif method == 'POST':
            data = req.get_json(silent=True) or {}
            if action: # Logic for Actions like Lock/Bump
                if not dataset_id: return json_response({"error": "Missing ID"}, 400)
                dataset = Dataset.query_get(dataset_id)
                if not dataset: return json_response({"error": "Not found"}, 404)
                
                if action == 'lock': dataset.locked = True
                elif action == 'unlock': dataset.locked = False
                elif action == 'bump_version':
                    try:
                        v = int(dataset.current_version.replace('v', ''))
                        dataset.current_version = f"v{v+1}"
                    except: dataset.current_version += ".1"
                
                db.collection('registry_datasets').document(dataset_id).set(dataset.to_dict())
                return json_response({"status": "success", "action": action, "dataset": dataset.to_dict()})
            else:
                # Create new
                if 'name' not in data: return json_response({"error": "Missing name"}, 400)
                new_id = dataset_id or str(int(time.time()))
                dataset = Dataset(id=new_id, **data)
                db.collection('registry_datasets').document(new_id).set(dataset.to_dict())
                return json_response(dataset.to_dict(), 201)

        elif method == 'PUT':
            if not dataset_id: return json_response({"error": "Missing ID"}, 400)
            dataset = Dataset.query_get(dataset_id)
            if not dataset: return json_response({"error": "Not found"}, 404)
            data = req.get_json(silent=True) or {}
            # Update fields
            for k, v in data.items():
                if hasattr(dataset, k): setattr(dataset, k, v)
            db.collection('registry_datasets').document(dataset_id).set(dataset.to_dict())
            return json_response(dataset.to_dict())

        elif method == 'DELETE':
            if not dataset_id: return json_response({"error": "Missing ID"}, 400)
            db.collection('registry_datasets').document(dataset_id).delete()
            return json_response({"message": "Deleted", "id": dataset_id})

        return json_response({"error": "Method not allowed"}, 405)

    except Exception as e:
        logger.exception("Registry API Failure")
        return json_response({"error": str(e)}, 500)
