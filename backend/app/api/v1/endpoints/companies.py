from fastapi import APIRouter, Request, Depends
from google.cloud import firestore
from app.api.deps import get_db

router = APIRouter()

@router.get("")
async def list_companies(
    db: firestore.Client = Depends(get_db)
):
    """
    Returns the list of organizations supported by the platform.
    """
    companies_ref = db.collection("companies")
    docs = companies_ref.stream()
    
    results = []
    for doc in docs:
        results.append(doc.to_dict())
        
    return results
