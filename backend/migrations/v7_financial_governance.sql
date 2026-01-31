-- PHASE 5: Financial Governance & Forensics

-- 1. Semantic Versioning (Logic Safety)
-- Upgrade Training Table for Versioning.
-- BQ workaround: Add column first, then set default for future, then update existing.
ALTER TABLE `studio-9381016045-4d625.sgp_financial_intelligence.ai_training_examples`
ADD COLUMN IF NOT EXISTS logic_version INT64;

ALTER TABLE `studio-9381016045-4d625.sgp_financial_intelligence.ai_training_examples`
ALTER COLUMN logic_version SET DEFAULT 1;

UPDATE `studio-9381016045-4d625.sgp_financial_intelligence.ai_training_examples`
SET logic_version = 1
WHERE logic_version IS NULL;


ALTER TABLE `studio-9381016045-4d625.sgp_financial_intelligence.ai_training_examples`
ADD COLUMN IF NOT EXISTS is_active BOOLEAN;

ALTER TABLE `studio-9381016045-4d625.sgp_financial_intelligence.ai_training_examples`
ALTER COLUMN is_active SET DEFAULT TRUE;

UPDATE `studio-9381016045-4d625.sgp_financial_intelligence.ai_training_examples`
SET is_active = TRUE
WHERE is_active IS NULL;


ALTER TABLE `studio-9381016045-4d625.sgp_financial_intelligence.ai_training_examples`
ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMP;


-- View: The 'Current Brain' (Always use the latest active logic)
CREATE OR REPLACE VIEW `studio-9381016045-4d625.sgp_financial_intelligence.v_active_intelligence_patterns` AS
SELECT * EXCEPT(is_active)
FROM `studio-9381016045-4d625.sgp_financial_intelligence.ai_training_examples`
WHERE is_active = TRUE;

-- 2. Margin Impact Analysis (Forensic)
-- Joins Revenue (Segment View) with COGS (Universal)
CREATE OR REPLACE VIEW `studio-9381016045-4d625.sgp_financial_intelligence.v_forensic_margin_analysis` AS
WITH revenue_summary AS (
  SELECT 
    finance_concept,
    raw_product_name as product,
    SUM(net_revenue) as total_revenue,
    MAX(ingested_at) as latest_ingest
  FROM `studio-9381016045-4d625.sgp_financial_intelligence.v_universal_segment_report`
  GROUP BY 1, 2
),
cogs_summary AS (
  SELECT 
    JSON_VALUE(payload.Product) as product,
    SUM(SAFE_CAST(JSON_VALUE(payload.Total_COGS) AS FLOAT64)) as total_cogs,
    SUM(CASE WHEN JSON_VALUE(payload.Account) LIKE '%8220%' THEN SAFE_CAST(JSON_VALUE(payload.Total_COGS) AS FLOAT64) ELSE 0 END) as fx_cogs
  FROM `studio-9381016045-4d625.sgp_financial_intelligence.universal_intelligence`
  WHERE sheet_name = 'COGS Breakdown' OR JSON_VALUE(payload.sheet_name) = 'COGS Breakdown'
  GROUP BY 1
)
SELECT 
  r.finance_concept,
  r.product,
  r.total_revenue,
  COALESCE(c.total_cogs, 0) as total_cogs,
  (r.total_revenue - COALESCE(c.total_cogs, 0)) as net_margin,
  SAFE_DIVIDE(r.total_revenue - COALESCE(c.total_cogs, 0), r.total_revenue) as margin_pct,
  COALESCE(c.fx_cogs, 0) as fx_leakage_lari,
  CASE 
    WHEN (r.total_revenue - COALESCE(c.total_cogs, 0)) < 0 THEN '🔴 MARGIN EROSION'
    WHEN SAFE_DIVIDE(r.total_revenue - COALESCE(c.total_cogs, 0), r.total_revenue) < 0.05 THEN '🟡 THIN MARGIN'
    ELSE '🟢 PROFITABLE'
  END as performance_status,
  r.latest_ingest as ingested_at
FROM revenue_summary r
LEFT JOIN cogs_summary c ON r.product = c.product;

-- 3. Recursive Root Cause (Helper View for Trends)
CREATE OR REPLACE VIEW `studio-9381016045-4d625.sgp_financial_intelligence.v_recursive_root_cause` AS
SELECT
    *,
    CASE 
        WHEN performance_status = '🔴 MARGIN EROSION' AND fx_leakage_lari > 0 THEN 'FOREX_DRIVEN'
        WHEN performance_status = '🔴 MARGIN EROSION' THEN 'COST_INCREASE_GENERIC'
        WHEN performance_status = '🟡 THIN MARGIN' THEN 'PRICING_PRESSURE'
        ELSE 'STABLE'
    END as root_cause_category,
    SAFE_DIVIDE(fx_leakage_lari, total_cogs) as fx_responsibility_ratio
FROM `studio-9381016045-4d625.sgp_financial_intelligence.v_forensic_margin_analysis`;

-- 4. Snapshot Comparisons (90-Day Trend)
CREATE OR REPLACE VIEW `studio-9381016045-4d625.sgp_financial_intelligence.v_root_cause_trend_90d` AS
WITH monthly_causes AS (
  SELECT 
    DATE_TRUNC(DATE(ingested_at), MONTH) as analysis_month,
    root_cause_category,
    COUNT(*) as incident_count,
    SUM(fx_leakage_lari) as total_fx_impact
  FROM `studio-9381016045-4d625.sgp_financial_intelligence.v_recursive_root_cause`
  WHERE ingested_at > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)
  GROUP BY 1, 2
)
SELECT 
  analysis_month,
  root_cause_category,
  incident_count,
  total_fx_impact,
  LAG(incident_count) OVER (PARTITION BY root_cause_category ORDER BY analysis_month) as prev_month_incidents,
  SAFE_DIVIDE(incident_count - LAG(incident_count) OVER (PARTITION BY root_cause_category ORDER BY analysis_month), 
              LAG(incident_count) OVER (PARTITION BY root_cause_category ORDER BY analysis_month)) * 100 as growth_pct
FROM monthly_causes
ORDER BY analysis_month DESC, total_fx_impact DESC;
