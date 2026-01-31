-- PHASE 3: Institutional Knowledge Bridge

-- 1. SGP Regex Registry (Conceptual Mapping)
-- Stores the rules for mapping raw product names to financial buckets.
CREATE TABLE IF NOT EXISTS `studio-9381016045-4d625.sgp_financial_intelligence.regex_registry` (
    id STRING DEFAULT GENERATE_UUID(),
    run_id STRING,               
    concept_name STRING,         
    regex_pattern STRING,        
    priority INT64 DEFAULT 10,   
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Data (SGP Protocol)
-- Using MERGE to avoid duplicates if re-run
MERGE `studio-9381016045-4d625.sgp_financial_intelligence.regex_registry` T
USING (
    SELECT 'seed' as run_id, 'REVENUE_WHOLESALE' as concept_name, '(?i)wholesale|diesel' as regex_pattern, 10 as priority UNION ALL
    SELECT 'seed', 'REVENUE_RETAIL', '(?i)retail|petrol', 10 UNION ALL
    SELECT 'seed', 'REVENUE_CNG', '(?i)cng', 10 UNION ALL
    SELECT 'seed', 'REVENUE_TRANSIT', '(?i)transit|card', 10
) S
ON T.concept_name = S.concept_name
WHEN NOT MATCHED THEN
    INSERT (run_id, concept_name, regex_pattern, priority)
    VALUES (S.run_id, S.concept_name, S.regex_pattern, S.priority);

-- 2. Retrain Signal (Self-Learning Loop)
-- A view that constantly watches for high-quality feedback to propose retraining candidates.
-- Explicitly selecting columns to avoid ambiguity
CREATE OR REPLACE VIEW `studio-9381016045-4d625.sgp_financial_intelligence.v_retrain_candidates` AS
SELECT
    f.feedback_id,
    f.run_id,
    f.user_query,
    f.ai_response,
    f.rating,
    f.user_comment,
    f.created_at,
    p.human_readable_explanation as logic_context
FROM
    `studio-9381016045-4d625.sgp_financial_intelligence.ai_feedback_loop` f
JOIN
    `studio-9381016045-4d625.sgp_financial_intelligence.processing_pipeline_v2` p
ON
    f.run_id = p.run_id
WHERE
    f.rating >= 5
    AND p.status = 'SUCCESS';
