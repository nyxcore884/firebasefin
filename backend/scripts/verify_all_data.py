from google.cloud import bigquery
from app.core.config import settings

def verify():
    client = bigquery.Client()
    tables = [
        "sgp_financial_intelligence.revenue_data",
        "sgp_financial_intelligence.cogs_data",
        "finance_core.variance_fact"
    ]
    for table in tables:
        try:
            job = client.query(f"SELECT count(*) as cnt FROM `{settings.PROJECT_ID}.{table}`")
            cnt = list(job.result())[0].cnt
            print(f"Table {table}: {cnt} rows")
        except Exception as e:
            print(f"Table {table}: Error - {e}")

if __name__ == "__main__":
    verify()
