def calculate_metrics(transactions):
    """
    Aggregates financial transactions into core metrics using pure Python.
    Input: List of transaction dicts.
    Output: Dict of totals (Assets, Liabilities, Equity, Revenue, Expenses, COGS, NetIncome, EBITDA).
    """
    totals = {
        "assets": 0.0,
        "liabilities": 0.0,
        "equity": 0.0,
        "revenue": 0.0,
        "expenses": 0.0,
        "cogs": 0.0,
        "depreciation": 0.0,
        "interest": 0.0,
        "tax": 0.0
    }

    # Iterate once (O(N))
    for t in transactions:
        try:
            amt = float(t.get("amount", 0))
        except:
            amt = 0.0
            
        cat = t.get("category", "")
        sub_cat = t.get("sub_category", "")
        entry_type = t.get("entry_type", "Debit") # Default to Debit if missing

        # Map Aggregates
        target_bucket = None
        if cat in ["Assets", "Capital Expenditures"]: target_bucket = "assets"
        elif cat in ["Liabilities"]: target_bucket = "liabilities"
        elif cat in ["Equity", "Retained Earnings"]: target_bucket = "equity"
        elif cat in ["Revenue", "Sales"]: target_bucket = "revenue"
        elif cat in ["Expenses", "Operating Expenses", "Human Resources", "Marketing"]: target_bucket = "expenses"
        elif cat in ["COGS"]: target_bucket = "cogs"
        
        if target_bucket:
            totals[target_bucket] += amt

        # Detailed breakdown
        if "Depreciation" in sub_cat: totals["depreciation"] += amt
        if "Interest" in sub_cat: totals["interest"] += amt
        if "Tax" in sub_cat: totals["tax"] += amt

    # Derived Metrics
    gross_margin = totals["revenue"] - totals["cogs"]
    net_income = totals["revenue"] - totals["cogs"] - totals["expenses"]
    ebitda = net_income + totals["interest"] + totals["tax"] + totals["depreciation"]
    
    # Financial Engine needs to balance.
    totals["equity"] += net_income
    
    # Final rounding
    for k in totals:
        totals[k] = round(totals[k], 2)
        
    totals["net_income"] = round(net_income, 2)
    totals["ebitda"] = round(ebitda, 2)

    
    return totals
