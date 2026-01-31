from google.cloud import bigquery
import json

def dump_feedback():
    client = bigquery.Client()
    query = """
        SELECT * 
        FROM `studio-9381016045-4d625.sgp_financial_intelligence.ai_feedback_loop` 
        ORDER BY timestamp DESC
        LIMIT 100
    """
    try:
        results = client.query(query).result()
        data = [dict(row) for row in results]
        print(json.dumps(data, default=str))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    dump_feedback()
