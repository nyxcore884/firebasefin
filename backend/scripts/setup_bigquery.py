import os
from google.cloud import bigquery
from google.api_core.exceptions import GoogleAPIError

# Initialize BigQuery Client
# Ensure GOOGLE_APPLICATION_CREDENTIALS is set in your environment
client = bigquery.Client()

DATASET_ID = "studio-9381016045-4d625.sgp_financial_intelligence"

def setup_bigquery():
    print(f"Setting up BigQuery dataset: {DATASET_ID}")
    
    # 1. Create Dataset if it doesn't exist
    try:
        # Construct a full dataset reference
        dataset_ref = bigquery.Dataset(DATASET_ID)
        dataset_ref.location = "US" # Or your preferred location
        client.create_dataset(dataset_ref, exists_ok=True)
        print(f"Dataset {DATASET_ID} ensured.")
    except Exception as e:
        print(f"Warning creating dataset: {e}")

    # 2. Setup Product Mapping Table
    create_product_mapping_sql = f"""
    CREATE TABLE IF NOT EXISTS `{DATASET_ID}.product_mapping` (
      mapping_id STRING OPTIONS(description="Unique identifier for the mapping rule"),
      keyword STRING OPTIONS(description="Keyword in Georgian, English, or Russian found in the source data"),
      english_article STRING OPTIONS(description="Standardized English name for the financial report"),
      segment STRING OPTIONS(description="Retail, Wholesale, or Other"),
      unit_type STRING OPTIONS(description="L, m3, kg, or Service"),
      account_code_prefix STRING OPTIONS(description="Primary GL account prefix (e.g., 1622, 6110)"),
      vat_rate NUMERIC OPTIONS(description="Expected VAT rate, default 0.18"),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
    );
    """
    
    # Populating Product Mapping
    # Note: Using MERGE or INSERT IGNORE logic is harder in simple scripts without keys, 
    # so we will use TRUNCATE + INSERT for this setup script to ensure "Ground Truth" state,
    # OR just INSERT. Given robust requirement, let's just run the INSERTs provided.
    # To avoid duplicates on re-run, we might want to DELETE first or just append. 
    # For this initialization script, we will assume it's run once or okay to append (or user handles cleanup).
    # Let's use the provided INSERT values.
    
    insert_product_mapping_sql = f"""
    INSERT INTO `{DATASET_ID}.product_mapping` 
    (mapping_id, keyword, english_article, segment, unit_type, account_code_prefix)
    VALUES
    ('PM_001', 'პრემიუმი', 'Premium Petrol', 'Retail', 'L', '1622'),
    ('PM_002', 'ევრო რეგულარი', 'Regular Petrol', 'Retail', 'L', '1622'),
    ('PM_003', 'სუპერი', 'Super Petrol', 'Retail', 'L', '1622'),
    ('PM_004', 'დიზელი', 'Diesel', 'Retail', 'L', '1622'),
    ('PM_005', 'ბუნებრივი აირი', 'CNG', 'Retail', 'm3', '1622'),
    ('PM_006', 'საბითუმო', 'Wholesale', 'Wholesale', 'Multiple', '1622'),
    ('PM_007', 'იმპორტი', 'Import', 'Wholesale', 'kg', '1622'),
    ('PM_008', 'ექსპორტი', 'Export', 'Wholesale', 'kg', '1622'),
    ('PM_009', 'იჯარა', 'Rent', 'Other', 'Service', '6110'),
    ('PM_010', 'ევრო დიზელი', 'Euro Diesel', 'Retail', 'L', '1622'),
    ('PM_011', 'თხევადი აირი', 'LPG', 'Retail', 'L', '1622'),
    ('PM_012', 'ბიტუმი', 'Bitumen', 'Wholesale', 'kg', '1622'),
    ('PM_013', 'BP გადაზიდვა', 'Shipping Cost', 'Other Revenue', 'Service', '6110'),
    ('PM_014', 'ელექტროენერგია', 'Utilities (Electricity)', 'Other Revenue', 'Service', '6110'),
    ('PM_015', 'წყალი', 'Utilities (Water)', 'Other Revenue', 'Service', '6110'),
    ('PM_016', 'დაცვის მომსახურება', 'Security Service', 'Other Revenue', 'Service', '6110'),
    ('PM_017', 'ავტოტექმომსახურება', 'Auto Maintenance', 'Other Revenue', 'Service', '6110'),
    ('PM_018', 'სარეექსპორტო', 'Re-export Fuel', 'Wholesale', 'kg', '1622');
    """

    # 3. Setup AI Training Examples Table
    create_training_sql = f"""
    CREATE TABLE IF NOT EXISTS `{DATASET_ID}.ai_training_examples` (
        example_id STRING,
        example_category STRING, 
        user_query STRING, 
        ai_response STRING, 
        requires_data ARRAY<STRING>, 
        processing_steps ARRAY<STRING>, 
        response_quality_score FLOAT64, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
    );
    """

    insert_training_sql = f"""
    INSERT INTO `{DATASET_ID}.ai_training_examples` 
    (example_id, example_category, user_query, ai_response, requires_data, processing_steps, response_quality_score, created_at)
    VALUES
    ('LOGIC_001', 'Reporting_Logic', 'How do I calculate Gross Margin for Retail Petrol?', 
     'To calculate Gross Margin for Retail Petrol: 1. Sum Net Revenue for products where LOWER(name) contains "პრემიუმი", "ევრო რეგულარი", or "სუპერი" and exclude "საბითუმო" or "იმპორტი". 2. Subtract matching COGS. Formula: GM = (Total Revenue / 1.18) - Total COGS.', 
     ['revenue_breakdown', 'cogs_breakdown'], ['filter_by_segment', 'sum_revenue', 'sum_cogs', 'apply_math'], 1.0, CURRENT_TIMESTAMP()),

    ('LOGIC_002', 'Mapping_Logic', 'Identify the segment for product "ბუნებრივი აირი (საბითუმო)"', 
     'Logic: If product name contains "(საბითუმო)" or "Wholesale", assign to Wholesale segment. Otherwise, if unit is "Litre" or "m3" and sold through gas stations, assign to Retail.', 
     ['product_mapping'], ['text_parsing', 'keyword_match'], 1.0, CURRENT_TIMESTAMP()),

    ('LOGIC_003', 'Expense_Logic', 'Categorize salaries by department from the ledger.', 
     'Salary expenses (Account 3130) must be grouped by the "Department ENG" column in the ledger. If "Department ENG" is empty, look up the "Account Dr" suffix (e.g., .01 for Admin, .02 for Commercial).', 
     ['base_ledger'], ['filter_account_3130', 'group_by_dept'], 1.0, CURRENT_TIMESTAMP()),

    ('LOGIC_004', 'Variance_Analysis', 'Why is the Wholesale margin negative?', 
     'Perform Price Variance analysis: 1. Calculate Average Purchase Price (Total COGS / Qty). 2. Calculate Average Selling Price (Net Revenue / Qty). 3. Compare. If Purchase Price > Selling Price, the variance is negative. Check FX Impact on Account 8220.', 
     ['cogs_breakdown', 'revenue_breakdown'], ['calc_avg_buy_price', 'calc_avg_sell_price', 'calc_variance'], 1.0, CURRENT_TIMESTAMP()),

    ('LOGIC_005', 'Gross_Margin_Logic', 'Generate Gross Margin for future uploaded file.', 
     'Deterministic Rule: Gross Margin = (SUM(Amount GEL) / 1.18) - SUM(COGS). Step 1: Map all Product names to standard articles using product_mapping table. Step 2: Aggregate by Segment. Step 3: Apply subtraction.', 
     ['uploaded_file', 'product_mapping'], ['map_products', 'aggregate_by_segment', 'apply_math'], 1.0, CURRENT_TIMESTAMP());
    """

    try:
        print("Creating product_mapping table...")
        client.query(create_product_mapping_sql).result()
        print("Populating product_mapping table...")
        client.query(insert_product_mapping_sql).result()
        
        print("Creating ai_training_examples table...")
        client.query(create_training_sql).result()
        print("Populating ai_training_examples table...")
        client.query(insert_training_sql).result()
        
        print("BigQuery setup complete.")
        
    except GoogleAPIError as e:
        print(f"BigQuery Error: {e}")
    except Exception as e:
        print(f"Unexpected Error: {e}")

if __name__ == "__main__":
    setup_bigquery()
