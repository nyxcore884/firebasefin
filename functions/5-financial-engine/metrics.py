
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
