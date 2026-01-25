import numpy as np
import logging
import market
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

def run_monte_carlo(transactions, iterations=1000, horizon_months=12):
    """
    Runs a Monte Carlo simulation based on historical transaction volatility.
    
    Args:
        transactions (list): List of historical transactions.
        iterations (int): Number of paths to simulate.
        horizon_months (int): Forecast period.
        
    Returns:
        dict: Simulation results including percentiles and paths.
    """
    if not transactions:
        return {"error": "No transactions provided for simulation"}

    # 1. Group transactions by month to find historical monthly net income
    monthly_data = {}
    for tx in transactions:
        date_str = tx.get('date', '')[:7] # YYYY-MM
        try:
            amt = float(tx.get('amount_gel', tx.get('amount', 0)))
            # Simple assumption: Revenue is positive, Expenses are positive in some systems but we'll assume category-based logic
            cat = tx.get('category', '').lower()
            if cat in ['expenses', 'cogs', 'liabilities']:
                amt = -abs(amt)
            else:
                amt = abs(amt)
                
            monthly_data[date_str] = monthly_data.get(date_str, 0) + amt
        except (ValueError, TypeError):
            continue

    if len(monthly_data) < 2:
        # Fallback if not enough history
        mean_perf = sum(monthly_data.values()) / max(len(monthly_data), 1)
        volatility = abs(mean_perf) * 0.2 # 20% default volatility
    else:
        perf_values = list(monthly_data.values())
        mean_perf = np.mean(perf_values)
        volatility = np.std(perf_values)

    # 1.5 NEW: Inject Market Sentiment (Phase 12)
    sentiment = market.get_market_sentiment()
    volatility *= sentiment.get('volatility_multiplier', 1.0)
    mean_perf += (abs(mean_perf) * sentiment.get('trend_premium', 0.0))
    
    logger.info(f"Market Sentiment Applied: {sentiment['mood']} -> New Volatility: {volatility}")

    logger.info(f"Monte Carlo Baseline - Mean: {mean_perf}, Volatility: {volatility}")

    # 2. Run Simulations
    all_paths = []
    current_actual = sum(monthly_data.values()) # Cumulative net position as starting point
    
    for _ in range(iterations):
        path = [current_actual]
        for _ in range(horizon_months):
            # Random shock based on normal distribution of historical volatility
            shock = np.random.normal(mean_perf, volatility)
            path.append(path[-1] + shock)
        all_paths.append(path)

    # 3. Analyze Results
    all_paths_np = np.array(all_paths)
    final_states = all_paths_np[:, -1]
    
    percentiles = {
        "p10": np.percentile(final_states, 10), # Pessimistic
        "p50": np.percentile(final_states, 50), # Median (Base Case)
        "p90": np.percentile(final_states, 90), # Optimistic
        "min": np.min(final_states),
        "max": np.max(final_states)
    }

    # Samples for visualization (don't send all 1000 paths to frontend)
    sample_paths = all_paths_np[:10].tolist()

    return {
        "status": "success",
        "horizon": horizon_months,
        "iterations": iterations,
        "baseline_mean": round(mean_perf, 2),
        "baseline_volatility": round(volatility, 2),
        "percentiles": {k: round(v, 2) for k, v in percentiles.items()},
        "sample_paths": sample_paths,
        "labels": [(datetime.now() + timedelta(days=30*i)).strftime("%Y-%m") for i in range(horizon_months + 1)],
        "explanation": {
            "primary_driver": "Volatility" if volatility > abs(mean_perf) else "Historical Trend",
            "sensitivity": {
                "market_volatility": round((volatility / (volatility + abs(mean_perf))) * 100, 1),
                "trend_momentum": round((abs(mean_perf) / (volatility + abs(mean_perf))) * 100, 1)
            },
            "interpretation": f"The forecast spread is primarily driven by { 'higher-than-average market volatility' if volatility > abs(mean_perf) else 'the strong historical growth trend' } observed in recent periods.",
            "market_context": sentiment.get('msg', '')
        }
    }

def generate_forecast_series(transactions):
    """
    Generates a simplified actual vs forecast series for charting.
    """
    if not transactions:
        return []

    # Calculate actuals by month
    actuals_by_month = {}
    for tx in transactions:
        month = tx.get('date', '')[:7]
        try:
            amt = float(tx.get('amount_gel', tx.get('amount', 0)))
            cat = tx.get('category', '').lower()
            if cat in ['expenses', 'cogs', 'liabilities']: amt = -abs(amt)
            else: amt = abs(amt)
            actuals_by_month[month] = actuals_by_month.get(month, 0) + amt
        except: continue

    sorted_months = sorted(actuals_by_month.keys())
    if not sorted_months: return []
    
    # Calculate baseline for forecast
    perf_values = list(actuals_by_month.values())
    mean_perf = np.mean(perf_values)
    volatility = np.std(perf_values) if len(perf_values) > 1 else abs(mean_perf) * 0.1
    
    result = []
    # 1. Historical Data
    for month in sorted_months:
        result.append({
            "name": month,
            "actual": round(actuals_by_month[month], 2),
            "forecast": round(actuals_by_month[month], 2) # Fit to actuals in history
        })
    
    # 2. Future Forecast (6 months)
    last_month = sorted_months[-1]
    last_val = actuals_by_month[last_month]
    
    from dateutil.relativedelta import relativedelta
    last_date = datetime.strptime(f"{last_month}-01", "%Y-%m-%d")
    
    for i in range(1, 7):
        next_date = last_date + relativedelta(months=i)
        next_month = next_date.strftime("%Y-%m")
        # Projection with growth + random shock
        forecast_val = last_val + (mean_perf * i)
        spread = volatility * np.sqrt(i)
        
        result.append({
            "name": next_month,
            "forecast": round(forecast_val, 2),
            "lower": round(forecast_val - spread, 2),
            "upper": round(forecast_val + spread, 2)
        })
        
    return result
