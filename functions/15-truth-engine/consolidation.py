import logging
import datetime
from google.cloud import firestore

logger = logging.getLogger(__name__)

def produce_consolidated_view(db, entity_ids, period_start, period_end):
    """
    CONSOLIDATION LAYER (Strictly Read-Only over Ledger):
    - Reads atomic ledger entries.
    - Applies eliminations for intercompany transactions.
    - Produces a derived JSON view for reports/AI.
    """
    logger.info(f"Producing consolidated view for {entity_ids} from {period_start} to {period_end}")
    
    # 1. Fetch Ledger Entries
    # Filter by entity and period
    ledger_ref = db.collection('ledger_entries')
    query = ledger_ref.where('posting_date', '>=', period_start).where('posting_date', '<=', period_end)
    
    docs = query.stream()
    
    consolidated_data = []
    eliminations = []
    
    total_raw_debits = 0
    total_raw_credits = 0
    
    for doc in docs:
        entry = doc.to_dict()
        
        # Skip if not in requested entities
        if entry.get('entity_id') not in entity_ids:
            continue
            
        amt = float(entry.get('amount', 0))
        direction = entry.get('direction', 'DEBIT')
        
        if direction == 'DEBIT':
            total_raw_debits += amt
        else:
            total_raw_credits += amt
            
        # 2. ELIMINATION LOGIC
        # Intercompany transactions are identified at the ledger level but removed during consolidation.
        if entry.get('intercompany') == True:
            eliminations.append({
                'source_row_id': entry.get('source_row_id'),
                'account_id': entry.get('account_id'),
                'amount': amt,
                'reason': 'Intercompany Elimination'
            })
            continue # Do not include in consolidated view
            
        consolidated_data.append(entry)
        
    # 3. Simple Aggregation by Account
    aggregates = {}
    for entry in consolidated_data:
        acc = entry['account_id']
        amt = float(entry['amount'])
        direc = entry['direction']
        
        if acc not in aggregates:
            aggregates[acc] = {'debit': 0.0, 'credit': 0.0, 'net': 0.0}
            
        if direc == 'DEBIT':
            aggregates[acc]['debit'] += amt
            aggregates[acc]['net'] += amt
        else:
            aggregates[acc]['credit'] += amt
            aggregates[acc]['net'] -= amt
            
    return {
        'metadata': {
            'entities': entity_ids,
            'period': f"{period_start} to {period_end}",
            'generated_at': datetime.datetime.now().isoformat()
        },
        'summary': {
            'raw_debits': total_raw_debits,
            'raw_credits': total_raw_credits,
            'net_imbalance': total_raw_debits - total_raw_credits,
            'eliminated_count': len(eliminations),
            'eliminated_value': sum(e['amount'] for e in eliminations)
        },
        'account_balances': aggregates,
        'status': 'Consolidated (Derived View)'
    }
