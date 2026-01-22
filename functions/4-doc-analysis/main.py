import functions_framework
import fitz  # PyMuPDF
from google.cloud import firestore, storage
from vertexai.preview.language_models import TextEmbeddingModel

# Configuration
db = firestore.Client()
embedding_model = TextEmbeddingModel.from_pretrained("text-embedding-004")

@functions_framework.cloud_event
def process_document_upload(cloud_event):
    """
    Trigger: Upload to 'financial-docs' bucket.
    Action: Chunk PDF -> Embed -> Save to Knowledge Graph.
    """
    data = cloud_event.data
    bucket_name = data["bucket"]
    file_name = data["name"]

    # 1. Read PDF
    storage_client = storage.Client()
    blob = storage_client.bucket(bucket_name).blob(file_name)
    # Download to memory (use /tmp for large files)
    doc_bytes = blob.download_as_bytes()
    
    doc = fitz.open(stream=doc_bytes, filetype="pdf")
    full_text = "".join([page.get_text() for page in doc])

    # 2. Semantic Chunking (Split by paragraphs for better context)
    chunks = [p for p in full_text.split('\n\n') if len(p) > 50]

    batch = db.batch()
    
    print(f"[RAG] Vectorizing {len(chunks)} chunks from {file_name}...")

    # 3. Vectorize & Index
    for i, chunk in enumerate(chunks):
        # Get 768-dimensional vector
        vector = embedding_model.get_embeddings([chunk])[0].values
        
        doc_ref = db.collection("knowledge_base").document()
        batch.set(doc_ref, {
            "content": chunk,
            "embedding": vector, # <-- The AI Search Key
            "source_file": file_name,
            "created_at": firestore.SERVER_TIMESTAMP
        })
        
        # Commit batches of 500
        if i % 400 == 0:
            batch.commit()
            batch = db.batch()
            
    batch.commit()
    print("[RAG] Document indexed successfully.")
