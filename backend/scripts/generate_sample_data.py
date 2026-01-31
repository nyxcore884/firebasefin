import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta

# Configuration
OUTPUT_DIR = "backend/sgp_data_library"
os.makedirs(OUTPUT_DIR, exist_ok=True)

PRODUCTS_SGP = ["Euro Regular", "Diesel", "Premium", "Super", "LPG"]
PRODUCTS_SGG = ["Natural Gas (Household)", "Natural Gas (Commercial)"]

def generate_data(filename, org_id="SGP-001", start_date="2025-01-01", num_records=500):
    records = []
    base_date = pd.to_datetime(start_date)
    
    products = PRODUCTS_SGP if org_id == "SGP-001" else PRODUCTS_SGG
    
    print(f"Generating {filename} for {org_id}...")
    
    for _ in range(num_records):
        # Random date within the month
        day_offset = np.random.randint(0, 30)
        date = base_date + timedelta(days=day_offset)
        
        product = np.random.choice(products)
        
        # Volume logic
        volume = np.random.randint(20, 1000)
        
        # Price logic (approximate)
        price_map = {"Diesel": 2.80, "Euro Regular": 2.65, "Premium": 3.10, "Super": 3.40, "LPG": 1.90,
                     "Natural Gas (Household)": 0.57, "Natural Gas (Commercial)": 1.10}
        
        price = price_map.get(product, 2.50)
        amount = round(volume * price, 2)
        
        records.append({
            "Date": date.strftime("%Y-%m-%d"),
            "Entity": "Station-" + str(np.random.randint(101, 120)) if org_id == "SGP-001" else "Region-" + str(np.random.randint(1, 10)),
            "Product": product,
            "Volume_Liters": volume,
            "Amount_GEL": amount,
            "Description": "Sales record"
        })
        
    df = pd.DataFrame(records)
    
    # Save as Excel
    filepath = os.path.join(OUTPUT_DIR, filename)
    df.to_excel(filepath, index=False)
    print(f"Saved: {filepath}")

if __name__ == "__main__":
    # 1. SGP Sales Jan 2025
    generate_data("SGP_Sales_Jan2025.xlsx", org_id="SGP-001", start_date="2025-01-01")
    
    # 2. SGP Sales Feb 2025
    generate_data("SGP_Sales_Feb2025.xlsx", org_id="SGP-001", start_date="2025-02-01")
    
    # 3. SGG Gas Sales Jan 2025
    generate_data("SGG_Gas_Jan2025.xlsx", org_id="SGG-001", start_date="2025-01-01")
    
    print("\nData Generation Complete.")
