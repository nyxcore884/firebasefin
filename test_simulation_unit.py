import sys
import os
import json

# Add functions path to sys.path
sys.path.append(os.path.join(os.getcwd(), 'functions', '5-financial-engine'))

import simulation

def test_mc_logic():
    print("--- 🎲 MONTE CARLO SIMULATION TEST ---")
    
    # Mock Transactions (Revenue & Expenses)
    mock_transactions = [
        {"date": "2023-01-01", "amount": 10000, "category": "Revenue"},
        {"date": "2023-01-15", "amount": 5000, "category": "Expenses"},
        {"date": "2023-02-01", "amount": 12000, "category": "Revenue"},
        {"date": "2023-02-15", "amount": 6000, "category": "Expenses"},
        {"date": "2023-03-01", "amount": 11000, "category": "Revenue"},
        {"date": "2023-03-15", "amount": 5500, "category": "Expenses"},
        {"date": "2023-04-01", "amount": 15000, "category": "Revenue"},
        {"date": "2023-04-15", "amount": 7000, "category": "Expenses"},
    ]
    
    # Run Simulation
    result = simulation.run_monte_carlo(mock_transactions, iterations=100, horizon_months=6)
    
    if "error" in result:
        print(f"❌ Test Failed: {result['error']}")
        return

    print(f"Status: {result['status']}")
    print(f"Horizon: {result['horizon']} months")
    print(f"Baseline Mean: {result['baseline_mean']}")
    print(f"Baseline Volatility: {result['baseline_volatility']}")
    print(f"Percentiles: {result['percentiles']}")
    print(f"Sample Paths Generated: {len(result['sample_paths'])}")
    
    # Verify p90 > p50 > p10
    p = result['percentiles']
    if p['p90'] > p['p50'] > p['p10']:
        print("✅ Probabilistic Distribution Logic: VALID")
    else:
        print("❌ Probabilistic Distribution Logic: INVALID")
        print(p)

    print("--- ✅ TEST COMPLETE ---")

if __name__ == "__main__":
    test_mc_logic()
