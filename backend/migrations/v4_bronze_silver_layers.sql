-- BRONZE LAYER: Schema-less Landing Zone
-- This table accepts ANY excel format by storing the row as a JSON object.
CREATE TABLE IF NOT EXISTS `studio-9381016045-4d625.sgp_financial_intelligence.universal_intelligence` (
    run_id STRING,           -- Link to the Pipeline Run
    org_id STRING,           -- 'SGP', 'SGG', etc.
    sheet_name STRING,       -- e.g., 'Revenue breakdown'
    payload JSON,            -- THE RAW DATA ROW (Key-Value pairs)
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SILVER LAYER: Semantic Mapping Registry
-- This stores Brain 2's "thoughts" on what the messy columns actually mean.
CREATE TABLE IF NOT EXISTS `studio-9381016045-4d625.sgp_financial_intelligence.semantic_map` (
    run_id STRING,
    physical_header STRING,  -- e.g., 'თანხა' or '1C'
    semantic_concept STRING, -- e.g., 'net_revenue'
    data_type STRING,        -- e.g., 'FLOAT64'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
