from google.cloud import bigquery
from app.core.config import settings

class BreakevenEngine:
    def __init__(self):
        self.bq_client = bigquery.Client(project=settings.PROJECT_ID)
        self.view_name = f"{settings.PROJECT_ID}.{settings.BIGQUERY_DATASET}.v_breakeven_logic"

    def calculate_breakeven(self):
        """
        Calculates the Minimum Margin per Unit required to cover OPEX.
        """
        sql = f"SELECT * FROM `{self.view_name}`"
        try:
            results = self.bq_client.query(sql).to_dataframe().to_dict(orient="records")
            return results[0] if results else {"error": "No data available for breakeven calculation"}
        except Exception as e:
            return {"error": str(e)}

class LinkedScenarioEngine:
    def __init__(self):
        self.bq_client = bigquery.Client(project=settings.PROJECT_ID)
        self.base_view = f"{settings.PROJECT_ID}.{settings.BIGQUERY_DATASET}.v_cash_projection_master"

    def simulate_cash_impact(self, price_delta: float):
        """
        Simulates impact of price change on cash balance.
        Input: price_delta (e.g. 0.10 for +10 Tetri)
        """
        # Using the logic provided by user:
        # Cash End = Start + Predicted Margin + (Delta * Volume)
        
        sql = f"""
        SELECT 
          current_bank_balance,
          predicted_month_margin,
          ({price_delta} * total_volume) as slider_profit_lift,
          (current_bank_balance + predicted_month_margin + ({price_delta} * total_volume)) as scenario_cash_balance
        FROM `{self.base_view}`
        """
        try:
            results = self.bq_client.query(sql).to_dataframe().to_dict(orient="records")
            return results[0] if results else {"error": "No base data for simulation"}
        except Exception as e:
            return {"error": str(e)}

breakeven_engine = BreakevenEngine()
linked_scenario_engine = LinkedScenarioEngine()
