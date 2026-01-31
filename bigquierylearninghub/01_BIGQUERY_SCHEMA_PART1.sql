# BIGQUERY DATABASE FOR VERTEX AI TRAINING
## Complete Financial Intelligence with Processing Pipeline Explanations

---

## OVERVIEW

This BigQuery database serves as the **knowledge warehouse** for Vertex AI to:
1. ✅ Understand SGP financial structure and logic
2. ✅ Explain data sources and transformations
3. ✅ Generate insights and recommendations
4. ✅ Show processing pipeline and engine logic
5. ✅ Create live dashboards with explanations
6. ✅ Identify errors and anomalies
7. ✅ Provide deep financial analysis

---

## BIGQUERY SCHEMA STRUCTURE

```
sgp_financial_intelligence/
├─ 01_financial_metadata          (Data dictionary & logic explanations)
├─ 02_revenue_data                (Revenue with source tracking)
├─ 03_cogs_data                   (COGS with calculation logic)
├─ 04_expense_data                (Expenses with classifications)
├─ 05_financial_calculations      (Derived metrics with formulas)
├─ 06_processing_pipeline         (Engine logic & steps)
├─ 07_business_rules              (Financial rules & validations)
├─ 08_data_quality_checks         (Error detection logic)
├─ 09_insights_and_recommendations (AI-generated insights)
└─ 10_training_examples           (Query-response pairs for AI)
```

---

## 1. FINANCIAL METADATA TABLE

**Purpose:** Explains every field, source, calculation, and business meaning

```sql
-- ============================================================================
-- TABLE: financial_metadata
-- Contains complete data dictionary with business logic explanations
-- ============================================================================

CREATE TABLE `sgp_financial_intelligence.financial_metadata` (
    -- Identity
    metadata_id STRING NOT NULL,
    field_name STRING NOT NULL,
    field_name_georgian STRING,
    field_name_russian STRING,
    
    -- Classification
    data_category STRING NOT NULL,  -- 'revenue', 'cogs', 'expense', 'derived'
    sub_category STRING,             -- 'wholesale', 'retail', 'other'
    
    -- Source Information
    source_file STRING,              -- 'Reports.xlsx'
    source_sheet STRING,             -- 'Revenue Breakdown', 'COGS Breakdown', 'Base'
    source_column STRING,            -- 'Net Revenue (D)', 'Account 6 (K)'
    source_row_identifier STRING,   -- 'Product name'
    
    -- Business Logic
    business_definition STRING NOT NULL,  -- What this field means
    calculation_formula STRING,           -- How it's calculated
    business_rules JSON,                  -- Validation rules
    
    -- Processing Information
    processing_engine STRING,        -- Which engine processes this
    transformation_logic STRING,     -- How data is transformed
    validation_rules STRING,         -- Quality checks applied
    
    -- Financial Context
    financial_statement_location STRING,  -- 'Income Statement - Revenue'
    accounting_treatment STRING,          -- 'Revenue recognition', 'COGS matching'
    typical_range JSON,                   -- Expected value ranges
    
    -- Relationships
    related_fields ARRAY<STRING>,    -- Other fields this depends on
    parent_field STRING,             -- Aggregates to which field
    child_fields ARRAY<STRING>,      -- Broken down into which fields
    
    -- Examples
    example_values JSON,             -- Sample valid values
    edge_cases JSON,                 -- Special cases to handle
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP,
    version STRING DEFAULT '1.0'
);

-- ============================================================================
-- SAMPLE DATA: Revenue Wholesale Petrol
-- ============================================================================

INSERT INTO `sgp_financial_intelligence.financial_metadata` VALUES (
    -- Identity
    'meta_001',
    'revenue_whsale_petrol',
    'შემოსავალი საბითუმო ბენზინი',
    'Выручка опт бензин',
    
    -- Classification
    'revenue',
    'wholesale_petrol',
    
    -- Source
    'Reports.xlsx',
    'Revenue Breakdown',
    'Net Revenue (Column D)',
    'Product name (Column A) matches: ევრო რეგულარი (იმპორტი), პრემიუმი (რეექსპორტი), სუპერი (რეექსპორტი)',
    
    -- Business Logic
    'Revenue from wholesale petroleum sales (import and re-export). Represents bulk sales to other companies, not end consumers. Products sold by weight (kg) not volume (L).',
    
    'SUM(Net Revenue) WHERE Product IN (
        "ევრო რეგულარი (იმპორტი), კგ",
        "პრემიუმი (რეექსპორტი), კგ", 
        "სუპერი (რეექსპორტი), კგ"
    )',
    
    JSON '{"min_value": 0, "expected_gross_margin_pct": "5-15%", "vat_treatment": "VAT calculated separately", "currency": "GEL"}',
    
    -- Processing
    'IntelligentExcelParser → ProductClassifier → RevenueAggregator',
    
    'Step 1: Parse "Revenue Breakdown" sheet
     Step 2: Find products with (იმპორტი) or (რეექსპორტი) in name
     Step 3: Filter to petrol products (exclude diesel, bitumen)
     Step 4: Extract "Net Revenue" column (excludes VAT)
     Step 5: Sum all matching products
     Step 6: Store with metadata: wholesale=true, product_type=petrol',
    
    'Must be >= 0, Must have matching COGS, Gross margin must be 5-15%',
    
    -- Financial Context
    'Income Statement → Revenue → Revenue Wholesale → Revenue Whsale Petrol (Lari)',
    'Revenue recognized on delivery. Matched with COGS by product name.',
    JSON '{"min": 0, "expected": 5000000, "max": 15000000, "unit": "GEL"}',
    
    -- Relationships
    ['net_revenue_col_d', 'product_name_col_a', 'vat_col_c'],
    'revenue_wholesale',
    ['euro_regular_import', 'premium_reexport', 'super_reexport'],
    
    -- Examples
    JSON '{
        "valid": [
            {"product": "ევრო რეგულარი (იმპორტი), კგ", "amount": 5583855.32},
            {"product": "პრემიუმი (რეექსპორტი), კგ", "amount": 1234567.89}
        ],
        "invalid": [
            {"product": "დიზელი (საბითუმო)", "reason": "This is diesel, not petrol"},
            {"product": "ევრო რეგულარი, ლ", "reason": "This is retail (L), not wholesale (კგ)"}
        ]
    }',
    
    JSON '{
        "zero_revenue": "Possible if no wholesale sales in period",
        "negative_revenue": "Should never occur, indicates error",
        "missing_vat": "Import/export may have NULL VAT (not domestic)"
    }',
    
    CURRENT_TIMESTAMP(),
    NULL,
    '1.0'
);

-- ============================================================================
-- SAMPLE DATA: COGS Calculation Logic
-- ============================================================================

INSERT INTO `sgp_financial_intelligence.financial_metadata` VALUES (
    'meta_002',
    'cogs_total',
    'თვითღირებულება',
    'Себестоимость',
    
    'cogs',
    'all',
    
    'Reports.xlsx',
    'COGS Breakdown',
    'Columns K (6), L (7310), O (8230)',
    'Product name in Субконто (Column A)',
    
    'Total Cost of Goods Sold for a product. Includes: Account 6 (direct costs), Account 7310 (product-specific costs), Account 8230 (additional costs). This is the accounting standard for SGP.',
    
    'COGS_Total = Account_6 (Column K) + Account_7310 (Column L) + Account_8230 (Column O)
    
    WHERE Product = matching product from Revenue Breakdown',
    
    JSON '{
        "formula": "COGS = 6 + 7310 + 8230",
        "accounts_explained": {
            "6": "Direct purchase costs from suppliers",
            "7310": "Product handling and distribution costs",
            "8230": "Additional operational costs"
        },
        "matching_rule": "COGS product name must exactly match Revenue product name"
    }',
    
    'IntelligentExcelParser → COGSBreakdownParser → AccountSummer',
    
    'Step 1: Parse "COGS Breakdown" sheet with Russian headers
     Step 2: Find "Субконто" column (A) - contains product names
     Step 3: Identify account columns by header numbers: 6, 7310, 8230
     Step 4: For each product:
         - Extract value from column K (Account 6)
         - Extract value from column L (Account 7310)  
         - Extract value from column O (Account 8230)
         - Sum: Total_COGS = K + L + O
     Step 5: Match product name to Revenue product
     Step 6: Store with source tracking',
    
    'All three account values must exist, Sum must be >= 0, Must have matching Revenue record',
    
    'Income Statement → COGS → [By Product Category]',
    'COGS matched to Revenue by product name. Used to calculate Gross Margin.',
    JSON '{"min": 0, "expected_ratio_to_revenue": "85-95%"}',
    
    ['account_6_col_k', 'account_7310_col_l', 'account_8230_col_o', 'product_name_col_a'],
    'total_cogs',
    ['cogs_wholesale', 'cogs_retail', 'cogs_other'],
    
    JSON '{
        "valid": [
            {"product": "დიზელი", "6": 25027378.06, "7310": 0, "8230": 0, "total": 25027378.06},
            {"product": "ბიტუმი (საბითუმო)", "6": 2079841.07, "7310": 0, "8230": 0, "total": 2079841.07}
        ]
    }',
    
    JSON '{
        "missing_account": "If an account column is empty, treat as 0",
        "import_products": "Import products may have cost in Account 1605 (Column E) instead of 6",
        "name_mismatch": "Product name in COGS must match Revenue exactly (including spaces, punctuation)"
    }',
    
    CURRENT_TIMESTAMP(),
    NULL,
    '1.0'
);
```

---

## 2. REVENUE DATA TABLE (With Source Tracking)

```sql
-- ============================================================================
-- TABLE: revenue_data
-- All revenue records with complete source and processing metadata
-- ============================================================================

CREATE TABLE `sgp_financial_intelligence.revenue_data` (
    -- Record Identity
    revenue_record_id STRING NOT NULL,
    company_id STRING DEFAULT 'socar_petroleum',
    period STRING NOT NULL,  -- '2025-12'
    
    -- Product Information
    product_name_georgian STRING NOT NULL,
    product_name_english STRING,
    product_category STRING,  -- 'wholesale', 'retail', 'other'
    product_type STRING,      -- 'petrol', 'diesel', 'bitumen', 'cng', 'lpg'
    unit_of_measure STRING,   -- 'კგ', 'ლ', 'მ3'
    
    -- Financial Data
    amount_with_vat NUMERIC,
    vat_amount NUMERIC,
    net_revenue NUMERIC NOT NULL,
    
    -- Classification
    revenue_line_item STRING NOT NULL,  -- 'revenue_whsale_petrol', etc.
    is_wholesale BOOLEAN,
    is_retail BOOLEAN,
    is_other BOOLEAN,
    
    -- Source Tracking
    source_file STRING,
    source_sheet STRING,
    source_row INTEGER,
    source_column_amount STRING,
    source_column_product STRING,
    
    -- Processing Metadata
    parsed_by_engine STRING,
    classification_logic STRING,
    processing_timestamp TIMESTAMP,
    data_quality_score NUMERIC,  -- 0-100
    validation_warnings ARRAY<STRING>,
    
    -- Business Context
    explanation STRING,  -- Why this product belongs to this category
    typical_customer_type STRING,  -- 'B2B', 'B2C', 'Government'
    
    -- Relationships
    has_matching_cogs BOOLEAN,
    cogs_record_id STRING,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- ============================================================================
-- SAMPLE DATA WITH FULL EXPLANATION
-- ============================================================================

INSERT INTO `sgp_financial_intelligence.revenue_data` VALUES (
    'rev_sgp_2025_12_001',
    'socar_petroleum',
    '2025-12',
    
    'ევრო რეგულარი (იმპორტი), კგ',
    'Euro Regular (Import), kg',
    'wholesale',
    'petrol',
    'კგ',
    
    NULL,  -- No VAT on import
    NULL,
    5583855.32,
    
    'revenue_whsale_petrol',
    TRUE,
    FALSE,
    FALSE,
    
    'fordatabasesgp.xlsx',
    'Revenue Breakdown',
    14,
    'D (Net Revenue)',
    'A (Product)',
    
    'IntelligentExcelParser v2.1',
    'Product name contains "(იმპორტი)" AND ends with ", კგ" AND matches petrol keywords [ევრო, რეგულარი] → Classified as Wholesale Petrol',
    CURRENT_TIMESTAMP(),
    95.0,
    [],
    
    'This is IMPORTED petroleum (Euro Regular grade) sold in BULK by weight (კგ = kilograms). The "(იმპორტი)" suffix indicates this is imported inventory being resold wholesale. No VAT because it\'s an import transaction. This is different from retail "ევრო რეგულარი, ლ" which is the same grade sold to end consumers by volume (liters).',
    'B2B - Wholesale distributors',
    
    TRUE,
    'cogs_sgp_2025_12_001',
    
    CURRENT_TIMESTAMP()
);

INSERT INTO `sgp_financial_intelligence.revenue_data` VALUES (
    'rev_sgp_2025_12_002',
    'socar_petroleum',
    '2025-12',
    
    'დიზელი, ლ',
    'Diesel, L',
    'retail',
    'diesel',
    'ლ',
    
    30276534.67,
    4617873.09,
    25658661.58,
    
    'revenue_retail_diesel',
    FALSE,
    TRUE,
    FALSE,
    
    'fordatabasesgp.xlsx',
    'Revenue Breakdown',
    10,
    'D (Net Revenue)',
    'A (Product)',
    
    'IntelligentExcelParser v2.1',
    'Product name is "დიზელი, ლ" without wholesale suffixes → Retail. Unit "ლ" (liters) confirms retail. Has VAT → Domestic retail sale.',
    CURRENT_TIMESTAMP(),
    98.0,
    [],
    
    'This is diesel fuel sold RETAIL to end consumers (vehicles, generators). Sold by VOLUME (ლ = liters). Has VAT (18%) because it\'s a domestic retail sale. This is different from "დიზელი (საბითუმო), ლ" which is wholesale diesel.',
    'B2C - Individual consumers at fuel stations',
    
    TRUE,
    'cogs_sgp_2025_12_002',
    
    CURRENT_TIMESTAMP()
);

INSERT INTO `sgp_financial_intelligence.revenue_data` VALUES (
    'rev_sgp_2025_12_003',
    'socar_petroleum',
    '2025-12',
    
    'BP გადაზიდვის ღირებულება, მომსახურება',
    'BP Transportation Cost, service',
    'other',
    'service',
    'მომსახურება',
    
    103090.33,
    NULL,
    103090.33,
    
    'other_revenue',
    FALSE,
    FALSE,
    TRUE,
    
    'fordatabasesgp.xlsx',
    'Revenue Breakdown',
    3,
    'D (Net Revenue)',
    'A (Product)',
    
    'IntelligentExcelParser v2.1',
    'Product name contains "მომსახურება" (service) AND does not match petrol/diesel/bitumen/CNG/LPG keywords → Other Revenue',
    CURRENT_TIMESTAMP(),
    90.0,
    ['No VAT but expected for service - verify if exempt'],
    
    'This is transportation service revenue charged to BP. Not a petroleum product sale. Classified as "Other Revenue" because it doesn\'t fit wholesale or retail product categories. This represents ancillary business activities.',
    'B2B - Service contract with BP',
    
    FALSE,  -- Services typically don't have COGS
    NULL,
    
    CURRENT_TIMESTAMP()
);
```

---

## 3. PROCESSING PIPELINE TABLE

**Purpose:** Documents every step of data processing with engine logic

```sql
-- ============================================================================
-- TABLE: processing_pipeline
-- Complete audit trail of how data was processed
-- ============================================================================

CREATE TABLE `sgp_financial_intelligence.processing_pipeline` (
    -- Pipeline Identity
    pipeline_run_id STRING NOT NULL,
    file_upload_id STRING,
    company_id STRING,
    period STRING,
    
    -- Step Information
    step_number INTEGER NOT NULL,
    step_name STRING NOT NULL,
    engine_name STRING NOT NULL,
    engine_version STRING,
    
    -- Processing Details
    input_description STRING,
    processing_logic STRING,  -- Detailed explanation of what happened
    output_description STRING,
    
    -- Technical Details
    code_function STRING,  -- Which function was called
    parameters JSON,       -- Input parameters
    
    -- Results
    records_processed INTEGER,
    records_created INTEGER,
    records_updated INTEGER,
    records_failed INTEGER,
    
    -- Data Quality
    validation_performed ARRAY<STRING>,
    warnings_generated ARRAY<STRING>,
    errors_encountered ARRAY<STRING>,
    
    -- Performance
    execution_time_ms INTEGER,
    memory_used_mb NUMERIC,
    
    -- Status
    status STRING,  -- 'success', 'warning', 'error'
    status_message STRING,
    
    -- Timestamps
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Explanation for AI
    human_readable_explanation STRING,
    ai_learning_notes STRING
);

-- ============================================================================
-- SAMPLE: Complete Pipeline Run
-- ============================================================================

-- Step 1: File Upload
INSERT INTO `sgp_financial_intelligence.processing_pipeline` VALUES (
    'pipeline_2025_12_run_001',
    'upload_2025_12_29_14_30_00',
    'socar_petroleum',
    '2025-12',
    
    1,
    'File Upload',
    'FileUploadHandler',
    'v1.0',
    
    'User uploaded file: fordatabasesgp.xlsx (166 KB)',
    
    'The system received an Excel file upload request. The file was validated for:
    1. File type (must be .xlsx or .xls)
    2. File size (max 50MB)
    3. File integrity (not corrupted)
    4. User permissions (user has access to SGP company)
    The file was stored temporarily and assigned a unique upload ID.',
    
    'File successfully stored at: /tmp/uploads/fordatabasesgp_[hash].xlsx
    Upload ID: upload_2025_12_29_14_30_00
    Ready for parsing',
    
    'handleFileUpload()',
    JSON '{"filename": "fordatabasesgp.xlsx", "size_bytes": 169984, "user_id": "user_123", "company": "socar_petroleum"}',
    
    1, 0, 0, 0,
    
    ['File type check', 'File size check', 'Virus scan', 'User authorization'],
    [],
    [],
    
    150,
    2.5,
    
    'success',
    'File uploaded successfully',
    
    TIMESTAMP('2025-12-29 14:30:00'),
    TIMESTAMP('2025-12-29 14:30:00.150'),
    
    'The user uploaded a financial data file for SOCAR Georgia Petroleum (SGP). The system checked that the file is valid and the user has permission to upload data for this company. Everything passed, so we can proceed to the next step.',
    
    'AI Note: When explaining file upload to users, mention: (1) what file they uploaded, (2) that security checks passed, (3) that the file is being processed for their specific company (SGP in this case).'
);

-- Step 2: Excel Parsing
INSERT INTO `sgp_financial_intelligence.processing_pipeline` VALUES (
    'pipeline_2025_12_run_001',
    'upload_2025_12_29_14_30_00',
    'socar_petroleum',
    '2025-12',
    
    2,
    'Parse Excel Sheets',
    'IntelligentExcelParser',
    'v2.1',
    
    'Input: fordatabasesgp.xlsx with 4 sheets',
    
    'The Intelligent Excel Parser is a SMART parser that does NOT rely on fixed column positions. Here is how it works:

    1. SHEET DETECTION (Semantic Matching):
       - Looks for sheets by NAME, not position
       - Searches for: "Revenue Breakdown" (or similar names like "Revenue", "შემოსავალი")
       - Searches for: "COGS Breakdown" (or "COGS", "თვითღირებულება", "Себестоимость")
       - Searches for: "Base" (or "Transactions", "Expenses")
       
    2. HEADER DETECTION (Automatic Row Finding):
       - Does NOT assume headers are in row 1
       - Scans first 5 rows to find the row with MOST text values (not numbers)
       - This row is identified as the header row
       - Found headers in this file: Row 1 for all sheets
       
    3. COLUMN MAPPING (Position-Independent):
       - Does NOT use column letters (A, B, C...)
       - Instead, searches for column by MEANING:
         * "Product" column: searches for headers containing "Product", "პროდუქტი", "Субконто"
         * "Net Revenue" column: searches for "Net Revenue", "წმინდა შემოსავალი", "Чистая выручка"
         * "Account 6" column: searches for header that is exactly "6" (a number)
       - If column order changes, parser STILL finds correct columns!
       
    4. DATA EXTRACTION:
       For each sheet, extract all rows after header:
       - Revenue Breakdown: Found 39 products with revenue data
       - COGS Breakdown: Found 26 products with COGS data  
       - Base: Found 596 transaction records
       
    5. MULTI-LANGUAGE SUPPORT:
       - Georgian (ქართული): ევრო რეგულარი, დიზელი
       - English: Euro Regular, Diesel
       - Russian (русский): Субконто, Сумма
       All three languages recognized and processed correctly.',
    
    'Successfully parsed 3 sheets:
    - Revenue Breakdown: 39 records
    - COGS Breakdown: 26 records
    - Base: 596 records
    Total: 661 raw records ready for classification',
    
    'parseFinancialFile()',
    JSON '{"file_path": "/tmp/uploads/fordatabasesgp_[hash].xlsx", "company_config": {"revenue_sheet": "Revenue Breakdown", "cogs_sheet": "COGS Breakdown", "expense_sheet": "Base"}}',
    
    661, 661, 0, 0,
    
    ['Sheet existence check', 'Header detection', 'Column mapping', 'Data type validation'],
    ['Sheet "Budget (2)" found but not used - this is summary data, not source data'],
    [],
    
    2350,
    45.2,
    
    'success',
    'All sheets parsed successfully',
    
    TIMESTAMP('2025-12-29 14:30:00.150'),
    TIMESTAMP('2025-12-29 14:30:02.500'),
    
    'The system opened your Excel file and read all the financial data. It found three important sheets: one with revenue information (39 products), one with cost information (26 products), and one with all transaction details (596 transactions). The parser is smart - it found the correct columns even though your file might have them in different positions than other files. It also understood that some columns are in Georgian, some in English, and some in Russian.',
    
    'AI Note: The Intelligent Parser is the KEY differentiator. Emphasize to users: (1) It works with ANY column order, (2) It finds data by MEANING not position, (3) It handles multiple languages, (4) It adapts to different file structures. This is why the system can process ANY Excel file, not just a specific template.'
);

-- Step 3: Product Classification
INSERT INTO `sgp_financial_intelligence.processing_pipeline` VALUES (
    'pipeline_2025_12_run_001',
    'upload_2025_12_29_14_30_00',
    'socar_petroleum',
    '2025-12',
    
    3,
    'Classify Products',
    'ProductClassificationEngine',
    'v1.5',
    
    'Input: 39 revenue products from Revenue Breakdown',
    
    'The Product Classification Engine uses SGP-SPECIFIC BUSINESS RULES to categorize each product. These rules come from the Word document you provided.

    CLASSIFICATION LOGIC:
    
    1. WHOLESALE vs RETAIL Detection:
       Rule: Look at product name and unit of measure
       
       WHOLESALE Indicators:
       - Name contains: "(საბითუმო)" = wholesale in Georgian
       - Name contains: "(იმპორტი)" = import
       - Name contains: "(ექსპორტი)" = export  
       - Name contains: "(რეექსპორტი)" = re-export
       - Unit is "კგ" (kg) for petroleum = typically wholesale
       
       RETAIL Indicators:
       - Name does NOT contain wholesale suffixes
       - Unit is "ლ" (liters) for petroleum = typically retail
       - Unit is "მ3" (cubic meters) for gas = retail
       - Has VAT amount (domestic retail sales have VAT)
       
    2. PRODUCT TYPE Detection:
       
       PETROL Products:
       - Name contains: "ევრო რეგულარი", "პრემიუმი", "სუპერი", "regular", "premium", "super"
       
       DIESEL Products:
       - Name contains: "დიზელი", "ევროდიზელი", "diesel", "eurodiesel"
       
       BITUMEN Products:
       - Name contains: "ბიტუმი", "bitumen"
       
       CNG Products (Compressed Natural Gas):
       - Name contains: "ბუნებრივი აირი", "natural gas"
       - Unit is "მ3" (cubic meters)
       
       LPG Products (Liquefied Petroleum Gas):
       - Name contains: "თხევადი აირი", "liquid gas"
       - ONLY exists in SGP, not in SGG!
       
       OTHER:
       - Name contains: "მომსახურება" (service)
       - Or anything else that doesn\'t match above
       
    3. LINE ITEM ASSIGNMENT:
       Based on wholesale/retail + product type, assign to correct financial line:
       
       Examples:
       - "ევრო რეგულარი (იმპორტი), კგ" → revenue_whsale_petrol
       - "დიზელი, ლ" → revenue_retail_diesel
       - "ბუნებრივი აირი, მ3" → revenue_retail_cng
       - "BP გადაზიდვის ღირებულება" → other_revenue
       
    RESULTS FOR THIS FILE:
    - Wholesale Products: 6 (3 petrol, 2 diesel, 1 bitumen)
    - Retail Products: 14 (3 petrol, 2 diesel, 2 CNG, 1 LPG, 6 other)
    - Other Revenue: 19 (services, rent, electricity, etc.)',
    
    'Classified 39 products:
    - 6 wholesale (revenue_whsale_*)
    - 14 retail (revenue_retail_*)
    - 19 other (other_revenue)
    
    All products mapped to correct financial statement line items per SGP accounting structure.',
    
    'classifyProducts()',
    JSON '{"company": "socar_petroleum", "classification_rules": "product_classifications table", "language_support": ["georgian", "english", "russian"]}',
    
    39, 39, 0, 0,
    
    ['Product name pattern matching', 'Unit of measure validation', 'Business rule application'],
    ['3 products matched multiple patterns - used most specific rule'],
    [],
    
    450,
    12.1,
    
    'success',
    'All products classified successfully',
    
    TIMESTAMP('2025-12-29 14:30:02.500'),
    TIMESTAMP('2025-12-29 14:30:02.950'),
    
    'The system analyzed each product and figured out what type it is. For example, "ევრო რეგულარი (იმპორტი), კგ" was identified as WHOLESALE PETROL because it says "import" and uses kilograms (bulk sale). On the other hand, "დიზელი, ლ" was identified as RETAIL DIESEL because it doesn\'t say wholesale and uses liters (sold at gas stations). Out of 39 products, 6 are wholesale, 14 are retail petroleum products, and 19 are other income (like services, rent, etc.).',
    
    'AI Note: Explain classification as BUSINESS LOGIC, not just technical rules. Help users understand WHY a product is classified a certain way: (1) What clues in the name indicate wholesale vs retail? (2) Why does unit of measure matter? (3) How does this connect to how the business actually operates? Make it relatable to their day-to-day operations.'
);
```

---

**[FILE CONTINUES - This is Part 1 of comprehensive BigQuery schema]**

The file is very long. Let me create the complete schema with all tables. Should I continue with the remaining tables?

