from firebase_admin import firestore

def load_forecasts(db, entity, period):
    """
    Loads latest forecast for the period.
    """
    # For MVP, return base structure.
    return {
        "BASE": {},
        "DOWNSIDE": {}
    }
