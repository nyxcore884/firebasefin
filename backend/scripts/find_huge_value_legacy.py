from google.cloud import bigquery
import json

def find_huge_value_legacy():
    client = bigquery.Client()
    tables = [
        "studio-9381016045-4d625.sgp_financial_intelligence.revenue_data",
        "studio-9381016045-4d625.sgp_financial_intelligence.cogs_data"
    ]
    
    for table in tables:
        # Searching all columns for the value (approximate)
        query = f"SELECT * FROM `{table}`"
        try:
            results = client.query(query).to_dataframe()
            # Find any row where any column contains a value near 611,893,064
            # We use to_dataframe to search across all columns easily
            match = results[(results.select_dtypes(include='number') > 600000000).any(axis=1)]
            if not match.empty:
                print(f"Found in {table}:")
                print(match.to_json(orient='records'))
        except Exception as e:
            # print(f"Error checking {table}: {e}")
            pass

if __name__ == "__main__":
    find_huge_value_legacy()
