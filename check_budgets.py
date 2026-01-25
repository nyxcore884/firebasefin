from google.cloud import firestore
import json

def check_budgets():
    try:
        db = firestore.Client()
        docs = db.collection('budgets').stream()
        budgets = [doc.to_dict() for doc in docs]
        print(f"Found {len(budgets)} budgets.")
        if budgets:
            print(json.dumps(budgets[0], indent=2))
        else:
            print("No budgets found.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_budgets()
