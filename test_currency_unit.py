import sys
import os
import json

# Add the functions directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'functions/5-financial-engine')))

import currency

def test_currency_logic():
    print("--- 💱 CURRENCY CONVERSION TEST ---")
    
    # 1. Test Single Amount Conversion
    amt_gel = 1000
    amt_usd = currency.convert_amount(amt_gel, "GEL", "USD")
    amt_eur = currency.convert_amount(amt_gel, "GEL", "EUR")
    
    print(f"1000 GEL ➔ USD: {amt_usd}")
    print(f"1000 GEL ➔ EUR: {amt_eur}")
    
    # 2. Test Metrics Conversion
    metrics = {
        "revenue": 50000,
        "expenses": 20000,
        "net_income": 30000,
        "status": "PASS"
    }
    
    converted_metrics = currency.convert_metrics(metrics, "GEL", "USD")
    print(f"\nMetrics (GEL): {metrics}")
    print(f"Metrics (USD): {converted_metrics}")
    
    # 3. Test Transaction Dataset Conversion
    transactions = [
        {"transaction_id": "TX-001", "amount_gel": 1000, "category": "Opex", "currency": "GEL"},
        {"transaction_id": "TX-002", "amount_gel": 2000, "category": "Revenue", "currency": "GEL"}
    ]
    
    converted_txs = currency.convert_transactions(transactions, "USD")
    print("\nTransactions (GEL ➔ USD):")
    for tx in converted_txs:
        print(f"  - ID: {tx['transaction_id']}, Amount: {tx['amount']} {tx['currency']}, Original (GEL): {tx['amount_gel']}")

    print("\n--- ✅ TEST COMPLETE ---")

if __name__ == "__main__":
    test_currency_logic()
