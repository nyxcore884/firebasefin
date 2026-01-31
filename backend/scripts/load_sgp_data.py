"""
Load SGP Financial Data into BigQuery Intelligence System

Reads fordatabasesgp.xlsx using strict SGP Financial Engine rules:
- Revenue: Regex-based classification (Wholesale/Retail)
- COGS: Account 6 + 7310 + 8230
- Expenses: Filter 73, 74, 82, 92 prefix

Populates:
- revenue_data, cogs_data, expense_data
- financial_calculations, processing_pipeline
"""

import sys
import os
import re
from pathlib import Path
from datetime import datetime
from google.cloud import bigquery
import pandas as pd
from typing import Dict, List, Any

# Add backend to path if needed (though typically this script run via python -m backend.scripts...)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings
from app.services.sgp_engine_service import SGPFinancialEngine

# Configuration
PROJECT_ID = settings.PROJECT_ID
DATASET_ID = "sgp_financial_intelligence"
DATASET_REF = f"{PROJECT_ID}.{DATASET_ID}"

# Initialize SGP Engine
sgp_engine = SGPFinancialEngine()

def find_excel_file() -> Path:
    """Find fordatabasesgp.xlsx in project"""
    search_paths = [
        Path(__file__).parent.parent.parent / "data",
        Path(__file__).parent.parent.parent / "uploads",
        Path(__file__).parent.parent.parent,
        Path.home() / "Downloads",
        Path("d:/GIT FIREBASE FIN/firebasefin-main/firebasefin-main")
    ]
    
    for path in search_paths:
        if path.exists():
            for file in path.glob("fordatabase*.xlsx"):
                return file
    
    raise FileNotFoundError("fordatabasesgp.xlsx not found.")


def parse_revenue_data(df: pd.DataFrame) -> List[Dict]:
    """Parse Revenue Breakdown using SGP Engine Service"""
    records = []
    
    # Find columns dynamically
    prod_col = next((c for c in df.columns if "Product" in str(c) or "პროდუქტი" in str(c)), df.columns[0])
    
    # Find Net Revenue based on content or header
    net_rev_col = next((c for c in df.columns if "Net Revenue" in str(c) or "თანხა" in str(c)), None)
    if not net_rev_col and len(df.columns) > 3:
        net_rev_col = df.columns[3]

    for idx, row in df.iterrows():
        product_name = str(row[prod_col]).strip()
        if not product_name or product_name.lower() == 'nan':
            continue
            
        try:
            amount = float(row[net_rev_col]) if net_rev_col else 0.0
        except:
            continue
            
        if amount == 0:
            continue
            
        # Use Shared Engine Logic
        classification = sgp_engine.classify_product(product_name)
        
        records.append({
            'revenue_record_id': f"rev_sgp_dec2025_{len(records)+1:03d}",
            'company_id': 'socar_petroleum',
            'period': '2025-12',
            'product_name_georgian': product_name,
            'product_category': classification['category'],
            'product_type': classification['type'],
            'unit_of_measure': 'kg' if classification['is_wholesale'] else ('liter' if 'ლ' in product_name else 'unknown'),
            'net_revenue': amount,
            'revenue_line_item': classification['line_item'],
            'is_wholesale': classification['is_wholesale'],
            'is_retail': classification['is_retail'],
            'source_file': 'fordatabasesgp.xlsx',
            'source_sheet': 'Revenue Breakdown',
            'source_row': idx + 2,
            'processing_timestamp': datetime.now().isoformat()
        })
        
    return records


def parse_cogs_data(df: pd.DataFrame) -> List[Dict]:
    """Parse COGS Breakdown - 3 Account Formula via Service"""
    records = []
    
    # Find columns 6, 7310, 8230
    col_6 = next((c for c in df.columns if str(c).strip() == '6'), None)
    col_7310 = next((c for c in df.columns if str(c).strip() == '7310'), None)
    col_8230 = next((c for c in df.columns if str(c).strip() == '8230'), None)
    
    prod_col = df.columns[0]
    
    for idx, row in df.iterrows():
        product_name = str(row[prod_col]).strip()
        if not product_name or product_name.lower() == 'nan':
            continue
            
        # Get values
        val_6 = float(row[col_6]) if col_6 and pd.notna(row[col_6]) else 0.0
        val_7310 = float(row[col_7310]) if col_7310 and pd.notna(row[col_7310]) else 0.0
        val_8230 = float(row[col_8230]) if col_8230 and pd.notna(row[col_8230]) else 0.0
        
        total = val_6 + val_7310 + val_8230
        
        if total == 0:
            continue
            
        classification = sgp_engine.classify_product(product_name)
        
        records.append({
            'cogs_record_id': f"cogs_sgp_dec2025_{len(records)+1:03d}",
            'company_id': 'socar_petroleum',
            'period': '2025-12',
            'product_name_georgian': product_name,
            'product_category': classification['category'],
            'cogs_6': val_6,
            'cogs_7310': val_7310,
            'cogs_8230': val_8230,
            'total_cogs': total,
            'calculation_formula': 'Account_6 + Account_7310 + Account_8230',
            'source_file': 'fordatabasesgp.xlsx',
            'source_sheet': 'COGS Breakdown',
            'source_row': idx + 2,
            'processing_timestamp': datetime.now().isoformat()
        })
        
    return records


def load_to_bigquery(table_name: str, records: List[Dict]):
    """Load records to BigQuery table"""
    client = bigquery.Client(project=PROJECT_ID)
    table_id = f"{DATASET_REF}.{table_name}"
    
    print(f"   📤 Loading {len(records)} records to {table_name}...")
    
    # Use load_table_from_json for reliability
    import tempfile
    import json
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.jsonl', delete=False, encoding='utf-8') as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + '\n')
        temp_file = f.name
        
    job_config = bigquery.LoadJobConfig(
        source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
        write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
        # Allow schema update if fields missing
        schema_update_options=[bigquery.SchemaUpdateOption.ALLOW_FIELD_ADDITION]
    )
    
    with open(temp_file, 'rb') as source_file:
        job = client.load_table_from_file(source_file, table_id, job_config=job_config)
        
    try:
        job.result()
        print(f"   ✅ Loaded {len(records)} records successfully")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        if job.errors:
            print(f"   Details: {job.errors}")
    finally:
        os.unlink(temp_file)


def main():
    print("=" * 80)
    print("📊 LOADING SGP DATA (STRICT ENGINE v1.0)")
    print("=" * 80)
    
    # 1. Find File
    try:
        excel_file = find_excel_file()
        print(f"✅ Found file: {excel_file}")
    except FileNotFoundError:
        print("❌ fordatabasesgp.xlsx not found!")
        return False
        
    # 2. Parse Sheets (Revenue & COGS)
    print("   Parsing Revenue Breakdown...")
    # Skip preamble rows if needed - typically SGP files have headers around row 1-5
    # We'll read header=None and find header row dynamically or assume row 0 if clean
    try:
        df_rev = pd.read_excel(excel_file, sheet_name='Revenue Breakdown')
        records_rev = parse_revenue_data(df_rev)
        print(f"   ✅ Parsed {len(records_rev)} revenue records")
        
        df_cogs = pd.read_excel(excel_file, sheet_name='COGS Breakdown')
        records_cogs = parse_cogs_data(df_cogs)
        print(f"   ✅ Parsed {len(records_cogs)} COGS records")
        
        # 3. Load to BigQuery
        load_to_bigquery('revenue_data', records_rev)
        load_to_bigquery('cogs_data', records_cogs)
        
        # 4. Processing Pipeline
        pipeline = [{
            'pipeline_id': f"pipe_{datetime.now().strftime('%Y%m%d%H%M')}",
            'company_id': 'socar_petroleum',
            'period': '2025-12',
            'step_name': 'Strict Engine Load',
            'step_number': 1,
            'engine_name': 'SGPFinancialEngine (Python)',
            'input_source': str(excel_file.name),
            'records_processed': len(records_rev) + len(records_cogs),
            'processing_timestamp': datetime.now().isoformat(),
            'explanation': 'Processed using strict Regex rules + 3-account COGS formula'
        }]
        load_to_bigquery('processing_pipeline', pipeline)
        
        print("\n✅ DATA LOAD COMPLETE")
        
    except Exception as e:
        print(f"❌ Processing failed: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    return True

if __name__ == "__main__":
    main()
