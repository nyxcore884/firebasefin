import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)

def calculate_metrics(data) -> dict:
    """
    Calculates deterministic financial metrics from a list of transaction dictionaries or a DataFrame.
    """
    if isinstance(data, list):
        df = pd.DataFrame(data)
    else:
        df = data

    if df.empty:
        return {
            "revenue": 0.0, "cogs": 0.0, "expenses": 0.0, 
            "net_income": 0.0, "assets": 0.0, "liabilities": 0.0, 
            "equity": 0.0, "ebitda": 0.0
        }

    # Normalize category names for robustness
    if 'category' in df.columns:
        df['category_norm'] = df['category'].str.strip()
    
    # 1. Aggregations
    def get_net(categories):
        mask = df['category_norm'].isin(categories) if 'category_norm' in df.columns else [False] * len(df)
        cdf = df[mask]
        if cdf.empty: return 0.0
        
        # Determine sign based on entry_type if available
        if 'entry_type' in cdf.columns:
            debits = cdf[cdf['entry_type'].str.lower() == 'debit']['amount'].sum()
            credits = cdf[cdf['entry_type'].str.lower() == 'credit']['amount'].sum()
            
            # Simple Finance Logic:
            # P&L: Revenue is Credit (+), Expense is Debit (+)
            # BS: Asset is Debit (+), Liab/Equity is Credit (+)
            cat_sample = cdf.iloc[0]['category_norm']
            if cat_sample in ['Revenue', 'Income', 'Sales']:
                return credits - debits
            elif cat_sample in ['Assets', 'Bank', 'Cash']:
                return debits - credits
            elif cat_sample in ['Liabilities', 'Equity']:
                return credits - debits
            else: # Expenses
                return debits - credits
        else:
            return cdf['amount'].sum()

    revenue = get_net(['Revenue', 'Sales', 'Income', 'service_revenue'])
    cogs = get_net(['COGS', 'Cost of Goods Sold', 'Direct Costs'])
    expenses = get_net(['Expense', 'Opex', 'Payroll', 'Rent', 'Utilities', 'Salaries', 'Expenses'])
    assets = get_net(['Assets', 'Bank', 'Cash', 'Equipment', 'Receivables'])
    liabilities = get_net(['Liabilities', 'Payables', 'Loan'])
    equity = get_net(['Equity', 'Capital', 'Retained Earnings'])

    # 2. Derived Metrics
    ebitda = revenue - cogs - (expenses * 0.9) # Simplified proxy adjustment
    net_income = revenue - cogs - expenses
    
    # Reconciliation
    balance_discrepancy = float(round(assets - (liabilities + equity), 4))
    is_balanced = abs(balance_discrepancy) < 0.01

    return {
        "revenue": float(round(revenue, 2)),
        "cogs": float(round(cogs, 2)),
        "expenses": float(round(expenses, 2)),
        "net_income": float(round(net_income, 2)),
        "ebitda": float(round(ebitda, 2)),
        "assets": float(round(assets, 2)),
        "liabilities": float(round(liabilities, 2)),
        "equity": float(round(equity, 2)),
        "reconciliation": {
            "is_balanced": is_balanced,
            "discrepancy": balance_discrepancy
        }
    }
