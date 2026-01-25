import duckdb
from firebase_admin import firestore
import logging

logger = logging.getLogger(__name__)

# Lazy DB
_db = None
def get_db():
    global _db
    if _db is None:
        _db = firestore.client()
    return _db
# In Cloud Functions, /tmp is the only writable path
DUCK_PATH = "/tmp/finsight.duckdb"

def build_summary_warehouse(dataset_id: str):
    """
    Loads fact_financial_summary from Firestore into an in-memory (or tmp) DuckDB.
    """
    logger.info(f"Building Warehouse for {dataset_id}...")
    
    con = duckdb.connect(DUCK_PATH)

    # 1. Create Table
    con.execute("""
    CREATE TABLE IF NOT EXISTS fact_financial_summary (
        dataset_id TEXT,
        period_date DATE,
        account_code TEXT,  -- Changed to TEXT to match string storage
        cost_category TEXT,
        actual_month DOUBLE,
        budget_month DOUBLE,
        variance_month DOUBLE,
        actual_ytd DOUBLE,
        budget_ytd DOUBLE,
        variance_ytd DOUBLE,
        currency TEXT
    )
    """)

    # 2. Fetch Data
    db = get_db()
    rows = (
        db.collection("fact_financial_summary")
        .where("dataset_id", "==", dataset_id)
        .stream()
    )

    # 3. Insert Data
    # Optimization: Loading in bulk is better, but stream + parsing is needed
    count = 0
    for r in rows:
        d = r.to_dict()
        con.execute("""
            INSERT INTO fact_financial_summary VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            d.get('dataset_id'),
            d.get('period_date'),
            d.get('account_code'),
            d.get('cost_category'),
            d.get('actual_month', 0.0),
            d.get('budget_month', 0.0),
            d.get('variance_month', 0.0),
            d.get('actual_ytd', 0.0),
            d.get('budget_ytd', 0.0),
            d.get('variance_ytd', 0.0),
            d.get('currency')
        ])
        count += 1

    logger.info(f"Warehouse built. Loaded {count} rows.")
    return con
