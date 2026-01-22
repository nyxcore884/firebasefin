
# Accounting Logic - Double Entry & Reconciliation

def debit(account_type, amount):
    """
    Simulate a Debit operation.
    Debit increases: AES (Assets, Expenses, Dividends)
    Debit decreases: LER (Liabilities, Equity, Revenue)
    """
    # In a real app, this would write a Ledger Entry to Firestore
    # db.collection('ledger').add({ 'type': 'debit', 'account': account_type, 'amount': amount })
    print(f"[LEDGER] DEBIT {account_type}: {amount}")

def credit(account_type, amount):
    """
    Simulate a Credit operation.
    Credit increases: LER (Liabilities, Equity, Revenue)
    Credit decreases: AES (Assets, Expenses, Dividends)
    """
    # db.collection('ledger').add({ 'type': 'credit', 'account': account_type, 'amount': amount })
    print(f"[LEDGER] CREDIT {account_type}: {amount}")

def reconcile_accounts(transactions):
    """
    Process a batch of transactions and ensure double-entry compliance.
    """
    reconciliation_log = []
    
    for txn in transactions:
        category = txn.get('category', '').lower()
        amount = float(txn.get('amount', 0))
        
        # Logic Rule: "Sales" -> Debit Cash, Credit Revenue
        if category == 'revenue' or category == 'sales':
            debit('Assets (Cash)', amount)
            credit('Revenue', amount)
            reconciliation_log.append(f"Reconciled Revenue: {amount}")
            
        # Logic Rule: "Expense" -> Debit Expense, Credit Cash
        elif category == 'expenses' or category == 'cogs':
            debit('Expenses', amount)
            credit('Assets (Cash)', amount)
            reconciliation_log.append(f"Reconciled Expense: {amount}")
            
        # Logic Rule: "Asset Purchase" -> Debit Asset, Credit Cash
        elif category == 'assets':
             debit('Assets (PPE)', amount)
             credit('Assets (Cash)', amount)
             reconciliation_log.append(f"Reconciled Asset Purchase: {amount}")
             
        else:
            reconciliation_log.append(f"Uncategorized Transaction: {category}")
            
    return reconciliation_log
