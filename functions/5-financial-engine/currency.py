import logging

logger = logging.getLogger(__name__)

# Fixed rates for MVP/Demo
# In production, these would be fetched from an external API (e.g., CurrencyBeacon, OpenExchangeRates)
EXCHANGE_RATES = {
    "GEL": {"GEL": 1.0, "USD": 0.37, "EUR": 0.34},
    "USD": {"GEL": 2.70, "USD": 1.0, "EUR": 0.92},
    "EUR": {"GEL": 2.95, "USD": 1.09, "EUR": 1.0}
}

def convert_amount(amount, from_curr, to_curr):
    """
    Converts an amount from one currency to another.
    """
    from_curr = from_curr.upper()
    to_curr = to_curr.upper()
    
    if from_curr not in EXCHANGE_RATES:
        logger.warning(f"Unsupported source currency: {from_curr}. Using 1.0 rate.")
        return amount
        
    rates = EXCHANGE_RATES[from_curr]
    rate = rates.get(to_curr, 1.0)
    
    return round(amount * rate, 2)

def convert_metrics(metrics_dict, from_curr, to_curr):
    """
    Converts all numeric values in a metrics dictionary.
    """
    if from_curr == to_curr:
        return metrics_dict
        
    converted = {}
    for k, v in metrics_dict.items():
        if isinstance(v, (int, float)):
            converted[k] = convert_amount(v, from_curr, to_curr)
        else:
            converted[k] = v
            
    return converted

def convert_transactions(transactions, to_curr):
    """
    Converts a list of transactions to a target currency.
    Assumes base amounts are in GEL if 'amount_gel' is the field, 
    or uses 'amount' and 'currency' fields if present.
    """
    converted_txs = []
    for tx in transactions:
        new_tx = tx.copy()
        
        # Check current currency
        source_curr = tx.get('currency', 'GEL')
        base_amt = float(tx.get('amount_gel', tx.get('amount', 0)))
        
        if source_curr != to_curr:
            new_tx['amount'] = convert_amount(base_amt, source_curr, to_curr)
            new_tx['currency'] = to_curr
            # If converting from GEL to something else, we preserve amount_gel for reference
            if source_curr == 'GEL':
                new_tx['amount_gel'] = base_amt
        else:
            new_tx['amount'] = base_amt
            new_tx['currency'] = to_curr
            
        converted_txs.append(new_tx)
        
    return converted_txs
