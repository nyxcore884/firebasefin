from google.cloud import bigquery
import os

def run_ddl():
    client = bigquery.Client()
    ddl_path = os.path.join(os.getcwd(), 'backend', 'migrations', 'provision_canonical_layer.sql')
    
    with open(ddl_path, 'r', encoding='utf-8') as f:
        sql = f.read()
    
    # BigQuery split queries by semicolon usually needs individual execution or a script
    # But bq query handles scripts.
    print(f"Executing DDL from {ddl_path}...")
    try:
        query_job = client.query(sql)
        query_job.result()
        print("Canonical layer provisioned successfully.")
    except Exception as e:
        print(f"Error provisioning canonical layer: {e}")

if __name__ == "__main__":
    run_ddl()
