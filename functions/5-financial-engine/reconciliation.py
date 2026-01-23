def reconcile(assets, liabilities, equity):
    """
    Validates the Fundamental Accounting Equation: Assets = Liabilities + Equity
    """
    # Round to 2 decimal places for currency comparison
    A = round(float(assets), 2)
    L = round(float(liabilities), 2)
    E = round(float(equity), 2)
    
    discrepancy = round(A - (L + E), 2)
    
    # Strict equality check with tolerance for floating point
    is_balanced = abs(discrepancy) < 0.01
    
    return {
        "is_balanced": is_balanced,
        "discrepancy": discrepancy,
        "equation": f"{A} = {L} + {E}"
    }
