
import logging

# Mock Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import datetime

def unpivot_cross_tab_data(rows):
    """
    Detects if data is in Cross-Tab format (Months as columns) and unpivots it.
    Returns flattened list of dicts with 'date' and 'amount' columns.
    """
    if not rows: return rows
    
    # 1. Detect Month Columns
    first_keys = [k.lower().strip() for k in rows[0].keys()]
    print(f"Keys detected: {first_keys}")
    
    month_map = {
        'january': 1, 'jan': 1, 'february': 2, 'feb': 2, 'march': 3, 'mar': 3,
        'april': 4, 'apr': 4, 'may': 5, 'june': 6, 'jun': 6,
        'july': 7, 'jul': 7, 'august': 8, 'aug': 8, 'september': 9, 'sep': 9, 'sept': 9,
        'october': 10, 'oct': 10, 'november': 11, 'nov': 11, 'december': 12, 'dec': 12
    }
    
    found_months = []
    for k in first_keys:
        if k in month_map:
            found_months.append(k)
    
    print(f"Found months: {found_months}")
            
    if len(found_months) < 3:
        # Likely not a monthly cross-tab
        print("Not enough months found.")
        return rows
        
    logger.info(f"Detected Cross-Tab Data. Unpivoting months: {found_months}")
    
    new_rows = []
    
    for row in rows:
        # Base metadata (remove month columns)
        base_data = {k: v for k, v in row.items() if k.lower().strip() not in month_map}
        
        for col_name in row:
            key_clean = col_name.lower().strip()
            if key_clean in month_map:
                val = row[col_name]
                # Check for non-zero value
                try:
                    # Clean string "1,200" -> 1200
                    if isinstance(val, str):
                        val = val.replace(',', '').replace(' ', '')
                        if val in ['-', '']: val = 0
                    
                    amount = float(val)
                except (ValueError, TypeError):
                    amount = 0.0
                    
                if amount != 0:
                    new_record = base_data.copy()
                    month_num = month_map[key_clean]
                    # Construct date: YYYY-MM-01
                    year = 2023 
                    
                    new_record['date'] = f"{year}-{month_num:02d}-01"
                    new_record['amount'] = amount
                    new_rows.append(new_record)
                    
    logger.info(f"Unpivoted {len(rows)} rows into {len(new_rows)} transactions.")
    return new_rows

# TEST DATA
# Simulating the header and row from user request
row_1 = {
    "A/P": "Current period actual",
    "Company": "SOG",
    "Region": "SOG",
    "Sc": "Head office",
    "Budget Article": "Household Materials",
    "Responsible": "Yashar Ibragimov",
    "Description": "Household Materials",
    "Counterparty": "pensan",
    "Currency": "GEL",
    "Intercompany": "No",
    "January": "1,210",
    "February": "-",
    "March": "-",
    "April": "-",
    "May": "-",
    "June": "1,271",
    "July": "213",
    "August": "-",
    "September": "3,064",
    "October": "",
    "November": "5,757",
    "December": ""
}

print("Running Test...")
result = unpivot_cross_tab_data([row_1])
print(f"Result count: {len(result)}")
for r in result:
    print(r)
