from google.cloud import bigquery
import json

def check_totals():
    client = bigquery.Client()
    query = """
        SELECT SUM(amount_gel) as total_gross, SUM(net_revenue) as total_net
        FROM `studio-9381016045-4d625.finance_core.revenue_breakdown`
    """
    try:
        results = client.query(query).result()
        data = [dict(row) for row in results]
        print(json.dumps(data, default=str))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_totals()
