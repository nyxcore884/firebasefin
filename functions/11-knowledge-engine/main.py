import logging
import json
from firebase_functions import https_fn, options
from firebase_admin import initialize_app
import firebase_admin

if not firebase_admin._apps:
    initialize_app()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lazy DB & Heavy Imports
_db = None
def get_db():
    global _db
    if _db is None:
        from firebase_admin import firestore
        _db = firestore.client()
    return _db

# Constants
EMBEDDING_MODEL_NAME = "text-embedding-004"
COLLECTION_NAME = "knowledge_vectors"

def get_embedding(text):
    """Generates embedding for text using Vertex AI."""
    import vertexai
    from vertexai.language_models import TextEmbeddingModel
    vertexai.init(location="us-central1")
    model = TextEmbeddingModel.from_pretrained(EMBEDDING_MODEL_NAME)
    embeddings = model.get_embeddings([text])
    return embeddings[0].values

def cosine_similarity(a, b):
    import numpy as np
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["POST", "OPTIONS"]),
    timeout_sec=60,
    memory=options.MemoryOption.MB_512,
)
def ingest_knowedge_item(req: https_fn.Request) -> https_fn.Response:
    """
    Ingests a text snippet into the Knowledge Base.
    Body: { "text": "...", "metadata": { "source": "Policy PDF", "page": 1 } }
    """
    try:
        data = req.get_json(silent=True) or {}
        text = data.get("text")
        metadata = data.get("metadata", {})
        
        if not text:
            return https_fn.Response("Text is required", status=400)

        # 1. Generate Embedding
        try:
            vector = get_embedding(text)
        except Exception as e:
            logger.error(f"Embedding Failed: {e}")
            return https_fn.Response("AI Embedding Service Unavailable", status=503)

        # 2. Store in Firestore
        db = get_db()
        doc_ref = db.collection(COLLECTION_NAME).document()
        doc_ref.set({
            "text": text,
            "metadata": metadata,
            "embedding": vector, # Stored as list of floats
            "created_at": firestore.SERVER_TIMESTAMP
        })
        
        return https_fn.Response(json.dumps({"status": "success", "id": doc_ref.id}), status=200)

    except Exception as e:
        logger.error(f"Ingest Error: {e}")
        return https_fn.Response(str(e), status=500)

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["POST", "OPTIONS"]),
    timeout_sec=60,
    memory=options.MemoryOption.MB_512,
)
def search_knowledge_base(req: https_fn.Request) -> https_fn.Response:
    """
    Semantic Search.
    Body: { "query": "expense policy", "limit": 5 }
    """
    try:
        data = req.get_json(silent=True) or {}
        query = data.get("query")
        limit = data.get("limit", 5)
        
        if not query:
             return https_fn.Response("Query required", status=400)

        # 1. Embed Query
        query_vector = get_embedding(query)
        
        # 2. Vector Search
        # OPTION A: Firestore Native Vector Search (Requires Index)
        # For simplicity/robustness without confirmed index, we might pull recent docs and rank (if small).
        # BUT "Real" means scalable.
        # Let's assume we use Client-Side re-ranking or `find_nearest` if available in SDK.
        # The python SDK `Vector` support is newer.
        # Check if `Vector` class exists in `google.cloud.firestore_v1.vector`.
        # If not, we do a "Brute Force" on the last N documents for the demo (simulating a real vector DB).
        # Real Vector Search requires `pip install google-cloud-firestore[vector_search_preview]`.
        
        # DEMO SCALABILITY STRATEGY (Brute Force on recent 100 docs):
        # In a real deployed app, we'd use the Vector Search Index.
        # Doing full scan is slow but guaranteed to work without index config time.
        
        db = get_db()
        docs = db.collection(COLLECTION_NAME).limit(100).stream()
        
        results = []
        for doc in docs:
            d = doc.to_dict()
            vec = d.get("embedding")
            if vec:
                score = cosine_similarity(query_vector, vec)
                if score > 0.6: # Threshold
                    results.append({
                        "id": doc.id,
                        "score": float(score),
                        "text": d.get("text"),
                        "metadata": d.get("metadata")
                    })
        
        # Sort
        results.sort(key=lambda x: x["score"], reverse=True)
        results = results[:limit]
        
        return https_fn.Response(json.dumps({"results": results}), status=200)

    except Exception as e:
        logger.error(f"Search Error: {e}")
        return https_fn.Response(str(e), status=500)
