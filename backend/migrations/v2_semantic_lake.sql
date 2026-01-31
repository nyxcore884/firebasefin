-- Migration Script: Semantic Data Lake (Brain 3)

-- 1. Create Datasets
CREATE SCHEMA IF NOT EXISTS `studio-9381016045-4d625.raw_data`;
CREATE SCHEMA IF NOT EXISTS `studio-9381016045-4d625.refined_data`;

-- 2. Universal Intelligence Landing Zone (JSON)
-- Schema-less ingestion to prevent crashes on column changes.
CREATE TABLE IF NOT EXISTS `studio-9381016045-4d625.raw_data.universal_intelligence` (
    run_id STRING,           -- Brain 3 ID
    sheet_name STRING,       -- 'Summary', 'Breakdown', or 'Base'
    org_id STRING,           -- SGP
    payload JSON,            -- THE DYNAMIC DATA
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. The "Thinking" Dynamic View Engine
-- Encapsulates business logic in SQL, not code.
CREATE OR REPLACE VIEW `studio-9381016045-4d625.refined_data.v_sgp_thinking_engine` AS
SELECT 
    JSON_VALUE(payload.product) as product_name,
    
    -- Rule: SGP Logic says Net Revenue = Amount - VAT (if implied, but here we cast raw fields)
    SAFE_CAST(JSON_VALUE(payload.amount_gel) AS FLOAT64) as gross_amount,
    SAFE_CAST(JSON_VALUE(payload.net_revenue) AS FLOAT64) as net_revenue,

    -- Finance Awareness: Automatically classify based on 'q' column if exists
    JSON_VALUE(payload.q) as finance_category,

    -- Forensic Rule: Flag if product is 'Euro Regular (Import)' -> Wholesale
    CASE 
        WHEN JSON_VALUE(payload.product) LIKE '%იმპორტი%' THEN 'Wholesale'
        ELSE 'Retail'
    END as logic_segment,
    
    run_id,
    org_id,
    ingested_at
FROM `studio-9381016045-4d625.raw_data.universal_intelligence`
WHERE sheet_name = 'Revenue breakdown';
