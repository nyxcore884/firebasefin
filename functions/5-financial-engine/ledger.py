def apply_double_entry(txn):
    """
    Determines the double-entry impact of a single transaction.
    Returns a list of ledger entries (dicts).
    """
    try:
        amount = float(txn.get("amount", 0))
    except (ValueError, TypeError):
        amount = 0.0
        
    category = txn.get("category", "Unknown")
    
    # Simple Double-Entry Rules
    # Asset Increase -> Debit
    # Asset Decrease -> Credit
    # Liab/Equity Increase -> Credit
    # Liab/Equity Decrease -> Debit
    # Expense Increase -> Debit
    # Revenue Increase -> Credit

    entries = []
    
    # Revenue / Sales
    if category in ["Revenue", "Sales"]:
        # Cash (Asset) increases [Debit]
        entries.append({"account": "Assets:Cash", "type": "Debit", "amount": amount})
        # Revenue (Equity-like) increases [Credit]
        entries.append({"account": "Revenue:Sales", "type": "Credit", "amount": amount})

    # Expenses / COGS
    elif category in ["Expenses", "COGS", "Operating Expenses"]:
        # Expense increases [Debit]
        entries.append({"account": "Expenses:General", "type": "Debit", "amount": amount})
        # Cash (Asset) decreases [Credit]
        entries.append({"account": "Assets:Cash", "type": "Credit", "amount": amount})

    # Assets (Purchase of Equipment, etc.)
    elif category in ["Assets", "Capital Expenditures"]:
        # PPE (Asset) increases [Debit]
        entries.append({"account": "Assets:PPE", "type": "Debit", "amount": amount})
        # Cash (Asset) decreases [Credit]
        entries.append({"account": "Assets:Cash", "type": "Credit", "amount": amount})
        
    else:
        # Default / Fallback handling for unknown categories
        # We treat it as a generic expense to be safe, or log it.
        entries.append({"account": "Uncategorized", "type": "Debit", "amount": amount})
        entries.append({"account": "Assets:Cash", "type": "Credit", "amount": amount})

    return entries
