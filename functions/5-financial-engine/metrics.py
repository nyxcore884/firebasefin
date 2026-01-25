<<<<<<< Updated upstream

import pandas as pd
import numpy as np

def calculate_metrics(df: pd.DataFrame) -> dict:
    """
    Calculates deterministic financial metrics with reconciliation and drill-through.
    """
    if df.empty:
        return {"error": "Empty dataset"}

    # 1. Aggregations with Entry Type Logic (Debit/Credit)
    # Assets = Sum(Debits) - Sum(Credits)
    # Liab/Equity = Sum(Credits) - Sum(Debits)
    
    def get_net(category):
        cdf = df[df['category'] == category]
        if cdf.empty: return 0.0, []
        
        debits = cdf[cdf['entry_type'] == 'Debit']['amount_gel'].sum()
        credits = cdf[cdf['entry_type'] == 'Credit']['amount_gel'].sum()
        ids = cdf['id'].tolist()
        
        if category in ['Assets', 'Expenses', 'COGS']:
            return debits - credits, ids
        else: # Liabilities, Equity, Revenue
            return credits - debits, ids

    assets, asset_ids = get_net('Assets')
    liabilities, liability_ids = get_net('Liabilities')
    equity, equity_ids = get_net('Equity')
    revenue, revenue_ids = get_net('Revenue')
    cogs, cogs_ids = get_net('COGS')
    expenses, expense_ids = get_net('Expenses')

    # 2. Detailed Breakdowns
    def get_sub_total(sub_name):
        mask = df['sub_category'].str.contains(sub_name, case=False, na=False)
        return df[mask]['amount_gel'].sum()

    depreciation = get_sub_total('Depreciation')
    interest = get_sub_total('Interest')
    taxes = get_sub_total('Tax')

    # 3. Deterministic Calculations
    gross_margin = revenue - cogs
    operating_expenses = expenses # For now, assume Expenses = OPEX
    ebitda = gross_margin - (expenses - depreciation - interest - taxes)
    net_income = revenue - cogs - expenses

    # 4. Reconciliation Check (The CFO "Green Light")
    # Fundamental Equation: Assets = Liabilities + Equity
    balance_discrepancy = float(round(assets - (liabilities + equity), 4))
    is_balanced = bool(abs(balance_discrepancy) < 0.01)

    return {
        "status": "success",
        "timestamp": pd.Timestamp.now().isoformat(),
        "reconciliation": {
            "is_balanced": is_balanced,
            "discrepancy": balance_discrepancy,
            "equation": f"{float(assets):.2f} = {float(liabilities):.2f} (L) + {float(equity):.2f} (E)"
        },
        "metrics": {
            "assets": float(round(assets, 2)),
            "liabilities": float(round(liabilities, 2)),
            "equity": float(round(equity, 2)),
            "revenue": float(round(revenue, 2)),
            "cogs": float(round(cogs, 2)),
            "net_income": float(round(net_income, 2)),
            "ebitda": float(round(ebitda, 2)),
        },
        "drill_through": {
            "revenue": [str(x) for x in revenue_ids],
            "expenses": [str(x) for x in expense_ids],
            "assets": [str(x) for x in asset_ids]
        }
    }
=======
import yaml
from pathlib import Path

# Load Semantic Metrics from shared folder
# Ideally this is packaged, but for Cloud Functions we might need a relative loader similar to schema_loader
# We'll use a robust path finder
def load_semantics():
    base_path = Path(__file__).resolve().parent
    potential_paths = [
        base_path.parents[1] / "shared" / "semantic" / "metrics.yaml",
        base_path / "shared" / "semantic" / "metrics.yaml", 
    ]
    for p in potential_paths:
        if p.exists():
            with open(p, "r", encoding="utf-8") as f:
                return yaml.safe_load(f)
    return {"metrics": {}}

SEMANTICS = load_semantics()

def resolve_metric_sql(metric_name: str, period: str):
    """
    Generates SQL for a given metric and period.
    Strictly follows the definition in shared/semantic/metrics.yaml
    """
    metric_def = SEMANTICS.get("metrics", {}).get(metric_name)
    
    if not metric_def:
        return None
        
    source_table = metric_def.get("source", "fact_financial_summary")
    measure = metric_def.get("measure", "actual_month")
    aggregation = metric_def.get("aggregation", "sum")
    
    # Check for account filters
    # accounts: [6000-6999] -> need to translate to SQL WHERE clause
    # This is a simplified parser
    accounts = metric_def.get("accounts", [])
    account_filter = ""
    if accounts:
        # Assuming simple range strings for now
        # Real implementation would need a robust range parser
        pass 

    # Basic SQL construction
    sql = f"""
        SELECT
            SUM({measure}) as value
        FROM {source_table}
        WHERE strftime('%Y-%m', period_date) = '{period}'
    """
    
    return sql.strip()

def calculate_metrics(transactions):
    """
    Calculates financial metrics by aggregating transactions based on semantic rules.
    """
    totals = {
        "revenue": 0.0,
        "cogs": 0.0,
        "expenses": 0.0,
        "net_income": 0.0,
        "assets": 0.0,
        "liabilities": 0.0,
        "equity": 0.0,
        "ebitda": 0.0,
        "by_category": {}
    }

    if not transactions:
        return totals

    # 1. Load semantics (or default rules if missing)
    # For now, we use a simple rule-based approach derived from common semantics
    # Real implementation would parse 'SEMANTICS' (yaml) fully.
    
    for txn in transactions:
        amount = float(txn.get('amount', 0) or 0)
        category = txn.get('category', 'Uncategorized')
        entry_type = txn.get('entry_type', 'Debit') # Credit or Debit
        
        # Determine sign
        # Revenue is Credit (+), Expense is Debit (+) in our P&L view but (-) in calculation for net income
        
        # Categorize
        # Ideally, we map category -> Semantic Group (e.g., 'Sales' -> Revenue)
        
        # --- SIMPLE MAPPING RULE (Should be replaced by YAML lookup) ---
        if category in ['Revenue', 'Sales', 'Income', 'Service Revenue']:
            totals['revenue'] += amount
            totals['net_income'] += amount
            totals['ebitda'] += amount
            
        elif category in ['COGS', 'Cost of Goods Sold', 'Direct Costs']:
            totals['cogs'] += amount
            totals['net_income'] -= amount # Cost reduces income
            totals['ebitda'] -= amount
            
        elif category in ['Expense', 'Opex', 'Payroll', 'Rent', 'Utilities', 'Salaries']:
            totals['expenses'] += amount
            totals['net_income'] -= amount
            totals['ebitda'] -= amount
            
        elif category in ['Depreciation', 'Amortization']:
            totals['expenses'] += amount
            totals['net_income'] -= amount
            # Excluded from EBITDA
            
        elif category in ['Assets', 'Bank', 'Cash', 'Equipment']:
            # Balance Sheet Item
            if entry_type == 'Debit':
                 totals['assets'] += amount
            else:
                 totals['assets'] -= amount
                 
        elif category in ['Liabilities', 'Accounts Payable', 'Loan']:
             if entry_type == 'Credit':
                 totals['liabilities'] += amount
             else:
                 totals['liabilities'] -= amount
                 
        elif category in ['Equity', 'Capital', 'Retained Earnings']:
             if entry_type == 'Credit':
                 totals['equity'] += amount
             else:
                 totals['equity'] -= amount
        
        # Aggregate by Category
        if category not in totals['by_category']:
            totals['by_category'][category] = 0.0
        totals['by_category'][category] += amount

    return totals

>>>>>>> Stashed changes
