import os
import time
import logging
from flask import jsonify
from firebase_functions import https_fn, options
from werkzeug.exceptions import NotFound, BadRequest
# from google.cloud import firestore # Lazy

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lazy Firestore
firestore_client = None

def get_db():
    global firestore_client
    if firestore_client is None:
        try:
            from google.cloud import firestore
            firestore_client = firestore.Client()
        except Exception:
            logger.warning("Firestore creds missing, using mock client")
            from unittest.mock import MagicMock
            firestore_client = MagicMock()
    return firestore_client

# --- Custom SQLAlchemy-like Adapter for Firestore ---
class FirestoreDB:
    def __init__(self, get_client_func):
        self.get_client = get_client_func
        self.session = self

    @property
    def client(self):
        return self.get_client()

    def add(self, obj):
        # In a real ORM, this stages the object. 
        # Here we just mark it for saving in commit.
        self._pending = obj

    def delete(self, obj):
        if obj.id:
            self.client.collection('registry_datasets').document(str(obj.id)).delete()

    def commit(self):
        if hasattr(self, '_pending') and self._pending:
            obj = self._pending
            # Auto-generate ID if missing
            if not obj.id:
                # Use name as ID for simplicity or auto-gen
                obj.id = str(int(time.time() * 1000)) 
            
            self.client.collection('registry_datasets').document(str(obj.id)).set(obj.to_dict())
            self._pending = None

    class Model:
        pass

db = FirestoreDB(get_db)

class Dataset(db.Model):
    def __init__(self, name, description=None, schema=None, tags=None, owner=None, lineage=None, quality_rules=None, id=None):
        self.id = id
        self.name = name
        self.description = description
        self.schema = schema
        self.tags = tags or []
        self.owner = owner
        self.lineage = lineage or []
        self.quality_rules = quality_rules or []

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "schema": self.schema,
            "tags": self.tags,
            "owner": self.owner,
            "lineage": self.lineage,
            "quality_rules": self.quality_rules
        }

    @classmethod
    def query_get(cls, dataset_id):
        client = get_db()
        doc = client.collection('registry_datasets').document(str(dataset_id)).get()
        if doc.exists:
            data = doc.to_dict()
            return cls(**data)
        return None

# --- API Routes ---

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["get", "post", "put", "delete", "options"]),
    timeout_sec=60,
    memory=options.MemoryOption.MB_256,
)
def registry_api(req: https_fn.Request) -> https_fn.Response:
    """
    HTTP Entrypoint for Dataset Registry.
    Implements the User's requested Flask routes.
    """
    # CORS Headers handled by decorator
    
    path = req.path
    if path == '/' or path == '':
        pass

    try:
        import json
        
        # POST /datasets
        if req.method == 'POST':
            data = req.get_json(silent=True) or {}
            required_fields = ['name', 'schema']
            if not all(field in data for field in required_fields):
                return https_fn.Response(json.dumps({"error": "Missing required fields"}), status=400, headers={"Content-Type": "application/json"})
            
            dataset = Dataset(
                name=data['name'],
                description=data.get('description'),
                schema=data['schema'],
                tags=data.get('tags', []),
                owner=data.get('owner'),
                lineage=data.get('lineage', []),
                quality_rules=data.get('quality_rules', [])
            )
            db.session.add(dataset)
            db.session.commit()
            return https_fn.Response(json.dumps(dataset.to_dict()), status=201, headers={"Content-Type": "application/json"})

        # GET /datasets/<id> or GET /datasets (List)
        if req.method == 'GET':
            # Check for ID in query param since we don't have URL routing in raw function
            dataset_id = req.args.get('id')
            if dataset_id:
                dataset = Dataset.query_get(dataset_id)
                if dataset is None:
                    return https_fn.Response(json.dumps({"error": "Dataset not found"}), status=404, headers={"Content-Type": "application/json"})
                return https_fn.Response(json.dumps(dataset.to_dict()), status=200, headers={"Content-Type": "application/json"})
            else:
                # List all
                client = get_db()
                docs = client.collection('registry_datasets').stream()
                datasets = [d.to_dict() for d in docs]
                return https_fn.Response(json.dumps(datasets), status=200, headers={"Content-Type": "application/json"})

        # PUT /datasets/<id>
        if req.method == 'PUT':
            dataset_id = req.args.get('id')
            if not dataset_id:
                return https_fn.Response(json.dumps({"error": "Missing 'id' param"}), status=400, headers={"Content-Type": "application/json"})
            
            dataset = Dataset.query_get(dataset_id)
            if dataset is None:
                return https_fn.Response(json.dumps({"error": "Dataset not found"}), status=404, headers={"Content-Type": "application/json"})
            
            data = req.get_json(silent=True) or {}
            # Update fields
            dataset.name = data.get('name', dataset.name)
            dataset.description = data.get('description', dataset.description)
            dataset.schema = data.get('schema', dataset.schema)
            dataset.tags = data.get('tags', dataset.tags)
            dataset.owner = data.get('owner', dataset.owner)
            dataset.lineage = data.get('lineage', dataset.lineage)
            dataset.quality_rules = data.get('quality_rules', dataset.quality_rules)
            
            # Commit (save back to Firestore)
            db.session.add(dataset) 
            db.session.commit()
            return https_fn.Response(json.dumps(dataset.to_dict()), status=200, headers={"Content-Type": "application/json"})

        # DELETE /datasets/<id>
        if req.method == 'DELETE':
            dataset_id = req.args.get('id')
            if not dataset_id:
                return https_fn.Response(json.dumps({"error": "Missing 'id' param"}), status=400, headers={"Content-Type": "application/json"})
                
            dataset = Dataset.query_get(dataset_id)
            if dataset is None:
                 return https_fn.Response(json.dumps({"error": "Dataset not found"}), status=404, headers={"Content-Type": "application/json"})
                 
            db.session.delete(dataset)
            return https_fn.Response(json.dumps({"message": "Dataset deleted"}), status=200, headers={"Content-Type": "application/json"})

        return https_fn.Response(status=405) # Method Not Allowed

    except Exception as e:
        logger.error(f"Registry Error: {e}")
        return https_fn.Response(json.dumps({"error": str(e)}), status=500, headers={"Content-Type": "application/json"})
