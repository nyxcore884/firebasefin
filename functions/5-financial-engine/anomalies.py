import statistics
import logging

logger = logging.getLogger(__name__)

def detect_anomalies(transactions, threshold=2.0):
    """
    Detects financial anomalies in a list of transactions.
    
    Checks for:
    1. Z-Score Outliers: Transactions with amounts significantly higher than the mean.
    2. Account Spikes: Accounts with unusually high total volume in this period.
    """
    if not transactions:
        return []
    
    anomalies = []
    
    # Extract amounts
    amounts = [float(t.get('amount_gel', 0)) for t in transactions]
    if len(amounts) < 2:
        return []
        
    mean = statistics.mean(amounts)
    stdev = statistics.stdev(amounts) if len(amounts) > 1 else 0
    
    # 1. Individual Transaction Anomalies (Z-Score)
    for t in transactions:
        amt = float(t.get('amount_gel', 0))
        if stdev > 0:
            z_score = (amt - mean) / stdev
            if abs(z_score) > threshold:
                anomalies.append({
                    "id": t.get('transaction_id', 'unknown'),
                    "type": "OUTLIER",
                    "severity": "CRITICAL" if abs(z_score) > 3.0 else "WARNING",
                    "description": f"Unusually large transaction: ₾{amt:,.2f}",
                    "details": f"Amount is {z_score:.1f} standard deviations from mean.",
                    "counterparty": t.get('counterparty', 'Unknown'),
                    "date": t.get('date'),
                    "category": t.get('category')
                })
    
    # 2. Account-Level Aggregation Spikes
    account_totals = {}
    for t in transactions:
        acc = t.get('account') or t.get('category') or 'Uncategorized'
        account_totals[acc] = account_totals.get(acc, 0) + float(t.get('amount_gel', 0))
        
    avg_per_account = statistics.mean(account_totals.values())
    
    for acc, total in account_totals.items():
        if total > avg_per_account * 2.5: # Simple heuristic for account spike
            anomalies.append({
                "type": "SPIKE",
                "severity": "WARNING",
                "description": f"Account Spike: {acc}",
                "details": f"Total volume ₾{total:,.2f} is significantly higher than average account volume.",
                "category": acc
            })
            
    return anomalies
