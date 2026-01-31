-- BIGQUERY DDL (FINAL, READY TO RUN)
-- Dataset
CREATE SCHEMA IF NOT EXISTS finance_core;

-- Table: finance_core.revenue_breakdown
CREATE TABLE IF NOT EXISTS finance_core.revenue_breakdown (
  entity_id STRING NOT NULL,
  period DATE NOT NULL,
  product STRING,
  amount_gel NUMERIC,
  vat NUMERIC,
  net_revenue NUMERIC,
  revenue_type STRING, -- Revenue Wholesale | Revenue Retail | Other Revenue
  source_file STRING,
  load_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY period;

-- Table: finance_core.cogs_breakdown
CREATE TABLE IF NOT EXISTS finance_core.cogs_breakdown (
  entity_id STRING NOT NULL,
  period DATE NOT NULL,
  product STRING,
  cost_amount NUMERIC,
  cogs_type STRING, -- COGS Wholesale | COGS Retail
  source_file STRING,
  load_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY period;

-- Table: finance_core.income_statement
CREATE TABLE IF NOT EXISTS finance_core.income_statement (
  entity_id STRING NOT NULL,
  period DATE NOT NULL,

  revenue_wholesale NUMERIC,
  revenue_retail NUMERIC,
  other_revenue NUMERIC,
  total_revenue NUMERIC,

  cogs_wholesale NUMERIC,
  cogs_retail NUMERIC,
  total_cogs NUMERIC,

  gross_profit NUMERIC,

  calculation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY period;
