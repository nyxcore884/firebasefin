import logging
import json

logger = logging.getLogger(__name__)

def detect_intercompany_transactions(transactions):
    """
    Identifies potential intercompany transactions within a list of transactions.
    Filters for transactions where both 'counterparty' and 'is_intercompany' suggest internal transfer.
    """
    if not transactions:
        return []

    intercompany_txs = []
    for tx in transactions:
        # Check if transaction is flagged or counterparty matches known entity
        is_flagged = str(tx.get('is_intercompany', '')).lower() in ['true', '1', 'yes']
        counterparty = str(tx.get('counterparty', '')).strip()
        
        # Simple heuristic: if counterparty starts with "SGG-" (the entity prefix)
        if is_flagged or counterparty.startswith("SGG-"):
            intercompany_txs.append(tx)
            
    return intercompany_txs

def perform_elimination(transactions, company_ids=None):
    """
    Peforms automated elimination of intercompany balances.
    Returns:
    - eliminated_transactions: The transactions resulting from elimination.
    - elimination_logs: Details of what was eliminated.
    """
    intercompany = detect_intercompany_transactions(transactions)
    
    elimination_entries = []
    elimination_total = 0
    
    # In a full accounting system, we'd match Debits in Entity A to Credits in Entity B
    # For this platform, we'll identify 'Matching Pairs' and generate offsetting entries.
    
    # Example logic: Sum up intercompany revenue/expense and create a negative 'Elimination' record.
    for tx in intercompany:
        amt = float(tx.get('amount_gel', 0))
        cat = tx.get('category', 'General')
        
        elimination_entries.append({
            "transaction_id": f"ELIM-{tx.get('transaction_id')}",
            "amount_gel": -amt,
            "category": cat,
            "department": tx.get('department'),
            "description": f"Automated Elimination: {tx.get('description', 'Intercompany Transfer')}",
            "is_elimination": True,
            "original_id": tx.get('transaction_id')
        })
        elimination_total += amt

    # Return the simulated consolidated view
    consolidated_results = transactions + elimination_entries
    
    return {
        "status": "success",
        "original_count": len(transactions),
        "eliminated_count": len(intercompany),
        "elimination_total_gel": round(elimination_total, 2),
        "data": consolidated_results,
        "logs": [f"Eliminated {len(intercompany)} transactions totaling {elimination_total:,.2f} GEL"]
    }
