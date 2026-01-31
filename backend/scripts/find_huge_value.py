from google.cloud import bigquery
import json

def find_huge_value():
    client = bigquery.Client()
    tables = [
        "studio-9381016045-4d625.finance_core.revenue_breakdown",
        "studio-9381016045-4d625.finance_core.income_statement",
        "studio-9381016045-4d625.finance_core.budget_fact"
    ]
    
    for table in tables:
        query = f"SELECT * FROM `{table}` WHERE amount_gel > 600000000 OR net_revenue > 600000000 OR budget_amount > 600000000 OR total_revenue > 600000000"
        try:
            results = client.query(query).result()
            data = [dict(row) for row in results]
            if data:
                print(f"Found in {table}:")
                print(json.dumps(data, default=str))
        except Exception as e:
            pass

if __name__ == "__main__":
    find_huge_value()
