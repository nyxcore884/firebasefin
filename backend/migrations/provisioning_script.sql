-- Migration Script: FinSight Enterprise Initialization
CREATE SCHEMA IF NOT EXISTS `studio-9381016045-4d625.sgp_financial_intelligence`;

CREATE TABLE IF NOT EXISTS `studio-9381016045-4d625.sgp_financial_intelligence.processing_pipeline` (
    run_id STRING,
    step_name STRING,
    status STRING,
    human_readable_explanation STRING,
    engine_name STRING,
    processing_timestamp TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `studio-9381016045-4d625.sgp_financial_intelligence.ai_feedback_loop` (
    request_id STRING,
    user_query STRING,
    user_comment STRING,
    feedback_score INT64,
    was_corrected BOOLEAN,
    query_embedding ARRAY<FLOAT64>,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
