import logging
import statistics

logger = logging.getLogger(__name__)

def generate_budget(transactions, method='trend'):
    """
    Generates a projected budget based on historical transaction data.
    """
    if not transactions:
        return {}

    # Group by Category
    category_data = {}
    for t in transactions:
        cat = t.get('category', 'Uncategorized')
        amt = float(t.get('amount_gel', 0))
        if cat not in category_data:
            category_data[cat] = []
        category_data[cat].append(amt)

    budget_projections = {}

    for cat, amounts in category_data.items():
        if not amounts:
            continue
            
        # 1. Trend-Based Forecasting (Simple Mean)
        # In a more advanced version, we'd use Prophet or LSTM
        avg_amt = statistics.mean(amounts)
        
        # 2. Z-Score Normalization (Oulier removal for cleaner baseline)
        if len(amounts) > 2:
            stdev = statistics.stdev(amounts)
            if stdev > 0:
                filtered_amounts = [x for x in amounts if abs((x - avg_amt) / stdev) < 2.0]
                if filtered_amounts:
                    avg_amt = statistics.mean(filtered_amounts)

        # 3. Apply Multiplier (e.g., 5% growth or buffer)
        projected_budget = avg_amt * 1.05
        
        budget_projections[cat] = {
            "name": cat,
            "projected": projected_budget,
            "historical_avg": avg_amt,
            "sample_size": len(amounts)
        }

    return budget_projections

def calculate_variance(actual, budget):
    """
    Calculates variance and percentage.
    """
    if budget == 0:
        return {"amount": 0, "percentage": 0}
    
    diff = actual - budget
    pct = (diff / budget) * 100
    return {
        "amount": round(diff, 2),
        "percentage": round(pct, 2)
    }
