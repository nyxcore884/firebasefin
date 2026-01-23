from firebase_functions import storage_fn
from firebase_admin import initialize_app, firestore
import google.cloud.firestore as firestore_lib

# Initialize Firebase Admin
initialize_app()

def get_db():
    return firestore.client()

def get_embedding_model():
    # STUB
    return None

@storage_fn.on_object_finalized()
def process_document_upload(event: storage_fn.CloudEvent[storage_fn.StorageObjectData]) -> None:
    """
    Trigger: Upload to 'financial-docs' bucket.
    Action: Chunk PDF -> Embed -> Save to Knowledge Graph.
    """
    data = event.data
    bucket_name = data.bucket
    file_name = data.name

    # 1. Read PDF (STUBBED)
    full_text = f"Stubbed PDF content for {file_name}\n\nSample content."
    
    # 2. Semantic Chunking
    chunks = [p for p in full_text.split('\n\n') if len(p) > 5]

    db = get_db()
    batch = db.batch()
    
    print(f"[RAG] Vectorizing {len(chunks)} chunks from {file_name}...")

    # 3. Vectorize & Index (STUBBED)
    for i, chunk in enumerate(chunks):
        # STUB: Dummy 768-dim vector
        vector = [0.0] * 768 # Placeholder
        
        doc_ref = db.collection("knowledge_base").document()
        batch.set(doc_ref, {
            "content": chunk,
            "embedding": vector, 
            "source_file": file_name,
            "created_at": firestore_lib.SERVER_TIMESTAMP
        })
        
        # Commit batches
        if (i + 1) % 400 == 0:
            batch.commit()
            batch = db.batch()
            
    batch.commit()
    print("[RAG] Document indexed successfully.")
