-- Brain 2 Health: Institutional Memory Quality Dashboard
WITH feedback_metrics AS (
  SELECT 
    COUNT(*) as total_queries,
    COUNTIF(was_corrected = TRUE) as total_corrections,
    AVG(feedback_score) as avg_sentiment,
    COUNTIF(feedback_score <= 2) as retrain_signals
  FROM `studio-9381016045-4d625.sgp_financial_intelligence.ai_feedback_loop`
),
pipeline_metrics AS (
  SELECT 
    AVG(TIMESTAMP_DIFF(processing_timestamp, processing_timestamp, MILLISECOND)) as avg_latency, -- Placeholder for actual delta logic
    COUNTIF(status = 'FAILED') as failure_count
  FROM `studio-9381016045-4d625.sgp_financial_intelligence.processing_pipeline`
)
SELECT 
  -- Learning Rate: High % means the AI is adapting well to human oversight
  SAFE_DIVIDE(total_queries - total_corrections, total_queries) * 100 as learning_accuracy_pct,
  avg_sentiment as oracle_trust_score,
  retrain_signals as neural_drift_warnings,
  failure_count as infrastructure_leaks
FROM feedback_metrics, pipeline_metrics;
