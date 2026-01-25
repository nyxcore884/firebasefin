from firebase_admin import firestore
import logging

logger = logging.getLogger(__name__)

def fx_convert(amount, from_ccy, to_ccy, fx_rates):
    """
    Convert amount from one currency to another using provided rates.
    """
    if from_ccy == to_ccy:
        return amount
    # Rate key convention: "USD_EUR"
    rate = fx_rates.get(f"{from_ccy}_{to_ccy}", 1.0)
    return amount * rate

def eliminate_intercompany(facts, fx_rates=None):
    """
    Identifies and eliminates intercompany transactions.
    """
    fx_rates = fx_rates or {}
    indexed = {}
    eliminations = []

    # 1. Index facts by (Entity, Counterparty, Metric)
    for f in facts:
        entity = f.get("entity_id")
        counterparty = f.get("counterparty_entity")
        metric = f.get("metric")
        
        if not entity or not metric:
            continue
            
        key = (entity, counterparty, metric)
        indexed.setdefault(key, []).append(f)

    # 2. Find matching pairs
    for (entity, counterparty, metric), rows in indexed.items():
        if not counterparty:
            continue

        # Look for the other side: (Counterparty, Entity, Metric)
        # Note: Often revenue matches expense, so metric might differ. 
        # But per user snippet, we match on same Metric? Or maybe 'INTERCOMPANY_FLOW'? 
        # User snippet: "opposite_key = (counterparty, entity, metric)"
        # This implies symmetrical metric usage (e.g. 'INTERCOMPANY_TRANSFER').
        
        opposite_key = (counterparty, entity, metric)
        if opposite_key not in indexed:
            continue

        # 3. Eliminate
        for a, b in zip(rows, indexed[opposite_key]):
            # Use smaller absolute amount to be conservative/safe?
            # User snippet: amt = min(abs(a), abs(b))
            amt_a = a.get("amount_base", 0)
            amt_b = b.get("amount_base", 0)
            
            amt = min(abs(amt_a), abs(amt_b))
            
            # Create elimination entry
            eliminations.append({
                "dataset_id": a.get("dataset_id"),
                "dataset_version": a.get("dataset_version"),
                "metric": metric,
                "amount_base": -amt,
                "entity_id": "ELIMINATION",
                "currrency": "BASE",
                "elimination": True,
                "created_at": firestore.SERVER_TIMESTAMP,
                "source_fact_ids": [a.get("fact_id"), b.get("fact_id")] 
            })

    return eliminations

def write_eliminations(db, elims):
    """
    Writes elimination entries to Firestore in batches.
    """
    if not elims:
        return 0
        
    batch = db.batch()
    count = 0
    total_written = 0
    
    for e in elims:
        ref = db.collection("fact_financial_summary").document()
        batch.set(ref, e)
        count += 1
        total_written += 1
        
        if count >= 400:
            batch.commit()
            batch = db.batch()
            count = 0
            
    if count:
        batch.commit()
        
    return total_written
