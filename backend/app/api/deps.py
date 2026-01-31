from google.cloud import firestore
from app.core.config import settings

def get_db():
    """
    Returns a Firestore client instance.
    """
    db = firestore.Client(project=settings.PROJECT_ID)
    try:
        yield db
    finally:
        # Firestore client handles its own connection pooling
        pass
