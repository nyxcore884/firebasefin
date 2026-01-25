from firebase_admin import firestore

def load_locked_datasets(db, entity, period):
    """
    Finds LOCKED datasets relevant to the entity and period.
    """
    tag_period = f"period:{period}"
    
    docs = (
        db.collection("dataset_registry")
        .where("tags", "array_contains", tag_period)
        .where("locked", "==", True)
        .stream()
    )
    
    datasets = []
    for d in docs:
        data = d.to_dict()
        data['id'] = d.id
        datasets.append(data)
        
    return datasets
