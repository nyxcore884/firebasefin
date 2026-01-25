import duckdb
import firebase_admin
from firebase_admin import credentials, firestore
import os

# 1. Connect to your actual Database
# This assumes you have your service account or are logged in via CLI
try:
    if not firebase_admin._apps:
        firebase_admin.initialize_app()
    db = firestore.client()
    print("✅ Connected to Firestore")
except Exception as e:
    print(f"❌ Error connecting: {e}")
    exit()

def run_debug_query(dataset_id, sql_query):
    # 2. Initialize the transient DuckDB "Desk"
    con = duckdb.connect(':memory:')
    
    print(f"📥 Loading facts for {dataset_id} into DuckDB...")
    
    # 3. Pull from Firestore
    facts = db.collection("fact_financial_summary").where("dataset_id", "==", dataset_id).stream()
    
    # Create temp table
    con.execute("""
    CREATE TABLE IF NOT EXISTS facts (
        cost_category TEXT,
        actual_month DOUBLE,
        budget_month DOUBLE,
        period_date TEXT
    )
    """)
    
    # Load data
    count = 0
    for f in facts:
        d = f.to_dict()
        con.execute("INSERT INTO facts VALUES (?, ?, ?, ?)", [
            d.get('cost_category'),
            d.get('actual_month', 0),
            d.get('budget_month', 0),
            d.get('period_date')
        ])
        count += 1
    
    print(f"📊 Loaded {count} rows. Running your SQL...")
    
    # 4. RUN YOUR CALCULATION
    try:
        result = con.execute(sql_query).df()
        print("\n=== CALCULATION RESULT ===")
        print(result)
        print("==========================\n")
    except Exception as e:
        print(f"❌ SQL Error: {e}")

if __name__ == "__main__":
    # EXAMPLE: Tweak this Query to see different calculations
    TEST_DATASET = "procurement_sog_2025_11" 
    MY_SQL = "SELECT cost_category, SUM(actual_month) as total FROM facts GROUP BY 1"
    
    run_debug_query(TEST_DATASET, MY_SQL)
