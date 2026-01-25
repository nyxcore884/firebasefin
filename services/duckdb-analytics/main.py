from flask import Flask, request, jsonify
import os
import json
import logging
import duckdb
import pandas as pd
try:
    from google.cloud import bigquery
    BQ_AVAILABLE = True
except Exception:
    BQ_AVAILABLE = False
try:
    from google.cloud import firestore
    FS_AVAILABLE = True
except Exception:
    FS_AVAILABLE = False

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/api/v1/duckdb/query', methods=['POST'])
def run_query():
    payload = request.get_json(silent=True) or {}
    source = payload.get('source', 'bigquery')
    sql = payload.get('sql')
    table = payload.get('table')
    
    if not sql and not table:
        return jsonify({"error": "Provide 'sql' or 'table' in payload"}), 400
        
    if source == 'bigquery':
        if not BQ_AVAILABLE:
            return jsonify({"error": "BigQuery client not available"}), 500
        client = bigquery.Client()
        
        if table and not sql:
            query = f"SELECT * FROM `{table}` LIMIT 1000000"
        elif sql:
            query = payload.get('bq_query') or (f"SELECT * FROM `{table}` LIMIT 1000000" if table else None)
            if not query:
                return jsonify({"error": "Provide 'bq_query' when using custom DuckDB SQL"}), 400
        else:
            query = f"SELECT * FROM `{table}` LIMIT 1000000"
            
        job = client.query(query)
        df = job.to_dataframe()
        
    elif source == 'firestore':
        if not FS_AVAILABLE:
            return jsonify({"error": "Firestore client not available"}), 500
        collection = payload.get('collection')
        if not collection:
            return jsonify({"error": "Provide 'collection' for firestore source"}), 400
            
        client = firestore.Client()
        docs = client.collection(collection).limit(10000).stream()
        rows = [doc.to_dict() for doc in docs]
        df = pd.DataFrame(rows)
    else:
        return jsonify({"error": f"Unknown source: {source}"}), 400
        
    if len(df) == 0:
        return jsonify({"error": "No rows fetched from source"}), 400
        
    if len(df) > 1_000_000:
        df = df.head(1_000_000)
        
    # DuckDB Execution
    conn = duckdb.connect(database=':memory:')
    conn.register('data', df)
    
    user_sql = sql or payload.get('default_sql') or f"SELECT COUNT(*) as rows FROM data"
    
    try:
        result_df = conn.execute(user_sql).fetch_df()
    except Exception as e:
        logger.exception("DuckDB query failed: %s", e)
        return jsonify({"error": str(e)}), 400
        
    result_json = result_df.to_dict(orient='records')
    return jsonify({"rows": result_json, "row_count": len(result_json)})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
