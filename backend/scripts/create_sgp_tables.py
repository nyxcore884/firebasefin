"""
Create Missing BigQuery Tables for SGP Intelligence

Creates the essential tables manually
"""

import sys
import os
from google.cloud import bigquery

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings

client = bigquery.Client(project=settings.PROJECT_ID)
dataset_ref = f"{settings.PROJECT_ID}.sgp_financial_intelligence"

# Create ai_training_examples table
create_training_table = f"""
CREATE TABLE IF NOT EXISTS `{dataset_ref}.ai_training_examples` (
    example_id STRING NOT NULL,
    example_category STRING,
    user_query STRING NOT NULL,
    ai_response STRING NOT NULL,
    requires_data ARRAY<STRING>,
    processing_steps ARRAY<STRING>,
    response_quality_score NUMERIC,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
"""

# Create revenue_data table
create_revenue_table = f"""
CREATE TABLE IF NOT EXISTS `{dataset_ref}.revenue_data` (
    revenue_record_id STRING NOT NULL,
    company_id STRING,
    period STRING,
    product_name_georgian STRING,
    product_category STRING,
    product_type STRING,
    unit_of_measure STRING,
    net_revenue NUMERIC,
    revenue_line_item STRING,
    is_wholesale BOOL,
    is_retail BOOL,
    source_file STRING,
    source_sheet STRING,
    source_row INT64,
    processing_timestamp TIMESTAMP
)
"""

# Create cogs_data table  
create_cogs_table = f"""
CREATE TABLE IF NOT EXISTS `{dataset_ref}.cogs_data` (
    cogs_record_id STRING NOT NULL,
    company_id STRING,
    period STRING,
    product_name_georgian STRING,
    product_category STRING,
    cogs_6 NUMERIC,
    cogs_7310 NUMERIC,
    cogs_8230 NUMERIC,
    total_cogs NUMERIC,
    calculation_formula STRING,
    source_file STRING,
    source_sheet STRING,
    source_row INT64,
    processing_timestamp TIMESTAMP
)
"""

print("Creating BigQuery tables...")
sys.stdout.flush()

for i, (name, sql) in enumerate([
    ("ai_training_examples", create_training_table),
    ("revenue_data", create_revenue_table),
    ("cogs_data", create_cogs_table)
], 1):
    try:
        print(f"  Creating {name}...", end='', flush=True)
        client.query(sql).result()
        print(f" ✅")
        sys.stdout.flush()
    except Exception as e:
        print(f" ⚠️  {str(e)[:100]}")
        sys.stdout.flush()

print("\n✅ Tables ready!")
sys.stdout.flush()
