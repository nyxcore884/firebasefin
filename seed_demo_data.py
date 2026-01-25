from firebase_admin import firestore
import firebase_admin
import datetime

if not firebase_admin._apps:
    firebase_admin.initialize_app()

db = firestore.client()

def seed_financial_facts():
    period = "2023-11"
    dataset_id = "DEMO_DATASET_V3"
    
    # 1. Register Dataset
    db.collection("dataset_registry").document(dataset_id).set({
        "name": "Multi-Dept Financial Data",
        "period": period,
        "tags": [f"period:{period}", "entity:SGG-001"],
        "locked": True, 
        "current_version": "v1",
        "created_at": firestore.SERVER_TIMESTAMP
    })
    
    # 2. Add Fact Records for Different Departments
    facts = [
        # Technical
        {"cost_category": "Cloud Hosting", "account_code": "6500", "actual_month": 8000, "budget_month": 7000, "department": "Technical"},
        {"cost_category": "Software Licenses", "account_code": "6500", "actual_month": 2000, "budget_month": 2000, "department": "Technical"},
        # HR
        {"cost_category": "Recruitment", "account_code": "6100", "actual_month": 3000, "budget_month": 5000, "department": "Human Resources"},
        {"cost_category": "Training", "account_code": "6100", "actual_month": 1500, "budget_month": 1000, "department": "Human Resources"},
        # Sales
        {"cost_category": "Sales Revenue", "account_code": "4100", "actual_month": 50000, "budget_month": 45000, "department": "Sales & Marketing"},
        {"cost_category": "Travel", "account_code": "6200", "actual_month": 4000, "budget_month": 3000, "department": "Sales & Marketing"},
        # Finance
        {"cost_category": "Audit Fees", "account_code": "6400", "actual_month": 10000, "budget_month": 10000, "department": "Finance"},
    ]
    
    batch = db.batch()
    for i, f in enumerate(facts):
        f.update({
            "dataset_id": dataset_id,
            "dataset_version": "v1",
            "period_date": period,
            "entity": "SGG-001",
            "currency": "GEL",
            "is_adjustment": False
        })
        doc_ref = db.collection("fact_financial_summary").document(f"FACT_V3_{i}")
        batch.set(doc_ref, f)
    
    batch.commit()
    print("Database successfully seeded with Multi-Dept facts for 2023-11")

if __name__ == "__main__":
    seed_financial_facts()
