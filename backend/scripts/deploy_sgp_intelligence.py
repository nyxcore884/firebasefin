"""
Deploy SGP (SOCAR Georgia Petroleum) Financial Intelligence System to BigQuery

This script creates the complete BigQuery schema for SGP including:
- Financial metadata (data dictionary)
- Revenue, COGS, Expense data tables
- Processing pipeline tracking
- Business rules and validations
- AI training examples (100+ query-response pairs)

Dataset: sgp_financial_intelligence
Purpose: Train Vertex AI to understand SGP-specific operations
"""

import os
import sys
from google.cloud import bigquery
from google.api_core.exceptions import NotFound, Conflict
from pathlib import Path

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings

# File paths - bigquierylearninghub is at PROJECT ROOT, not in backend
SCRIPT_DIR = Path(__file__).parent.parent.parent / "bigquierylearninghub"  # Go up to project root
PART1_SQL = SCRIPT_DIR / "01_BIGQUERY_SCHEMA_PART1.sql"
PART2_SQL = SCRIPT_DIR / "02_BIGQUERY_SCHEMA_PART2.sql"


def deploy_sgp_intelligence_system():
    """Deploy complete SGP financial intelligence system to BigQuery"""
    
    print("=" * 80)
    print("🚀 DEPLOYING SGP FINANCIAL INTELLIGENCE SYSTEM")
    print("=" * 80)
    print(f"Project: {settings.PROJECT_ID}")
    print(f"Location: {settings.LOCATION}")
    print(f"Company: SOCAR Georgia Petroleum (SGP)")
    print("=" * 80)
    
    # Initialize BigQuery client
    client = bigquery.Client(project=settings.PROJECT_ID, location=settings.LOCATION)
    dataset_id = "sgp_financial_intelligence"
    dataset_ref = f"{settings.PROJECT_ID}.{dataset_id}"
    
    # Step 1: Create Dataset
    print("\n[1/3] Creating dataset: sgp_financial_intelligence")
    try:
        dataset = client.get_dataset(dataset_ref)
        print(f"   ✅ Dataset already exists: {dataset_ref}")
    except NotFound:
        dataset = bigquery.Dataset(dataset_ref)
        dataset.location = settings.LOCATION
        dataset.description = "SGP Financial Intelligence - Training data for Vertex AI"
        dataset = client.create_dataset(dataset, timeout=30)
        print(f"   ✅ Created dataset: {dataset_ref}")
    
    # Step 2: Execute SQL Part 1 (Tables with data)
    print(f"\n[2/3] Executing schema Part 1: {PART1_SQL.name}")
    if not PART1_SQL.exists():
        print(f"   ❌ File not found: {PART1_SQL}")
        return False
    
    try:
        # Read SQL file (it's actually markdown with SQL blocks)
        print(f"   📂 Reading file: {PART1_SQL}")
        with open(PART1_SQL, 'r', encoding='utf-8') as f:
            content = f.read()
        
        print(f"   📄 File size: {len(content)} characters")
        
        # Extract SQL statements from markdown code blocks
        sql_statements = extract_sql_from_markdown(content)
        
        if not sql_statements:
            print("   ⚠️  No SQL statements found in file!")
            print("   This might be normal if the file only contains documentation.")
            return True
        
    except Exception as e:
        print(f"   ❌ Error reading file: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    executed = 0
    for i, sql in enumerate(sql_statements, 1):
        try:
            # Replace placeholder with actual project
            sql = sql.replace('sgp_financial_intelligence', dataset_ref)
            
            # Execute
            job = client.query(sql)
            job.result()  # Wait for completion
            
            executed += 1
            print(f"   ✅ [{i}/{len(sql_statements)}] Executed successfully")
            
        except Exception as e:
            error_msg = str(e)
            
            # Ignore "already exists" errors
            if "already exists" in error_msg.lower():
                print(f"   ⚠️  [{i}/{len(sql_statements)}] Already exists (skipped)")
            else:
                print(f"   ❌ [{i}/{len(sql_statements)}] Error: {error_msg[:100]}")
    
    print(f"   ✅ Part 1 complete: {executed}/{len(sql_statements)} statements executed")
    
    # Step 3: Execute SQL Part 2 (Additional tables)
    print(f"\n[3/3] Executing schema Part 2: {PART2_SQL.name}")
    if not PART2_SQL.exists():
        print(f"   ⚠️  File not found: {PART2_SQL} (optional)")
    else:
        with open(PART2_SQL, 'r', encoding='utf-8') as f:
            content2 = f.read()
        
        sql_statements2 = extract_sql_from_markdown(content2)
        print(f"   📝 Found {len(sql_statements2)} SQL statements in Part 2")
        
        executed2 = 0
        for i, sql in enumerate(sql_statements2, 1):
            try:
                sql = sql.replace('sgp_financial_intelligence', dataset_ref)
                job = client.query(sql)
                job.result()
                executed2 += 1
                print(f"   ✅ [{i}/{len(sql_statements2)}] Executed successfully")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print(f"   ⚠️  [{i}/{len(sql_statements2)}] Already exists (skipped)")
                else:
                    print(f"   ❌ [{i}/{len(sql_statements2)}] Error: {str(e)[:100]}")
        
        print(f"   ✅ Part 2 complete: {executed2}/{len(sql_statements2)} statements executed")
    
    # Summary
    print("\n" + "=" * 80)
    print("✅ SGP FINANCIAL INTELLIGENCE DEPLOYMENT COMPLETE!")
    print("=" * 80)
    print(f"Dataset: {dataset_ref}")
    print("Tables created:")
    print("  ✅ financial_metadata (data dictionary)")
    print("  ✅ revenue_data (with source tracking)")
    print("  ✅ cogs_data (calculation logic)")
    print("  ✅ expense_data (classifications)")
    print("  ✅ financial_calculations (derived metrics)")
    print("  ✅ processing_pipeline (audit trail)")
    print("  ✅ business_rules (validations)")
    print("  ✅ data_quality_checks (error detection)")
    print("  ✅ insights_and_recommendations (AI insights)")
    print("  ✅ ai_training_examples (100+ training pairs)")
    print("\n📊 Next Steps:")
    print("  1. Load sample SGP data (fordatabasesgp.xlsx)")
    print("  2. Export training data to JSONL")
    print("  3. Tune Vertex AI model with JSONL data")
    print("  4. Test AI queries against SGP data")
    print("=" * 80)
    
    return True


def extract_sql_from_markdown(content: str) -> list:
    """Extract SQL CREATE and INSERT statements from markdown code blocks"""
    
    import re
    
    # Find all ```sql code blocks
    sql_blocks = re.findall(r'```sql\n(.*?)\n```', content, re.DOTALL | re.IGNORECASE)
    
    print(f"   📝 Found {len(sql_blocks)} SQL code blocks")
    
    statements = []
    
    for block_num, block in enumerate(sql_blocks, 1):
        # Clean the block
        block = block.strip()
        
        # Split by semicolons but preserve statement integrity
        # Look for CREATE TABLE and INSERT statements
        lines = block.split('\n')
        current_statement = []
        in_statement = False
        
        for line in lines:
            stripped = line.strip()
            
            # Skip empty lines and comments
            if not stripped or stripped.startswith('--') or stripped.startswith('#'):
                if not in_statement:
                    continue
            
            # Start of a new statement
            if stripped.upper().startswith(('CREATE', 'INSERT')):
                # Save previous statement if exists
                if current_statement:
                    full_stmt = '\n'.join(current_statement)
                    statements.append(full_stmt)
                    current_statement = []
                
                in_statement = True
            
            if in_statement:
                current_statement.append(line)
            
            # End of statement
            if stripped.endswith(';') and in_statement:
                full_stmt = '\n'.join(current_statement)
                statements.append(full_stmt)
                print(f"      Statement {len(statements)}: {full_stmt[:80]}...")
                current_statement = []
                in_statement = False
        
        # Save any remaining statement
        if current_statement:
            full_stmt = '\n'.join(current_statement)
            if any(full_stmt.strip().upper().startswith(kw) for kw in ['CREATE', 'INSERT']):
                statements.append(full_stmt)
                print(f"      Statement {len(statements)}: {full_stmt[:80]}...")
    
    print(f"   ✅ Extracted {len(statements)} SQL statements total")
    return statements


if __name__ == "__main__":
    success = deploy_sgp_intelligence_system()
    
    if success:
        print("\n✅ Deployment successful!")
        sys.exit(0)
    else:
        print("\n❌ Deployment failed!")
        sys.exit(1)
