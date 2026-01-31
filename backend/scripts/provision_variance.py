from google.cloud import bigquery
import os

def run_ddl():
    client = bigquery.Client()
    ddl_path = os.path.join(os.getcwd(), 'backend', 'migrations', 'provision_variance_layer.sql')
    
    with open(ddl_path, 'r', encoding='utf-8') as f:
        sql = f.read()
    
    print(f"Executing Variance DDL from {ddl_path}...")
    try:
        query_job = client.query(sql)
        query_job.result()
        print("Variance layer provisioned successfully.")
    except Exception as e:
        print(f"Error provisioning variance layer: {e}")

if __name__ == "__main__":
    run_ddl()
