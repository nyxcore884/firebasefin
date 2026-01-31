from decimal import Decimal
from google.cloud import firestore
from app.core.config import settings

class ConsolidationEngine:
    """
    Performs the math. No AI hallucinations.
    Uses Firestore as the data source.
    """
    
    def __init__(self):
        self.db = firestore.Client(project=settings.PROJECT_ID)

    async def run(self, org_id: str, period: str):
        # 1. Fetch Data from Firestore
        # Collection: financial_records
        records_ref = self.db.collection("financial_records")
        query = records_ref.where("org_id", "==", org_id).where("period", "==", period)
        docs = query.stream()

        # 2. Aggregate by Entity & Account
        aggregated = {}
        total_ga_expenses = Decimal(0)
        
        for doc in docs:
            r = doc.to_dict()
            entity = r.get('entity', 'Unknown')
            account_name = r.get('account_name', 'General')
            account_code = str(r.get('account_code', ''))
            amount = Decimal(str(r.get('amount', 0)))
            
            # G&A Expense Classification (Accounts 73, 74, 82, 92)
            if account_code.startswith(('73', '74', '82', '92')):
                total_ga_expenses += amount
                account_name = "G&A_Expense"

            key = f"{entity}_{account_name}"
            if key not in aggregated:
                aggregated[key] = {
                    "entity": entity, 
                    "account": account_name, 
                    "val": Decimal(0)
                }
            aggregated[key]["val"] += amount

        # 4. Final Totals
        total_revenue = sum(x['val'] for x in aggregated.values() if x['account'] == 'Revenue')
        total_cogs = sum(x['val'] for x in aggregated.values() if x['account'] == 'COGS')
        gross_profit = total_revenue - total_cogs
        ebitda = gross_profit - total_ga_expenses
        
        return {
            "org_id": org_id,
            "period": period,
            "total_revenue": float(total_revenue),
            "total_cogs": float(total_cogs),
            "total_ga_expenses": float(total_ga_expenses),
            "gross_margin": float(gross_profit),
            "ebitda": float(ebitda),
            "breakdown": [
                {
                    "entity": v["entity"], 
                    "account": v["account"], 
                    "amount": float(v["val"])
                }
                for v in aggregated.values()
            ]
        }
