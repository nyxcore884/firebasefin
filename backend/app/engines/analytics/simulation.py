from google.cloud import bigquery
from app.core.config import settings

class SimulationEngine:
    def __init__(self):
        self.bq_client = bigquery.Client(project=settings.PROJECT_ID)
        self.raw_data_table = f"{settings.PROJECT_ID}.{settings.BIGQUERY_DATASET}.raw_data"

    def run_simulation(self, target_vat_rate: float, cogs_inflation_multiplier: float):
        """
        Runs a What-If simulation for VAT and COGS changes.
        """
        sql = f"""
        DECLARE target_vat_rate FLOAT64 DEFAULT {target_vat_rate};
        DECLARE cogs_inflation_multiplier FLOAT64 DEFAULT {cogs_inflation_multiplier};

        WITH scenario_logic AS (
          SELECT 
            Product,
            Amount_Gel as gross_collected,
            (Amount_Gel / (1 + target_vat_rate)) as hypothetical_net_revenue,
            (COGS * cogs_inflation_multiplier) as hypothetical_cogs
          FROM `{self.raw_data_table}`
        )
        SELECT 
          SUM(gross_collected) as total_cash,
          SUM(hypothetical_net_revenue) as total_hypo_revenue,
          SUM(hypothetical_net_revenue - hypothetical_cogs) as hypothetical_margin,
          -- Impact Analysis
          SUM(hypothetical_net_revenue - hypothetical_cogs) - SUM((gross_collected / 1.18) - (gross_collected - (gross_collected / 1.18))) as margin_delta -- Simplified base comparison
        FROM scenario_logic;
        """
        
        try:
            results = self.bq_client.query(sql).to_dataframe()
            return results.to_dict(orient="records")
        except Exception as e:
            print(f"Simulation Engine Error: {e}")
            return {"error": str(e)}

simulation_engine = SimulationEngine()
