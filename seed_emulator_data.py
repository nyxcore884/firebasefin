import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta
import random
import os

# Set emulator host
os.environ["FIRESTORE_EMULATOR_HOST"] = "127.0.0.1:8080"
print(f"Targeting Firestore Emulator at {os.environ['FIRESTORE_EMULATOR_HOST']}")

# Initialize w/o creds (emulator mode)
app = firebase_admin.initialize_app(options={
    'projectId': 'studio-9381016045-4d625',
})
db = firestore.client()

COMPANY_ID = "SGG-001"
COMPANY_NAME = "SOCAR Georgia Gas"
PERIOD = "2023-11"

# 1. Clear existing for this period
print("Cleaning old data...")
batch = db.batch()
for doc in db.collection('financial_transactions').where('company_id', '==', COMPANY_ID).where('period', '==', PERIOD).stream():
    batch.delete(doc.reference)
batch.commit()

# 2. Generate Data
transactions = []
base_date = datetime(2023, 11, 1)

# Revenue (GL 4xxx)
for i in range(20):
    transactions.append({
        "transaction_date": (base_date + timedelta(days=random.randint(0, 29))).strftime("%Y-%m-%d"),
        "company_id": COMPANY_ID,
        "company_name": COMPANY_NAME,
        "period": PERIOD,
        "gl_account": "4001",
        "description": f"Social Gas Sales Inv #{1000+i}",
        "amount": round(random.uniform(5000, 15000), 2),
        "currency": "GEL",
        "category": "Revenue",
        "type": "Credit"
    })

# Expenses (GL 5xxx)
for i in range(15):
    transactions.append({
        "transaction_date": (base_date + timedelta(days=random.randint(0, 29))).strftime("%Y-%m-%d"),
        "company_id": COMPANY_ID,
        "company_name": COMPANY_NAME,
        "period": PERIOD,
        "gl_account": "5003",
        "description": f"Gas Transport Fee #{500+i}",
        "amount": round(random.uniform(-4000, -8000), 2),
        "currency": "GEL",
        "category": "Expenses",
        "type": "Debit"
    })

# Assets (GL 1xxx) - Cash injection
transactions.append({
    "transaction_date": "2023-11-01",
    "company_id": COMPANY_ID,
    "company_name": COMPANY_NAME,
    "period": PERIOD,
    "gl_account": "1001",
    "description": "Opening Cash Balance",
    "amount": 250000.00,
    "currency": "GEL",
    "category": "Assets",
    "type": "Debit"
})

# Write to Firestore
print(f"Seeding {len(transactions)} transactions...")
batch = db.batch()
for tx in transactions:
    ref = db.collection('financial_transactions').document()
    batch.set(ref, tx)
batch.commit()

print("✅ Data Seeded Successfully!")
