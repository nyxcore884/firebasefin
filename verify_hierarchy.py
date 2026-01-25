
import firebase_admin
from firebase_admin import credentials, firestore, initialize_app
import os

if not firebase_admin._apps:
    initialize_app()

db = firestore.client()

print("Checking 'companies' collection...")
docs = list(db.collection('companies').stream())

if not docs:
    print("[EMPTY] No company documents found.")
else:
    print(f"[FOUND] {len(docs)} documents.")
    for doc in docs:
        print(f"ID: {doc.id}")
        data = doc.to_dict()
        print(f"Name: {data.get('name')}")
        subs = data.get('subsidiaries', [])
        print(f"Subsidiaries: {len(subs)}")
        if subs:
            print(f"  First Sub: {subs[0].get('name')}")
