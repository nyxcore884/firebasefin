import os
import uuid
import logging
from firebase_functions import https_fn, options

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lazy Firestore
firestore_client = None

def get_db():
    global firestore_client
    if firestore_client is None:
        from google.cloud import firestore
        try:
            firestore_client = firestore.Client()
        except Exception as e:
            logger.error(f"Firestore init failed: {e}")
            # Only use mock in explicit development mode
            if os.getenv('ENVIRONMENT') == 'development':
                logger.warning("Using mock Firestore client")
                from unittest.mock import MagicMock
                firestore_client = MagicMock()
            else:
                raise RuntimeError("Firestore unavailable") from e
    return firestore_client

# --- Corrected ORM-style Adapter ---
class FirestoreSession:
    """Isolated session for batch operations."""
    
    def __init__(self, client):
        self.client = client
        self._pending_add = []
        self._pending_delete = []
    
    def add(self, obj):
        """Stage object for creation/update."""
        self._pending_add.append(obj)
    
    def delete(self, obj):
        """Stage object for deletion."""
        self._pending_delete.append(obj)
    
    def commit(self):
        """Commit all staged operations atomically."""
        try:
            batch = self.client.batch()
            
            # Process deletions
            for obj in self._pending_delete:
                if obj.id:
                    ref = self.client.collection('registry_datasets').document(str(obj.id))
                    batch.delete(ref)
            
            # Process additions/updates
            for obj in self._pending_add:
                if not obj.id:
                    obj.id = str(uuid.uuid4())  # ✅ UUID instead of timestamp
                
                ref = self.client.collection('registry_datasets').document(str(obj.id))
                try:
                    batch.set(ref, obj.to_dict())
                except Exception as e:
                     # Fallback if to_dict fails or isn't a method (though it should be)
                     logger.error(f"Failed to serialize object {obj}: {e}")
                     raise

            
            # Atomic commit
            batch.commit()
            
            # Clear only after success
            self._pending_add = []
            self._pending_delete = []
            
            logger.info(f"Committed batch: {len(self._pending_add)} adds, {len(self._pending_delete)} deletes")
            
        except Exception as e:
            logger.error(f"Commit failed: {e}")
            raise


class FirestoreDB:
    """Database connection manager."""
    
    def __init__(self, get_client_func):
        self.get_client = get_client_func
    
    @property
    def client(self):
        return self.get_client()
    
    def session(self):
        """Create a new isolated session."""
        return FirestoreSession(self.client)


# Initialize DB
db = FirestoreDB(get_db)


# --- Model ---
class Dataset:
    """Dataset model with validation."""
    
    def __init__(self, name, description=None, schema=None, tags=None, 
                 owner=None, lineage=None, quality_rules=None, id=None):
        self.id = id
        self.name = name
        self.description = description
        self.schema = schema
        self.tags = tags or []
        self.owner = owner
        self.lineage = lineage or []
        self.quality_rules = quality_rules or []
    
    def to_dict(self):
        """Convert to dictionary for Firestore."""
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
        """Fetch dataset by ID."""
        client = get_db()
        doc = client.collection('registry_datasets').document(str(dataset_id)).get()
        if doc.exists:
            data = doc.to_dict()
            data['id'] = doc.id  # ✅ Ensure ID is included
            return cls(**data)
        return None
    
    @classmethod
    def query_all(cls):
        """Fetch all datasets."""
        client = get_db()
        docs = client.collection('registry_datasets').stream()
        datasets = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id  # ✅ Include document ID
            datasets.append(data)
        return datasets


# --- API Routes ---
@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins="*",
        cors_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    ),
    timeout_sec=60,
    memory=options.MemoryOption.MB_256,
)
def registry_api(req: https_fn.Request) -> https_fn.Response:
    """Dataset Registry CRUD API."""
    
    import json
    
    def json_response(data, status=200):
        """Helper for JSON responses."""
        return https_fn.Response(
            json.dumps(data),
            status=status,
            headers={"Content-Type": "application/json"}
        )
    
    try:
        # POST - Create dataset
        if req.method == 'POST':
            data = req.get_json(silent=True) or {}
            
            # Validate required fields
            required_fields = ['name', 'schema']
            missing = [f for f in required_fields if f not in data]
            if missing:
                return json_response({
                    "error": "Missing required fields",
                    "missing": missing
                }, 400)
            
            # Create dataset
            dataset = Dataset(
                name=data['name'],
                description=data.get('description'),
                schema=data['schema'],
                tags=data.get('tags', []),
                owner=data.get('owner'),
                lineage=data.get('lineage', []),
                quality_rules=data.get('quality_rules', [])
            )
            
            # Save
            session = db.session()
            session.add(dataset)
            session.commit()
            
            logger.info(f"Created dataset: {dataset.id}")
            return json_response(dataset.to_dict(), 201)
        
        # GET - Read dataset(s)
        elif req.method == 'GET':
            dataset_id = req.args.get('id')
            
            if dataset_id:
                # Get single dataset
                dataset = Dataset.query_get(dataset_id)
                if dataset is None:
                    return json_response({"error": "Dataset not found"}, 404)
                return json_response(dataset.to_dict())
            else:
                # List all datasets
                datasets = Dataset.query_all()
                return json_response({
                    "datasets": datasets,
                    "count": len(datasets)
                })
        
        # PUT - Update dataset
        elif req.method == 'PUT':
            dataset_id = req.args.get('id')
            if not dataset_id:
                return json_response({"error": "Missing 'id' parameter"}, 400)
            
            # Fetch existing
            dataset = Dataset.query_get(dataset_id)
            if dataset is None:
                return json_response({"error": "Dataset not found"}, 404)
            
            # Update fields
            data = req.get_json(silent=True) or {}
            dataset.name = data.get('name', dataset.name)
            dataset.description = data.get('description', dataset.description)
            dataset.schema = data.get('schema', dataset.schema)
            dataset.tags = data.get('tags', dataset.tags)
            dataset.owner = data.get('owner', dataset.owner)
            dataset.lineage = data.get('lineage', dataset.lineage)
            dataset.quality_rules = data.get('quality_rules', dataset.quality_rules)
            
            # Save
            session = db.session()
            session.add(dataset)
            session.commit()
            
            logger.info(f"Updated dataset: {dataset_id}")
            return json_response(dataset.to_dict())
        
        # DELETE - Remove dataset
        elif req.method == 'DELETE':
            dataset_id = req.args.get('id')
            if not dataset_id:
                return json_response({"error": "Missing 'id' parameter"}, 400)
            
            # Fetch existing
            dataset = Dataset.query_get(dataset_id)
            if dataset is None:
                return json_response({"error": "Dataset not found"}, 404)
            
            # Delete
            session = db.session()
            session.delete(dataset)
            session.commit()
            
            logger.info(f"Deleted dataset: {dataset_id}")
            return json_response({"message": "Dataset deleted", "id": dataset_id})
        
        else:
            return json_response({"error": "Method not allowed"}, 405)
    
    except Exception as e:
        logger.error(f"API Error: {e}", exc_info=True)
        return json_response({"error": "Internal server error", "details": str(e)}, 500)
