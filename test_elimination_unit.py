import sys
import os
import json

# Add the functions directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'functions/5-financial-engine')))

import elimination

def test_elimination_logic():
    print("--- 🔍 INTERCOMPANY ELIMINATION TEST ---")
    
    # Sample transactions including intercompany ones
    transactions = [
        {"transaction_id": "TX-001", "category": "Revenue", "amount_gel": 10000, "counterparty": "External Client", "company_id": "SGG-001"},
        {"transaction_id": "TX-002", "category": "Opex", "amount_gel": 2000, "counterparty": "External Vendor", "company_id": "SGG-001"},
        {"transaction_id": "IC-001", "category": "Opex", "amount_gel": 5000, "counterparty": "SGG-002", "is_intercompany": True, "company_id": "SGG-001", "description": "Intercompany Management Fee"},
        {"transaction_id": "IC-002", "category": "Revenue", "amount_gel": 5000, "counterparty": "SGG-001", "is_intercompany": True, "company_id": "SGG-002", "description": "Intercompany Management Fee Revenue"}
    ]
    
    print(f"Original transaction count: {len(transactions)}")
    
    # Perform elimination
    result = elimination.perform_elimination(transactions)
    
    print(f"Status: {result['status']}")
    print(f"Eliminated count: {result['eliminated_count']}")
    print(f"Elimination total (GEL): {result['elimination_total_gel']}")
    print(f"Final consolidated count: {len(result['data'])}")
    
    print("\nElimination Logs:")
    for log in result['logs']:
        print(f"  - {log}")
        
    # Check if elimination entries exist and are negative
    elim_entries = [t for t in result['data'] if t.get('is_elimination')]
    print(f"\nGenerated Elimination Entries: {len(elim_entries)}")
    for e in elim_entries:
        print(f"  - ID: {e['transaction_id']}, Amount: {e['amount_gel']}, Original: {e['original_id']}")

    print("\n--- ✅ TEST COMPLETE ---")

if __name__ == "__main__":
    test_elimination_logic()
