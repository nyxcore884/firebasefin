import sys
import os

# Add the functions directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'functions/5-financial-engine')))

import reports
import budget

def test_report_logic():
    transactions = [
        {"category": "Revenue", "amount_gel": 100000, "department": "Sales"},
        {"category": "Opex", "amount_gel": 50000, "department": "Logistics"},
        {"category": "Opex", "amount_gel": 10000, "department": "HR"},
        {"category": "Tax", "amount_gel": 5000, "department": "Finance"}
    ]
    
    # Mock budget data
    budget_data = budget.generate_budget(transactions)
    print("Generated Budget Summary:")
    for cat, data in budget_data.items():
        print(f"  {cat}: {data['projected']:.2f}")

    # Generate Report
    report_data = reports.generate_executive_summary(transactions, budget_data)
    print("\nExecutive Summary:")
    print(f"  Title: {report_data['title']}")
    print(f"  Status: {report_data['status']}")
    print(f"  KPIs: {report_data['kpis']}")
    print("  Highlights:")
    for h in report_data['highlights']:
        print(f"    - {h}")

    # Generate Canvas Config
    canvas_config = reports.generate_canvas_config(report_data)
    print("\nCanvas Config:")
    print(f"  Layout: {canvas_config['layout']}")
    print(f"  Elements: {len(canvas_config['elements'])}")

if __name__ == "__main__":
    test_report_logic()
