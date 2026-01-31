from google.cloud import bigquery
from app.core.config import settings

class RiskEngine:
    def __init__(self):
        self.bq_client = bigquery.Client(project=settings.PROJECT_ID)
        self.risk_view = f"{settings.PROJECT_ID}.{settings.BIGQUERY_DATASET}.v_risk_alerts"

    def check_for_risk_and_email(self, user_email: str):
        """
        Polls the risk view and sends emails if alerts found.
        """
        # Note: View definition filters for 'margin_growth_pct < -10'
        # But we might want to filter by current month specifically in the query if the view is historical.
        # User logic: "SELECT * FROM `v_risk_alerts` WHERE current_month = FORMAT_DATE('%Y-%m', CURRENT_DATE())"
        
        sql = f"""
        SELECT * FROM `{self.risk_view}` 
        WHERE current_month = FORMAT_DATE('%Y-%m', CURRENT_DATE())
        """
        
        results = []
        try:
            df = self.bq_client.query(sql).to_dataframe()
            if not df.empty:
                for index, row in df.iterrows():
                    subject = f"⚠️ ALERT: Margin Drop in {row['segment']}"
                    body = f"The {row['segment']} segment has seen a margin decline of {row['margin_growth_pct']:.1f}% this month."
                    
                    # Mock Email Send
                    print(f"[Run] Sending email to {user_email}: {subject} | {body}")
                    
                    results.append({"status": "sent", "recipient": user_email, "subject": subject})
            else:
                return [{"status": "no_alerts", "message": "No risk alerts found for current month."}]
            
            return results
        except Exception as e:
            return [{"error": str(e)}]

risk_engine = RiskEngine()
