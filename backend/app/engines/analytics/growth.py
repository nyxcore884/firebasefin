from google.cloud import bigquery
from app.core.config import settings

class GrowthEngine:
    def __init__(self):
        self.bq_client = bigquery.Client(project=settings.PROJECT_ID)
        # Using a default dataset/table or parameterizing
        self.full_table_ref = f"{settings.PROJECT_ID}.{settings.BIGQUERY_DATASET}.full_financial_table"

    def calculate_mom_growth(self):
        """
        Calculates MoM Growth for Revenue and Margin.
        """
        sql = f"""
        WITH monthly_data AS (
          SELECT 
            FORMAT_DATE('%Y-%m', PARSE_DATE('%Y-%m-%d', CAST(Date AS STRING))) as month_id, -- Assuming Date is standard or parsed
            SUM(Amount_Gel / 1.18) as net_revenue,
            SUM(COGS) as total_cogs,
            SUM((Amount_Gel / 1.18) - COGS) as gross_margin
          FROM `{self.full_table_ref}`
          GROUP BY 1
        )
        SELECT 
          curr.month_id as current_month,
          prev.month_id as previous_month,
          curr.net_revenue,
          -- MoM Revenue Growth
          SAFE_DIVIDE(curr.net_revenue - prev.net_revenue, prev.net_revenue) * 100 as rev_growth_pct,
          curr.gross_margin,
          -- MoM Margin Growth
          SAFE_DIVIDE(curr.gross_margin - prev.gross_margin, prev.gross_margin) * 100 as margin_growth_pct
        FROM monthly_data curr
        LEFT JOIN monthly_data prev 
          ON DATE_SUB(PARSE_DATE('%Y-%m', curr.month_id), INTERVAL 1 MONTH) = PARSE_DATE('%Y-%m', prev.month_id)
        ORDER BY current_month DESC;
        """
        # Note: The 'Date' parsing in CTE might need adjustment based on actual schema (Date vs String)
        # Assuming table exists for now.
        
        try:
            results = self.bq_client.query(sql).to_dataframe()
            return results.to_dict(orient="records")
        except Exception as e:
            # Fallback for demo or if table missing
            print(f"Growth Engine Error: {e}")
            return {"error": str(e)}

growth_engine = GrowthEngine()
