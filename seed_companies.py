from google.cloud import firestore

print("--- Seeding Corporate Registry (Firestore) ---")
db = firestore.Client()

companies = [
    {
        "id": "SGG-001",
        "name": "SOCAR Georgia (SGG-001)",
        "currency": "GEL",
        "industry": "Gas Distribution",
        "parent_id": "SOCAR-GROUP"
    },
    {
        "id": "SGG-002",
        "name": "SOCAR Gas Export (SGG-002)",
        "currency": "USD",
        "industry": "Export/Logistics",
        "parent_id": "SOCAR-GROUP"
    },
    {
        "id": "SGG-003",
        "name": "TelavGas (SGG-003)",
        "currency": "GEL",
        "industry": "Regional Gas",
        "parent_id": "SGG-001"
    }
]

for company in companies:
    db.collection('companies').document(company['id']).set(company)
    print(f"  ✓ Seeded {company['name']}")

print("Seeding complete.")
