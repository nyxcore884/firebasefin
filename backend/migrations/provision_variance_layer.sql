-- BIGQUERY DDL (BUDGET + VARIANCE)
-- Table: finance_core.budget_fact
CREATE TABLE IF NOT EXISTS finance_core.budget_fact (
  entity_id STRING NOT NULL,
  period DATE NOT NULL,
  metric STRING NOT NULL,        -- revenue_wholesale, total_revenue, gross_profit, etc.
  budget_amount NUMERIC NOT NULL,
  source_file STRING,
  load_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY period;

-- Table: finance_core.variance_fact
CREATE TABLE IF NOT EXISTS finance_core.variance_fact (
  entity_id STRING NOT NULL,
  period DATE NOT NULL,
  metric STRING NOT NULL,

  actual_amount NUMERIC,
  budget_amount NUMERIC,

  variance_abs NUMERIC,      -- Actual - Budget
  variance_pct NUMERIC,      -- (Actual - Budget) / Budget

  status STRING,             -- Favorable / Unfavorable
  calculation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY period;
