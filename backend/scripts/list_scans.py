from google.cloud import bigquery
import json

def list_scans():
    client = bigquery.Client()
    query = """
        SELECT * 
        FROM `studio-9381016045-4d625.sgp_financial_intelligence.ai_feedback_loop` 
        WHERE user_query LIKE 'SYSTEM_SCAN%'
        LIMIT 20
    """
    try:
        results = client.query(query).result()
        data = [dict(row) for row in results]
        print(json.dumps(data, default=str))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_scans()
