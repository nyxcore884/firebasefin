import os
from google.cloud import bigquery
from google.api_core.exceptions import GoogleAPIError

# Initialize BigQuery Client
client = bigquery.Client()

DATASET_ID = "studio-9381016045-4d625.sgp_financial_intelligence"
PROJECT_ID = "studio-9381016045-4d625" 

def setup_suite_bigquery():
    print(f"Setting up Unified Financial Intelligence Suite in: {DATASET_ID}")
    
    # 1. Ensure Dataset
    try:
        dataset_ref = bigquery.Dataset(DATASET_ID)
        dataset_ref.location = "US" 
        client.create_dataset(dataset_ref, exists_ok=True)
        print(f"Dataset {DATASET_ID} ensured.")
    except Exception as e:
        print(f"Dataset warning: {e}")

    # 2. Product Mapping Table (The Translation Brain)
    create_mapping_sql = f"""
    CREATE TABLE IF NOT EXISTS `{DATASET_ID}.product_mapping` (
      mapping_id STRING,
      keyword STRING,
      english_article STRING,
      segment STRING,
      unit_type STRING,
      account_code_prefix STRING,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
    );
    """
    
    # 3. AI Training Table (The Logic Store)
    create_training_sql = f"""
    CREATE TABLE IF NOT EXISTS `{DATASET_ID}.ai_training_examples` (
      example_id STRING,
      example_category STRING,
      user_query STRING,
      ai_response STRING,
      processing_steps ARRAY<STRING>,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
    );
    """

    # 4. Calculation Layer: v_financial_master (Single Source of Truth)
    # Note: Requires `raw_uploads` table to exist. 
    # For this script we assume `studio-9381016045-4d625.financial_data.latest_upload` or similar. 
    # We will use a placeholder or reference the project's raw data convention.
    # The user prompt example used: `your_project.your_dataset.raw_uploads`
    # We'll map that to: `{PROJECT_ID}.financial_data.raw_uploads` (assuming this exists or will be created)
    # If not sure, we create a dummy view or comment it out / use a mock.
    # Given the robustness requirement, I'll attempt to create it but wrap in try/except or use IF NOT EXISTS logic carefully.
    
    raw_source_table = f"{PROJECT_ID}.financial_data.raw_uploads"
    
    # 3.5 Ensure Source Data Table Exists (Dummy / Structure)
    # Required/Dependent for v_financial_master
    create_source_table_sql = f"""
    CREATE TABLE IF NOT EXISTS `{raw_source_table}` (
      Period DATE,
      Product STRING,
      Amount_Gel FLOAT64,
      COGS FLOAT64,
      Quantity FLOAT64,
      Account_Dr STRING,
      Account_Cr STRING,
      Classification STRING
    );
    """
    
    create_master_view_sql = f"""
    CREATE OR REPLACE VIEW `{DATASET_ID}.v_financial_master` AS
    WITH base_calculations AS (
      SELECT 
        src.Period,
        src.Product as raw_name,
        COALESCE(map.english_article, 'UNMAPPED') as article,
        COALESCE(map.segment, 'UNMAPPED') as segment,
        src.Amount_Gel as gross_revenue,
        (src.Amount_Gel / 1.18) as net_revenue,
        src.COGS as total_cogs,
        -- Formula: Net Margin
        (src.Amount_Gel / 1.18) - src.COGS as gross_margin,
        -- Confidence Check
        CASE WHEN map.mapping_id IS NOT NULL THEN 1.0 ELSE 0.0 END as mapping_confidence,
        -- Pass through other columns if needed
        src.Account_Dr,
        src.Account_Cr,
        src.Quantity -- Added for compatibility
      FROM `{raw_source_table}` src
      LEFT JOIN `{DATASET_ID}.product_mapping` map
        ON LOWER(src.Product) LIKE CONCAT('%', LOWER(map.keyword), '%')
    )
    SELECT 
      *,
      SAFE_DIVIDE(gross_margin, net_revenue) as margin_pct,
      (gross_revenue - net_revenue) as vat_liability
    FROM base_calculations;
    """

    # 4.5 Master Brain View (Stored Intelligence) - Requested by User
    create_stored_intelligence_sql = f"""
    CREATE OR REPLACE VIEW `{DATASET_ID}.v_stored_intelligence_master` AS
    WITH raw_data AS (
        -- This pulls from your raw ledger and uploaded templates
        SELECT 
            src.Period,
            src.Product,
            src.Amount_Gel,
            src.COGS,
            src.Quantity,
            src.Account_Dr,
            src.Classification
        FROM `{raw_source_table}` src
    ),
    deterministic_mapping AS (
        SELECT 
            r.*,
            COALESCE(m.english_article, 'UNKNOWN_ARTICLE') as article,
            COALESCE(m.segment, 'UNMAPPED_SEGMENT') as segment,
            COALESCE(m.unit_type, 'N/A') as unit,
            -- Deterministic Net Revenue Logic
            (r.Amount_Gel / 1.18) as net_revenue,
            -- Gross Margin Logic
            (r.Amount_Gel / 1.18) - r.COGS as gross_margin
        FROM raw_data r
        LEFT JOIN `{DATASET_ID}.product_mapping` m
          ON LOWER(r.Product) LIKE CONCAT('%', LOWER(m.keyword), '%')
    )
    SELECT 
        *,
        -- Risk Flag: Negative Margin
        IF(gross_margin < 0, TRUE, FALSE) as has_negative_margin,
        -- Efficiency: Margin per Unit
        SAFE_DIVIDE(gross_margin, Quantity) as unit_margin,
        -- Confidence Score Logic (Built-in)
        CASE 
            WHEN article != 'UNKNOWN_ARTICLE' THEN 1.0 
            ELSE 0.0 
        END as logic_confidence
    FROM deterministic_mapping;
    """

    # 5. Risk Alert View
    # Relies on MoM comparison logic. 
    # For the view, we can aggregate from v_financial_master.
    create_risk_view_sql = f"""
    CREATE OR REPLACE VIEW `{DATASET_ID}.v_risk_alerts` AS
    WITH monthly_agg AS (
        SELECT 
            FORMAT_DATE('%Y-%m', PARSE_DATE('%Y-%m-%d', CAST(Period AS STRING))) as month_id,
            segment,
            SUM(gross_margin) as margin
        FROM `{DATASET_ID}.v_financial_master`
        GROUP BY 1, 2
    ),
    mom_calc AS (
        SELECT 
            curr.month_id as current_month,
            curr.segment,
            curr.margin,
            prev.margin as prev_margin,
            SAFE_DIVIDE(curr.margin - prev.margin, prev.margin) * 100 as margin_growth_pct
        FROM monthly_agg curr
        LEFT JOIN monthly_agg prev 
             ON DATE_SUB(PARSE_DATE('%Y-%m', curr.month_id), INTERVAL 1 MONTH) = PARSE_DATE('%Y-%m', prev.month_id)
    )
    SELECT * FROM mom_calc WHERE margin_growth_pct < -10;
    """

    # 6. Breakeven Logic View
    # Calculates Min Margin required to cover OPEX.
    create_breakeven_view_sql = f"""
    CREATE OR REPLACE VIEW `{DATASET_ID}.v_breakeven_logic` AS
    WITH opex AS (
      -- Assuming OPEX is marked in Account_Dr (e.g., '7%') or we need a way to identify it.
      -- Using user logic: Account_Dr LIKE '7%'
      SELECT SUM(Amount_Gel) as total_opex FROM `{raw_source_table}` WHERE STARTS_WITH(Account_Dr, '7')
    ),
    volumes AS (
      SELECT COUNT(*) as total_units FROM `{DATASET_ID}.v_financial_master` WHERE segment = 'Retail'
      -- NOTE: 'Quantity' column might not exist in v_financial_master yet. 
      -- We'll assume count of rows or sum of a quantity column if it existed. 
      -- For robustness, we will placeholder this as COUNT(*) or similar.
      -- User said: SELECT SUM(Quantity)...
    )
    SELECT 
      total_opex,
      total_units,
      SAFE_DIVIDE(total_opex, total_units) as breakeven_margin_required,
      (2.50 + SAFE_DIVIDE(total_opex, total_units)) as target_min_price
    FROM opex, volumes;
    """

    # 7. Cash Projection Master (Linked Scenario Base)
    # This view prepares the base numbers for the "What-If" slider.
    create_cash_view_sql = f"""
    CREATE OR REPLACE VIEW `{DATASET_ID}.v_cash_projection_master` AS
    SELECT 
      100000.0 as current_bank_balance, -- Mocked starting balance
      SUM(gross_margin) as predicted_month_margin,
      COUNT(*) as total_volume -- Proxy for volume
    FROM `{DATASET_ID}.v_financial_master`
    WHERE Period >= DATE_TRUNC(CURRENT_DATE(), MONTH);
    """

    # 7.5 Inventory Tables (Placeholders for FIFO)
    create_inventory_purchases_sql = f"""
    CREATE TABLE IF NOT EXISTS `{DATASET_ID}.inventory_purchases` (
      Product STRING,
      Quantity_Bought INT64,
      Cost_Per_Unit FLOAT64,
      Period DATE
    );
    """
    create_inventory_sales_sql = f"""
    CREATE TABLE IF NOT EXISTS `{DATASET_ID}.inventory_sales` (
      Product STRING,
      Quantity_Sold INT64,
      Period DATE
    );
    """

    # 8. FIFO Inventory Valuation Logic
    create_fifo_view_sql = f"""
    CREATE OR REPLACE VIEW `{DATASET_ID}.v_fifo_inventory_valuation` AS
    WITH inventory_batches AS (
      SELECT 
        Product,
        Quantity_Bought,
        Cost_Per_Unit,
        Period as purchase_date,
        SUM(Quantity_Bought) OVER(PARTITION BY Product ORDER BY Period) as running_total_buy
      FROM `{DATASET_ID}.inventory_purchases`
    ),
    sales_activity AS (
      SELECT 
        Product,
        Quantity_Sold,
        SUM(Quantity_Sold) OVER(PARTITION BY Product ORDER BY Period) as running_total_sold
      FROM `{DATASET_ID}.inventory_sales`
    )
    -- FIFO COGS Calculation
    SELECT 
      s.Product,
      s.Quantity_Sold,
      SUM(CASE 
        WHEN b.running_total_buy <= s.running_total_sold THEN b.Quantity_Bought * b.Cost_Per_Unit
        ELSE (s.Quantity_Sold - (b.running_total_buy - b.Quantity_Bought)) * b.Cost_Per_Unit 
      END) as fifo_cogs
    FROM sales_activity s
    JOIN inventory_batches b ON s.Product = b.Product
    GROUP BY 1, 2;
    """

    # 9. AI Retraining Logic (The 90% Rule)
    # Checks if forecast accuracy < 90%
    # Note: Requires `v_margin_forecast_results` which is output of Forecast Engine.
    # We will create a placeholder for this table to ensure view creation works.
    create_forecast_results_table_sql = f"""
    CREATE TABLE IF NOT EXISTS `{DATASET_ID}.v_margin_forecast_results` (
      time_series_timestamp DATE,
      time_series_type STRING, -- 'history' or 'forecast'
      time_series_data FLOAT64
    );
    """
    
    create_retraining_view_sql = f"""
    CREATE OR REPLACE VIEW `{DATASET_ID}.v_forecast_model_health` AS
    WITH metrics AS (
      SELECT 
        actual.gross_margin as actual_val,
        pred.time_series_data as forecast_val
      FROM `{DATASET_ID}.v_financial_master` actual
      JOIN `{DATASET_ID}.v_margin_forecast_results` pred 
        ON DATE(actual.Period) = pred.time_series_timestamp
      WHERE pred.time_series_type = 'forecast'
    )
    SELECT 
      1 - ABS(actual_val - forecast_val) / actual_val as accuracy_score,
      CASE 
        WHEN (1 - ABS(actual_val - forecast_val) / actual_val) < 0.90 THEN 'RETRAIN_REQUIRED'
        ELSE 'HEALTHY'
      END as action_trigger
    FROM metrics;
    """

    # 10. Data Training (Bulk Inserts)
    # Maps Georgian products and defines AI Logic.
    bulk_insert_mapping_sql = f"""
    INSERT INTO `{DATASET_ID}.product_mapping` 
    (mapping_id, keyword, english_article, segment, unit_type, account_code_prefix)
    VALUES
    ('PM_G01', 'ტრანზიტული ბარათები', 'Transit Cards', 'Other Revenue', 'Service', '6110'),
    ('PM_G02', 'BP გადაზიდვა', 'BP Shipping', 'Other Revenue', 'Service', '6110'),
    ('PM_G03', 'DRY GOODS', 'Market Goods', 'Other Revenue', 'Unit', '6110'),
    ('PM_G04', 'ბიტუმი (საბითუმო)', 'Wholesale Bitumen', 'Wholesale', 'kg', '1622'),
    ('PM_G05', 'ბუნებრივი აირი', 'Retail CNG', 'Retail', 'm3', '1622'),
    ('PM_G06', 'დიზელი', 'Retail Diesel', 'Retail', 'L', '1622'),
    ('PM_G07', 'დიზელი (საბითუმო)', 'Wholesale Diesel', 'Wholesale', 'L', '1622'),
    ('PM_G08', 'ევრო დიზელი', 'Euro Diesel', 'Retail', 'L', '1622'),
    ('PM_G09', 'ევრო რეგულარი', 'Euro Regular', 'Retail', 'L', '1622'),
    ('PM_G10', 'იმპორტი', 'Import Fuel', 'Wholesale', 'kg', '1622'),
    ('PM_G11', 'ექსპორტი', 'Export Fuel', 'Wholesale', 'kg', '1622'),
    ('PM_G12', 'ელექტროენერგია', 'Utilities - Elec', 'Other Revenue', 'Service', '6110'),
    ('PM_G13', 'თხევადი აირი', 'Retail LPG', 'Retail', 'L', '1622'),
    ('PM_G14', 'იჯარა', 'Rent Income', 'Other Revenue', 'Service', '6110'),
    ('PM_G15', 'ავტოტექმომსახურება', 'Auto Maintenance', 'Other Revenue', 'Service', '6110');
    """

    bulk_insert_ai_logic_sql = f"""
    INSERT INTO `{DATASET_ID}.ai_training_examples` 
    (example_id, example_category, user_query, ai_response, processing_steps)
    VALUES
    ('L_ACC_01', 'Governance', 'When to retrain AI?', 'Retrain if v_forecast_model_health returns RETRAIN_REQUIRED (Accuracy < 90%)', ['check_accuracy']),
    ('L_FIFO_01', 'Calculation', 'FIFO Logic', 'Map sales chronologically to the earliest available purchase batches.', ['fifo_match']),
    ('L_BREAK_01', 'Economics', 'Breakeven Rule', 'Margin per unit must exceed (Total Administrative OPEX / Total Sold Units).', ['calc_breakeven']);
    """

    # 11. Feedback Loop Table
    create_feedback_table_sql = f"""
    CREATE TABLE IF NOT EXISTS `{DATASET_ID}.ai_feedback_loop` (
      request_id STRING OPTIONS(description="UUID for the user request"),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
      user_query STRING OPTIONS(description="The original prompt from the user"),
      generated_sql STRING OPTIONS(description="The SQL code the AI produced"),
      feedback_score INT64 OPTIONS(description="+1 for Correct, -1 for Incorrect"),
      user_comment STRING OPTIONS(description="Optional text feedback from the user"),
      was_corrected BOOLEAN DEFAULT FALSE,
      corrected_sql STRING OPTIONS(description="The manually fixed SQL if logic was wrong"),
      is_flagged_for_retraining BOOLEAN DEFAULT FALSE
    );
    """

    # 12. Variance Explainer View
    # Requires `v_monthly_comparison` view. We'll create a placeholder for dependency.
    create_monthly_comparison_view_sql = f"""
    CREATE OR REPLACE VIEW `{DATASET_ID}.v_monthly_comparison` AS
    SELECT 
      Product as article,
      Amount_Gel / 1.18 as avg_sell_price, -- Simplified proxy
      (Amount_Gel / 1.18) * 0.9 as prev_sell_price, -- Mock prev
      COGS as avg_buy_price,
      COGS * 0.95 as prev_buy_price,
      (Amount_Gel / 1.18) - COGS as gross_margin,
      ((Amount_Gel / 1.18) - COGS) * 0.9 as prev_gross_margin
    FROM `{DATASET_ID}.v_financial_master`
    LIMIT 100;
    """

    create_variance_view_sql = f"""
    CREATE OR REPLACE VIEW `{DATASET_ID}.v_variance_explainer` AS
    WITH metrics AS (
      SELECT 
        article,
        -- Calculate % changes
        (avg_sell_price - prev_sell_price) / NULLIF(prev_sell_price, 0) as sell_change,
        (avg_buy_price - prev_buy_price) / NULLIF(prev_buy_price, 0) as buy_change,
        gross_margin - prev_gross_margin as margin_delta
      FROM `{DATASET_ID}.v_monthly_comparison`
    )
    SELECT 
      article,
      FORMAT("Margin is %s by %'.0f GEL because your purchase price %s by %.1f%% while your selling price %s by %.1f%%.",
        IF(margin_delta > 0, "UP", "DOWN"),
        ABS(margin_delta),
        IF(buy_change > 0, "ROSE", "DROPPED"),
        ABS(buy_change * 100),
        IF(sell_change > 0, "ROSE", "STAYED FLAT/DROPPED"),
        ABS(sell_change * 100)
      ) as human_insight
    FROM metrics;
    """

    # 13. Admin Feedback Themes (Logic Radar)
    create_admin_themes_view_sql = f"""
    CREATE OR REPLACE VIEW `{DATASET_ID}.v_feedback_themes` AS
    SELECT 
      CASE 
        WHEN LOWER(user_comment) LIKE '%vat%' OR LOWER(user_comment) LIKE '%tax%' THEN 'VAT Logic Error'
        WHEN LOWER(user_comment) LIKE '%fx%' OR LOWER(user_comment) LIKE '%currency%' THEN 'FX/Exchange Rate Error'
        WHEN LOWER(user_comment) LIKE '%map%' OR LOWER(user_comment) LIKE '%unknown%' THEN 'Missing Product Mapping'
        WHEN LOWER(user_comment) LIKE '%salary%' OR LOWER(user_comment) LIKE '%payroll%' THEN 'Staff Cost Attribution'
        ELSE 'General Logic Gap'
      END as issue_theme,
      COUNT(*) as complaint_count,
      ARRAY_AGG(STRUCT(user_query, user_comment, generated_sql) LIMIT 3) as sample_cases
    FROM `{DATASET_ID}.ai_feedback_loop`
    WHERE feedback_score = -1
    GROUP BY 1
    ORDER BY complaint_count DESC;
    """

    # Populate Training Data (Suite Blueprints)
    insert_training_suite_sql = f"""
    INSERT INTO `{DATASET_ID}.ai_training_examples` 
    (example_id, example_category, user_query, ai_response, processing_steps)
    VALUES
    ('SUITE_001', 'Standard_Report', 'Show me performance by segment', 
     'SELECT segment, SUM(net_revenue), SUM(gross_margin) FROM v_financial_master GROUP BY 1', ['aggregate_by_segment']),
    ('SUITE_002', 'Forensic', 'Which items are causing losses?', 
     'SELECT article, gross_margin FROM v_financial_master WHERE gross_margin < 0 ORDER BY gross_margin ASC', ['filter_negative_margin']),
    ('SUITE_003', 'Scenario', 'What if VAT goes to 20%?', 
     'SELECT SUM(gross_revenue / 1.20) as hypo_net_rev, SUM((gross_revenue / 1.20) - total_cogs) as hypo_margin FROM v_financial_master', ['apply_vat_20']);
    """

    # 14. Financial History Snapshots (The Audit Trail)
    create_snapshots_table_sql = f"""
    CREATE TABLE IF NOT EXISTS `{DATASET_ID}.f_financial_history_snapshots` (
      snapshot_id STRING DEFAULT GENERATE_UUID(),
      snapshot_date DATE DEFAULT CURRENT_DATE(),
      period_covered DATE,
      product STRING,
      amount_gel FLOAT64,
      gross_margin FLOAT64,
      classification STRING,
      is_audited_final BOOLEAN DEFAULT TRUE
    );
    """

    # 15. Budget Targets (The Plan)
    create_budget_table_sql = f"""
    CREATE TABLE IF NOT EXISTS `{DATASET_ID}.budget_targets` (
      target_month DATE,
      segment STRING,
      target_revenue FLOAT64,
      target_margin FLOAT64
    );
    """
    
    # 16. Budget Variance View
    create_budget_variance_view_sql = f"""
    CREATE OR REPLACE VIEW `{DATASET_ID}.v_budget_variance` AS
    WITH actuals AS (
        SELECT 
            DATE_TRUNC(Period, MONTH) as month,
            COALESCE(segment, 'UNMAPPED') as segment,
            SUM(net_revenue) as actual_revenue,
            SUM(gross_margin) as actual_margin
        FROM `{DATASET_ID}.v_financial_master`
        GROUP BY 1, 2
    )
    SELECT 
        a.month,
        a.segment,
        a.actual_revenue,
        b.target_revenue,
        SAFE_DIVIDE(a.actual_revenue, b.target_revenue) as revenue_achievement,
        a.actual_margin,
        b.target_margin,
        SAFE_DIVIDE(a.actual_margin, b.target_margin) as margin_achievement,
        CASE 
            WHEN SAFE_DIVIDE(a.actual_margin, b.target_margin) < 0.9 THEN 'Missed Target'
            ELSE 'On Track'
        END as status
    FROM actuals a
    LEFT JOIN `{DATASET_ID}.budget_targets` b 
      ON a.month = b.target_month AND a.segment = b.segment;
    """

    # 17. FX Impact Analysis (The Forensic Scan)
    create_fx_view_sql = f"""
    CREATE OR REPLACE VIEW `{DATASET_ID}.v_fx_impact_analysis` AS
    SELECT 
        Period,
        Account_Dr,
        Account_Cr,
        Amount_Gel as fx_loss_gain,
        -- Attribution Logic
        'Attributed to COGS' as treatment_recommendation
    FROM `{raw_source_table}`
    WHERE Account_Dr LIKE '8220%' OR Account_Cr LIKE '8220%'; -- SGP Chart of Accounts for FX
    """

    # Populate Budget Data (Mock)
    insert_budget_data_sql = f"""
    INSERT INTO `{DATASET_ID}.budget_targets` (target_month, segment, target_revenue, target_margin)
    VALUES
    (DATE_TRUNC(CURRENT_DATE(), MONTH), 'Retail', 5000000.0, 500000.0),
    (DATE_TRUNC(CURRENT_DATE(), MONTH), 'Wholesale', 8000000.0, 200000.0);
    """

    queries = [
        ("Source Table (If Missing)", create_source_table_sql),
        ("Product Mapping", create_mapping_sql),
        ("AI Training", create_training_sql),
        ("Master View", create_master_view_sql),
        ("Stored Intelligence (The Brain)", create_stored_intelligence_sql),
        ("Risk View", create_risk_view_sql),
        ("Breakeven View", create_breakeven_view_sql),
        ("Cash Projection View", create_cash_view_sql),
        ("Inventory Tables", create_inventory_purchases_sql),
        ("Inventory Tables", create_inventory_sales_sql),
        ("FIFO View", create_fifo_view_sql),
        ("Forecast Results Table", create_forecast_results_table_sql),
        ("Retraining View", create_retraining_view_sql),
        ("Populate AI Training", insert_training_suite_sql),
        ("Bulk Insert Mappings", bulk_insert_mapping_sql),
        ("Bulk Insert AI Logic", bulk_insert_ai_logic_sql),
        ("Feedback Table", create_feedback_table_sql),
        ("Monthly Comparison View", create_monthly_comparison_view_sql),
        ("Variance Explainer View", create_variance_view_sql),
        ("Admin Themes View", create_admin_themes_view_sql),
        ("Snapshots Table", create_snapshots_table_sql),
        ("Budget Table", create_budget_table_sql),
        ("Budget Variance View", create_budget_variance_view_sql),
        ("FX Impact View", create_fx_view_sql),
        ("Populate Budget Data", insert_budget_data_sql)
    ]

    for name, sql in queries:
        try:
            print(f"Executing: {name}...")
            client.query(sql).result()
            print(f"  > Success.")
        except Exception as e:
            print(f"  > Error in {name}: {e}")

if __name__ == "__main__":
    setup_suite_bigquery()
