import logging

logger = logging.getLogger(__name__)

def build_hierarchy(transactions, company_name="Selected Entity", budget_data=None):
    """
    Transforms flat transaction records into a hierarchical tree-like structure.
    Structure: Company -> Departments -> Income Statement/Balance Sheet -> Categories -> Values
    """
    if not transactions:
        return []

    # Initialize Company Node
    company = {
        "id": "root",
        "name": company_name,
        "subsidiaries": [
            {
                "id": "sub_1",
                "name": "Consolidated Operations",
                "departments": []
            }
        ]
    }

    # Group by Department
    depts_data = {}
    for t in transactions:
        dept_name = t.get('department', 'General')
        if dept_name not in depts_data:
            depts_data[dept_name] = []
        depts_data[dept_name].append(t)

    for dept_name, dept_transactions in depts_data.items():
        dept_node = {
            "id": f"dept_{dept_name.lower().replace(' ', '_')}",
            "name": dept_name,
            "financials": {
                "incomeStatement": {
                    "id": "is",
                    "name": "Income Statement",
                    "value": {"actual": 0, "budget": 0, "variance": 0},
                    "children": []
                },
                "assets": {
                    "id": "assets",
                    "name": "Assets",
                    "value": {"actual": 0, "budget": 0, "variance": 0},
                    "children": []
                },
                "liabilities": {
                    "id": "liab",
                    "name": "Liabilities",
                    "value": {"actual": 0, "budget": 0, "variance": 0},
                    "children": []
                },
                "equity": {
                    "id": "equity",
                    "name": "Equity",
                    "value": {"actual": 0, "budget": 0, "variance": 0},
                    "children": []
                }
            }
        }

        # Simplified logic to populate IS and BS
        for t in dept_transactions:
            amt = float(t.get('amount_gel', 0))
            category = t.get('category', 'Uncategorized')
            
            # Simple heuristic for classification
            if category.lower() in ['revenue', 'income', 'sales']:
                target = dept_node["financials"]["incomeStatement"]
            elif category.lower() in ['expense', 'cogs', 'opex']:
                target = dept_node["financials"]["incomeStatement"]
            elif category.lower() in ['asset', 'cash', 'receivable']:
                target = dept_node["financials"]["assets"]
            elif category.lower() in ['liability', 'payable', 'loan']:
                target = dept_node["financials"]["liabilities"]
            else:
                target = dept_node["financials"]["equity"]

            # Update Branch Total
            target["value"]["actual"] += amt
            
            # Use smart budget if available
            b_val = 0
            if budget_data and category in budget_data:
                b_val = budget_data[category]['projected']
            else:
                b_val = amt * 0.95 # Fallback
                
            target["value"]["budget"] += b_val
            target["value"]["variance"] = target["value"]["actual"] - target["value"]["budget"]

            # Add/Update Child Node (Category)
            existing_child = next((c for c in target["children"] if c["name"] == category), None)
            if not existing_child:
                child_node = {
                    "id": f"{target['id']}_{category.lower().replace(' ', '_')}",
                    "name": category,
                    "glCode": t.get('account'),
                    "value": {"actual": 0, "budget": 0, "variance": 0},
                    "children": []
                }
                target["children"].append(child_node)
                existing_child = child_node

            existing_child["value"]["actual"] += amt
            existing_child["value"]["budget"] += b_val
            existing_child["value"]["variance"] = existing_child["value"]["actual"] - existing_child["value"]["budget"]

        company["subsidiaries"][0]["departments"].append(dept_node)

    return [company]
