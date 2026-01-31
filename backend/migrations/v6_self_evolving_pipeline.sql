-- PHASE 4: Self-Evolving Intelligence

-- 1. AI Training Examples (Permanent Memory)
-- Stores successfully verified logic for future training/RAG.
CREATE TABLE IF NOT EXISTS `studio-9381016045-4d625.sgp_financial_intelligence.ai_training_examples` (
    example_id STRING,
    example_category STRING, -- 'Evolution', 'Manual', etc.
    user_query STRING,
    ai_response STRING,
    processing_steps ARRAY<STRING>,
    requires_data ARRAY<STRING>,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Refined SGP Regex Patterns (Fuzzy-Aware & Georgian)
-- Seeding registry with robust patterns. Using MERGE for idempotency.
MERGE `studio-9381016045-4d625.sgp_financial_intelligence.regex_registry` T
USING (
    SELECT 'seed_v2' as run_id, 'REVENUE_WHOLESALE' as concept_name, r'დ[ი]?ზელ[ი]?\s*\(საბითუმო\)' as regex_pattern, 10 as priority UNION ALL
    SELECT 'seed_v2', 'REVENUE_RETAIL', r'^დ[ი]?ზელ[ი]?$', 10 UNION ALL
    SELECT 'seed_v2', 'REVENUE_WHOLESALE', r'ევრო\s*რეგულარ[ი]?\s*\(იმპორტი\)', 10 UNION ALL
    SELECT 'seed_v2', 'REVENUE_RETAIL', r'^ევრო\s*რეგულარ[ი]?$', 10 UNION ALL
    SELECT 'seed_v2', 'REVENUE_CNG', r'ბუნებრივ[ი]?\s*აირ[ი]?', 10 UNION ALL
    SELECT 'seed_v2', 'OTHER_REVENUE', r'ტრანზიტულ[ი]?\s*ბარათ[ი]?ს?|ტრანზიტული\s*ბარათები', 10
) S
ON T.regex_pattern = S.regex_pattern 
WHEN NOT MATCHED THEN
    INSERT (run_id, concept_name, regex_pattern, priority)
    VALUES (S.run_id, S.concept_name, S.regex_pattern, S.priority);

-- 3. Universal Segment Report (Gold Layer)
-- Auto-categorization view joining Raw Data with Regex Registry.
CREATE OR REPLACE VIEW `studio-9381016045-4d625.sgp_financial_intelligence.v_universal_segment_report` AS
WITH raw_json AS (
  SELECT 
    run_id,
    JSON_VALUE(payload.Product) as raw_product_name,
    SAFE_CAST(JSON_VALUE(payload.Net_Revenue) AS FLOAT64) as net_revenue,
    ingested_at
  FROM `studio-9381016045-4d625.sgp_financial_intelligence.universal_intelligence`
)
SELECT 
  r.run_id,
  r.raw_product_name,
  COALESCE(regex.concept_name, 'UNCATEGORIZED') as finance_concept,
  r.net_revenue,
  r.ingested_at
FROM raw_json r
LEFT JOIN `studio-9381016045-4d625.sgp_financial_intelligence.regex_registry` regex
  ON REGEXP_CONTAINS(LOWER(r.raw_product_name), regex.regex_pattern)
  AND regex.is_active = TRUE;
