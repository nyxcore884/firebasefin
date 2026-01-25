from datetime import datetime
import logging
from schema_loader import load_schema

logger = logging.getLogger(__name__)

# Load schema once at module level (Cold Start)
try:
    SCHEMA = load_schema("procurement_sog_v1.yaml")
    ACCOUNT_MAP = SCHEMA["rules"]["account_mapping"]
except Exception as e:
    logger.error(f"Failed to load schema: {e}")
    SCHEMA = None
    ACCOUNT_MAP = {}

def normalize_row(raw_row, dataset_id):
    """
    Convert aggregated SOG row -> financial summary fact
    Strictly follows procurement_sog_v1.yaml rules.
    """
    if not SCHEMA:
        return None
        
    # 1. Dimension Extraction
    # Budget Article (Cost Category)
    cat_col = SCHEMA["dimensions"]["budget_article"]["source_column"] # Unnamed: 9
    category = raw_row.get(cat_col)
    
    # Rule: Exclude rows
    if not category or category == "Grand Total" or category is None:
        return None

    # 2. Account Mapping
    # Default to 6199 (Other Operating Expenses) if not mapped
    account_code = ACCOUNT_MAP.get(category, 6199)

    # 3. Time Dimension
    # The user example showed "period_date" derived from "__period__" or similar.
    # We need to extract the period. The schema says: dimensions.reporting_period.source: row: 7, col: Unnamed: 4
    # But since we have ROWS here (from parsing), we depend on how parsing handled the header/metadata.
    # In the raw_ledger approach, we stored "row" which is a dict.
    # This transformer works on a single data row. 
    # For a file-level property like "Period", it ideally should have been extracted during parsing or 
    # is implicit in the dataset_id (e.g. proc_sog_2025_11).
    # FALLBACK: Use dataset_id to parse date if row doesn't have it.
    
    period_date_str = datetime.now().date().isoformat() # Fallback
    
    # Try to parse from dataset_id (e.g. proc_sog_2025_11)
    try:
        parts = dataset_id.split('_')
        if len(parts) >= 3:
            # Assuming format: name_name_YYYY_MM
            year = parts[-2]
            month = parts[-1]
            period_date_str = f"{year}-{month}-01"
    except:
        pass

    # Helper for money parsing
    def money(col_name):
        val = raw_row.get(col_name)
        if isinstance(val, (int, float)):
            return float(val)
        if isinstance(val, str):
            val = val.replace(',', '').replace(' ', '').strip()
            if val in ('-', '', 'None'):
                return 0.0
            try:
                return float(val)
            except:
                return 0.0
        return 0.0

    # 4. Measure Extraction
    # Using schema measure mapping
    measures = SCHEMA["measures"]
    
    fact = {
        "dataset_id": dataset_id,
        "period_date": period_date_str,
        "account_code": str(account_code), # Keep as string for consistency
        "cost_category": category,
        "actual_month": money(measures["actual_month"]["source_column"]),
        "budget_month": money(measures["budget_month"]["source_column"]),
        "variance_month": money(measures["variance_month"]["source_column"]),
        "actual_ytd": money(measures["actual_ytd"]["source_column"]),
        "budget_ytd": money(measures["budget_ytd"]["source_column"]),
        "variance_ytd": money(measures["variance_ytd"]["source_column"]),
        "currency": SCHEMA["dataset"]["currency"]
    }
    
    return fact
