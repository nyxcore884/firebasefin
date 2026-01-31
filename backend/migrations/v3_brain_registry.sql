-- Migration Script: Brain Registry (The Universal Truth)

-- 1. Create Registry Dataset
CREATE SCHEMA IF NOT EXISTS `studio-9381016045-4d625.registry`;

-- 2. Semantic Map Table
-- Stores the "thoughts" of Brain 2 about what the data means.
CREATE TABLE IF NOT EXISTS `studio-9381016045-4d625.registry.semantic_map` (
    run_id STRING,
    physical_column_name STRING, -- e.g., "Amount Gel", "თანხა"
    semantic_concept STRING,     -- e.g., "gross_revenue", "product_name", "vat_amount"
    data_type STRING,            -- e.g., "FLOAT64", "STRING"
    category_group STRING,       -- e.g., "Wholesale", "Retail" (if applicable)
    confidence_score FLOAT64,    -- AI confidence in this mapping
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
