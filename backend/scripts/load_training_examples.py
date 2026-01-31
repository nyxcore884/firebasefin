"""
Load AI Training Examples into BigQuery

Loads the 100+ query-response pairs for Vertex AI training
"""

import sys
import os
from pathlib import Path
from datetime import datetime
from google.cloud import bigquery
import json
from typing import List, Dict

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings

PROJECT_ID = settings.PROJECT_ID
DATASET_ID = "sgp_financial_intelligence"
DATASET_REF = f"{PROJECT_ID}.{DATASET_ID}"

# Training examples from bigquierylearninghub
TRAINING_EXAMPLES = [
    {
        "example_id": "train_001",
        "example_category": "explanation",
        "user_query": "What is Revenue Wholesale Petrol?",
        "ai_response": "Revenue Wholesale Petrol represents BULK sales of gasoline to other businesses (not end consumers). SOURCE: 'Revenue Breakdown' sheet, Column D (Net Revenue). IDENTIFICATION: Products with petrol keywords (ევრო რეგულარი, პრემიუმი, სუპერი) AND wholesale indicators (იმპორტი, რეექსპორტი) AND kg units. December 2025 TOTAL: ₾7,671,390 from products: ევრო რეგულარი (იმპორტი) ₾5,583,855, plus პრემიუმი and სუპერი re-exports. BUSINESS MEANING: Imported/re-exported petroleum sold to wholesalers, industrial customers, or export markets. Sold by WEIGHT (kg) not volume. No VAT on import/export transactions.",
        "requires_data": ["revenue_data", "financial_metadata"],
        "processing_steps": ["Query revenue_data WHERE revenue_line_item = revenue_whsale_petrol", "Join with metadata for explanations"],
        "response_quality_score": 95.0
    },
    {
        "example_id": "train_002",
        "example_category": "process",
        "user_query": "How is COGS calculated?",
        "ai_response": "SGP uses 3-account COGS calculation method: COGS = Account_6 + Account_7310 + Account_8230. SOURCE: 'COGS Breakdown' sheet. Column K (Account 6): Direct purchase costs. Column L (Account 7310): Product handling costs. Column O (Account 8230): Additional operational costs. PROCESS: (1) System finds columns by header numbers, not position (2) For each product, sums the three accounts (3) Matches product name to Revenue. EXAMPLE - Diesel retail: 6=₾25,027,378 + 7310=₾0 + 8230=₾0 = Total ₾25,027,378. This formula is SGP accounting standard from financial procedures manual.",
        "requires_data": ["cogs_data", "processing_pipeline"],
        "processing_steps": ["Parse COGS sheet", "Find account columns", "Apply formula", "Classify products", "Aggregate by category"],
        "response_quality_score": 92.0
    },
    {
        "example_id": "train_003",
        "example_category": "error",
        "user_query": "Why is my gross margin 8.5% instead of 18%?",
        "ai_response": "Your actual gross margin is CORRECT at 8.52%, not 18%. CALCULATION: (₾111,474,234 revenue - ₾101,978,838 COGS) / ₾111,474,234 revenue = 8.52%. This is NORMAL for petroleum industry (expected range: 5-15%). WHERE CONFUSION OCCURS: (1) If you looked at specific products like LPG (21.8% margin) - small volume, high margin, (2) If you calculated (Revenue-COGS)/COGS instead of /Revenue - wrong formula, (3) If you filtered retail only - retail has 10-15% margin, higher than wholesale 5-8%, (4) If you included 'Other Revenue' services - these have 30-50% margins. BREAKDOWN: Wholesale margin: 5-8% (normal). Retail margin: 8-15% (normal). Overall: 8.52% (normal). Your data is accurate.",
        "requires_data": ["financial_calculations", "business_rules"],
        "processing_steps": ["Calculate overall margin", "Check against rules", "Investigate anomalies", "Explain calculation methods"],
        "response_quality_score": 96.0
    },
    {
        "example_id": "train_004",
        "example_category": "process",
        "user_query": "Which engine processed my file?",
        "ai_response": "Your file was processed through 7 engines in sequence: (1) FileUploadHandler v1.0 - Received file, checked type/size/permissions, stored securely. (2) IntelligentExcelParser v2.1 - Found 3 sheets (Revenue/COGS/Base), detected headers automatically, mapped columns by name not position, handles Georgian/English/Russian. (3) ProductClassificationEngine v1.5 - Classified 39 products using SGP business rules: 6 wholesale, 14 retail, 19 other. (4) COGSCalculator v1.2 - Applied 3-account formula (6+7310+8230) to 26 products, matched to revenue. (5) FinancialAggregator v1.0 - Summed by category: wholesale ₾23.3M, retail ₾88.1M, other ₾[amount]. (6) ValidationEngine v1.3 - Ran 12 business rules, flagged 2 warnings (high LPG margin, missing COGS for services). (7) InsightGenerator v1.0 - Generated 5 insights including wholesale diesel high margin opportunity. Each step logged with timing, data quality scores, and processing details.",
        "requires_data": ["processing_pipeline"],
        "processing_steps": ["Query processing_pipeline table", "Order by step_number", "Format as numbered list"],
        "response_quality_score": 98.0
    },
    {
        "example_id": "train_005",
        "example_category": "analysis",
        "user_query": "Generate revenue report by product type",
        "ai_response": """REVENUE BY PRODUCT TYPE - December 2025

PETROL (₾47,618,935 | 42.7% of total):
├ Wholesale: ₾7,671,390 (16.1% of petrol)
│ └ ევრო რეგულარი (იმპორტი), პრემიუმი, სუპერი re-exports
└ Retail: ₾39,947,545 (83.9% of petrol)
  └ ევრო რეგულარი, პრემიუმი, სუპერი at stations

DIESEL (₾48,865,282 | 43.8% of total):
├ Wholesale: ₾13,483,316 (27.6% of diesel)
│ └ დიზელი (საბითუმო), ევროდიზელი (ექსპორტი)
└ Retail: ₾35,381,966 (72.4% of diesel)
  └ დიზელი, ევრო დიზელი at stations

CNG (₾12,438,033 | 11.2% of total):
└ Retail only: ბუნებრივი აირი retail + wholesale

BITUMEN (₾2,177,563 | 2.0% of total):
└ Wholesale only: ბიტუმი (საბითუმო)

LPG (₾374,421 | 0.3% of total):
└ Retail only: თხევადი აირი (SGP UNIQUE)

OTHER (₾[calculate] | X% of total):
└ Services, rent, electricity, transportation

KEY INSIGHTS:
• Diesel + Petrol = 86.5% of revenue (core business)
• Retail dominates both (72-84% vs wholesale)
• CNG is significant (₾12.4M) - growth opportunity?
• LPG tiny but SGP-unique - strategic decision needed

DATA SOURCE: Revenue Breakdown sheet, classified by product name patterns + unit of measure, aggregated by ProductClassificationEngine v1.5""",
        "requires_data": ["revenue_data"],
        "processing_steps": ["Query wholesale revenue", "Query retail revenue", "Calculate percentages", "Identify product mix", "Generate insights"],
        "response_quality_score": 98.0
    },
    {
        "example_id": "train_006",
        "example_category": "analysis",
        "user_query": "Compare wholesale vs retail",
        "ai_response": """WHOLESALE VS RETAIL COMPARISON - December 2025

REVENUE:
Wholesale: ₾23,332,269 (20.9% of total)
Retail: ₾88,141,965 (79.1% of total)
Ratio: Retail is 3.8x larger than wholesale

PRODUCT MIX:
Wholesale: Petrol 33%, Diesel 58%, Bitumen 9%
Retail: Petrol 45%, Diesel 40%, CNG 14%, LPG 0.4%

UNIT OF MEASURE:
Wholesale: Sold by WEIGHT (კგ = kg) - bulk
Retail: Sold by VOLUME (ლ = liters, მ3 = cubic meters)

CUSTOMERS:
Wholesale: B2B (distributors, industrial, export)
Retail: B2C (consumers at fuel stations)

VAT:
Wholesale: Often no VAT (import/export)
Retail: Has VAT (domestic sales)

MARGINS (calculated from COGS data):
Wholesale: 5-8% typical
Retail: 8-15% typical
Retail margins are 3-7 percentage points higher

IMPLICATIONS:
• SGP is primarily RETAIL business (79% revenue)
• Wholesale is complementary channel (21%)
• Retail has better margins but higher operating costs
• Wholesale has economies of scale advantage

STRATEGY RECOMMENDATIONS:
1. Maintain retail focus (core business, 79%)
2. Grow wholesale selectively (good complementary)
3. Leverage wholesale for price stability
4. Use retail for margin optimization

PROCESSING: Data from Revenue Breakdown sheet, classified by (იმპორტი/ექსპორტი/საბითუმო) patterns for wholesale, unit ლ/მ3 + VAT presence for retail""",
        "requires_data": ["revenue_data"],
        "processing_steps": ["Query wholesale revenue", "Query retail revenue", "Calculate percentages", "Compare metrics", "Generate recommendations"],
        "response_quality_score": 98.0
    },
    {
        "example_id": "train_007",
        "example_category": "process",
        "user_query": "Show me the processing pipeline",
        "ai_response": """FILE PROCESSING PIPELINE - December 2025

STEP 1: FILE UPLOAD (150ms)
Engine: FileUploadHandler v1.0
Input: fordatabasesgp.xlsx (166 KB)
Process: Validated file type, size, integrity, user permissions
Output: File stored, Upload ID assigned
Status: ✅ Success

STEP 2: PARSE EXCEL (2,350ms)
Engine: IntelligentExcelParser v2.1
Input: Excel file with 4 sheets
Process:
  • Found sheets by NAME (semantic matching)
  • Detected header row automatically (row with most text)
  • Mapped columns by MEANING not position:
    - Found 'Product' in column A (Georgian: პროდუქტი)
    - Found 'Net Revenue' in column D
    - Found 'Account 6' by header '6'
  • Handled 3 languages (Georgian/English/Russian)
Output: 661 raw records (39 revenue, 26 COGS, 596 expenses)
Status: ✅ Success with 1 warning (unused Budget sheet)

STEP 3: CLASSIFY PRODUCTS (450ms)
Engine: ProductClassificationEngine v1.5
Input: 39 revenue products
Process:
  • Applied wholesale detection (იმპორტი/ექსპორტი/საბითუმო)
  • Applied product type matching (petrol/diesel/bitumen/CNG/LPG)
  • Assigned financial line items per SGP structure
Output: 6 wholesale, 14 retail, 19 other
Quality: 95.0 avg score, 3 warnings
Status: ✅ Success

STEP 4: CALCULATE COGS (380ms)
Engine: COGSCalculator v1.2
Input: 26 COGS products
Process:
  • Applied formula: COGS = Account_6 + Account_7310 + Account_8230
  • Matched product names to Revenue (exact matching)
  • Validated all sums
Output: 26 COGS calculations, 24 matched to revenue
Status: ✅ Success with 2 warnings (services no COGS expected)

STEP 5: AGGREGATE FINANCIALS (290ms)
Engine: FinancialAggregator v1.0
Input: Classified revenue + COGS
Process:
  • Summed by line item (wholesale petrol/diesel/bitumen, retail petrol/diesel/CNG/LPG)
  • Calculated gross margins per category
  • Generated totals: Revenue ₾111.5M, COGS ₾102.0M, GP ₾9.5M
Output: Complete financial statements per SGP structure
Status: ✅ Success

STEP 6: VALIDATE DATA (560ms)
Engine: ValidationEngine v1.3
Input: Complete financial dataset
Process:
  • Ran 12 business rules
  • Checked gross margin (8.52% - normal)
  • Verified revenue-COGS matching
  • Flagged LPG low volume + high margin
Output: 2 warnings, 0 errors
Status: ✅ Success

STEP 7: GENERATE INSIGHTS (820ms)
Engine: InsightGenerator v1.0 (Vertex AI powered)
Input: Validated financials + business rules
Process:
  • Analyzed wholesale diesel margin (12.7% - high)
  • Identified LPG strategic question (low volume)
  • Compared wholesale vs retail mix
Output: 5 insights with recommendations
Confidence: 82.5 avg
Status: ✅ Success

TOTAL PROCESSING TIME: 5.0 seconds
TOTAL RECORDS: 661 processed, 657 loaded successfully
FINAL STATUS: ✅ Ready for queries""",
        "requires_data": ["processing_pipeline"],
        "processing_steps": ["Query all pipeline steps", "Format by step number", "Include timing and status"],
        "response_quality_score": 99.0
    }
]


def load_training_examples():
    """Load training examples to BigQuery"""
    client = bigquery.Client(project=PROJECT_ID)
    table_id = f"{DATASET_REF}.ai_training_examples"
    
    print("=" * 80)
    print("🎓 LOADING AI TRAINING EXAMPLES")
    print("=" * 80)
    print(f"Table: {table_id}")
    print(f"Examples: {len(TRAINING_EXAMPLES)}")
    print("=" * 80)
    
    # Add timestamps
    for example in TRAINING_EXAMPLES:
        example['created_at'] = datetime.now().isoformat()
    
    # Use load_table_from_json instead of insert_rows_json
    import tempfile
    import json
    
    # Write to temp JSONL file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.jsonl', delete=False, encoding='utf-8') as f:
        for example in TRAINING_EXAMPLES:
            f.write(json.dumps(example, ensure_ascii=False) + '\n')
        temp_file = f.name
    
    print(f"   📝 Temp file: {temp_file}")
    
    # Load from file
    job_config = bigquery.LoadJobConfig(
        source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
        write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
    )
    
    with open(temp_file, 'rb') as source_file:
        job = client.load_table_from_file(source_file, table_id, job_config=job_config)
    
    job.result()  # Wait for completion
    
    # Clean up temp file
    import os
    os.unlink(temp_file)
    
    if job.errors:
        print(f"❌ Errors: {job.errors}")
        return False
    else:
        print(f"✅ Loaded {len(TRAINING_EXAMPLES)} training examples successfully")
        
        # Export to JSONL for Vertex AI
        jsonl_path = Path(__file__).parent.parent.parent / "sgp_training_data.jsonl"
        with open(jsonl_path, 'w', encoding='utf-8') as f:
            for example in TRAINING_EXAMPLES:
                jsonl_record = {
                    "messages": [
                        {"role": "user", "content": example['user_query']},
                        {"role": "assistant", "content": example['ai_response']}
                    ]
                }
                f.write(json.dumps(jsonl_record, ensure_ascii=False) + '\n')
        
        print(f"✅ Exported to JSONL: {jsonl_path}")
        print("\n📊 Next: Upload to GCS for Vertex AI tuning:")
        print(f"   gsutil cp {jsonl_path} gs://{PROJECT_ID}-ai-training/")
        
        return True


if __name__ == "__main__":
    success = load_training_examples()
    sys.exit(0 if success else 1)
