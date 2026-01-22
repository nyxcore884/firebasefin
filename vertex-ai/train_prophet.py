
"""
Vertex AI Custom Training Script
Trains Prophet model on BigQuery data
Triggered by ML Tuning page via Cloud Run API
"""

import argparse
import pandas as pd
from prophet import Prophet
from google.cloud import bigquery, aiplatform, storage
import google.auth
import pickle
import json
from datetime import datetime
import os

def parse_args():
    parser = argparse.ArgumentParser(description='Train Prophet forecasting model')
    parser.add_argument('--horizon', type=int, default=12, help='Forecast horizon in months')
    parser.add_argument('--seasonality', type=str, default='multiplicative', choices=['additive', 'multiplicative'])
    parser.add_argument('--project', type=str, required=True, help='GCP Project ID')
    parser.add_argument('--changepoint-prior', type=float, default=0.05, help='Changepoint prior scale')
    parser.add_argument('--dataset', type=str, default='financial_data', help='BigQuery dataset')
    parser.add_argument('--table', type=str, default='consolidated_ledger', help='BigQuery table')
    return parser.parse_args()

def load_training_data(project_id: str, dataset: str, table: str):
    """
    Load training data from BigQuery
    Returns DataFrame with 'ds' (date) and 'y' (value) columns
    """
    client = bigquery.Client(project=project_id)
    
    query = f"""
        SELECT 
            transaction_date as ds,
            item_code as itemCode,
            SUM(amount) as y
        FROM EXTERNAL_QUERY(
            '{project_id}.us-central1.external_postgres',
            'SELECT transaction_date, item_code, amount FROM transactions'
        )
        GROUP BY 1, 2
        ORDER BY 2, 1
    """
    
    print(f"Loading training data from {project_id}.{dataset}.{table}...")
    df = client.query(query).to_dataframe()
    
    # Convert date column
    df['ds'] = pd.to_datetime(df['ds'])
    
    print(f"Loaded {len(df)} rows for {df['itemCode'].nunique()} items")
    return df

def train_model_for_item(df: pd.DataFrame, item_code: str, config: dict) -> Prophet:
    """
    Train Prophet model for a specific item code
    """
    # Filter data for this item
    item_data = df[df['itemCode'] == item_code][['ds', 'y']].copy()
    
    if len(item_data) < 10:
        raise ValueError(f"Insufficient data for {item_code}: {len(item_data)} rows")
    
    print(f"\nTraining model for {item_code}...")
    print(f"  Data points: {len(item_data)}")
    print(f"  Date range: {item_data['ds'].min()} to {item_data['ds'].max()}")
    print(f"  Value range: {item_data['y'].min():.2f} to {item_data['y'].max():.2f}")
    
    # Initialize Prophet with config
    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=False,
        daily_seasonality=False,
        seasonality_mode=config['seasonality'],
        changepoint_prior_scale=config['changepoint_prior'],
        interval_width=0.95
    )
    
    # Fit model
    model.fit(item_data)
    
    # Cross-validation for accuracy
    from prophet.diagnostics import cross_validation, performance_metrics
    
    df_cv = cross_validation(
        model, 
        initial='180 days', 
        period='30 days', 
        horizon='90 days'
    )
    df_metrics = performance_metrics(df_cv)
    
    print(f"  MAPE: {df_metrics['mape'].mean():.2f}")
    print(f"  RMSE: {df_metrics['rmse'].mean():.2f}")
    
    return model, df_metrics

def save_models(models: dict, metrics: dict, config: dict, project_id: str):
    """
    Save trained models to GCS
    """
    storage_client = storage.Client(project=project_id)
    bucket_name = f"{project_id}-ml-artifacts"
    bucket = storage_client.bucket(bucket_name)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Save models
    models_blob = bucket.blob(f'models/prophet_models_{timestamp}.pkl')
    with models_blob.open('wb') as f:
        pickle.dump(models, f)
    
    print(f"\nSaved models to gs://{bucket_name}/models/prophet_models_{timestamp}.pkl")
    
    # Save metrics
    metrics_blob = bucket.blob(f'models/metrics_{timestamp}.json')
    metrics_blob.upload_from_string(json.dumps(metrics, indent=2, default=str))
    
    # Save config
    config_blob = bucket.blob(f'models/config_{timestamp}.json')
    config_blob.upload_from_string(json.dumps(config, indent=2))
    
    # Update 'latest' pointer
    latest_blob = bucket.blob('models/latest.txt')
    latest_blob.upload_from_string(f'prophet_models_{timestamp}.pkl')
    
    return f'gs://{bucket_name}/models/prophet_models_{timestamp}.pkl'

def deploy_to_endpoint(model_path: str, project_id: str, region: str = 'us-central1'):
    """
    Deploy trained model to Vertex AI endpoint
    """
    aiplatform.init(project=project_id, location=region)
    
    # Upload model
    model = aiplatform.Model.upload(
        display_name=f"prophet-forecast-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        artifact_uri=model_path.rsplit('/', 1)[0],
        serving_container_image_uri=f"gcr.io/{project_id}/prophet-serving:latest"
    )
    
    print(f"\nModel uploaded: {model.resource_name}")
    
    # Deploy to endpoint
    endpoint = model.deploy(
        machine_type="n1-standard-2",
        min_replica_count=1,
        max_replica_count=3
    )
    
    print(f"Model deployed to endpoint: {endpoint.resource_name}")
    
    return endpoint.resource_name

def main():
    args = parse_args()
    
    config = {
        'horizon': args.horizon,
        'seasonality': args.seasonality,
        'changepoint_prior': args.changepoint_prior,
        'training_date': datetime.now().isoformat()
    }
    
    print("=" * 80)
    print("VERTEX AI PROPHET TRAINING")
    print("=" * 80)
    print(f"Configuration:")
    print(json.dumps(config, indent=2))
    print("=" * 80)
    
    # Load data
    df = load_training_data(args.project, args.dataset, args.table)
    
    # Get unique item codes
    item_codes = df['itemCode'].unique()
    print(f"\nTraining models for {len(item_codes)} item codes...")
    
    # Train models
    models = {}
    all_metrics = {}
    
    for item_code in item_codes[:10]:  # Limit to 10 items for demo
        try:
            model, metrics = train_model_for_item(df, item_code, config)
            models[item_code] = model
            all_metrics[item_code] = {
                'mape': float(metrics['mape'].mean()),
                'rmse': float(metrics['rmse'].mean()),
                'coverage': float(metrics['coverage'].mean())
            }
        except Exception as e:
            print(f"  ERROR training {item_code}: {str(e)}")
            continue
    
    print(f"\nSuccessfully trained {len(models)} models")
    
    # Save models
    model_path = save_models(models, all_metrics, config, args.project)
    
    # Deploy to endpoint
    try:
        endpoint = deploy_to_endpoint(model_path, args.project)
        print(f"\n✓ Deployment complete: {endpoint}")
    except Exception as e:
        print(f"\n✗ Deployment failed: {str(e)}")
        print("  Models saved to GCS but not deployed")
    
    # Calculate overall accuracy
    overall_mape = sum(m['mape'] for m in all_metrics.values()) / len(all_metrics)
    accuracy = max(0, 100 - overall_mape)
    
    print("\n" + "=" * 80)
    print("TRAINING COMPLETE")
    print("=" * 80)
    print(f"Models trained: {len(models)}")
    print(f"Overall accuracy: {accuracy:.2f}%")
    print(f"Model path: {model_path}")
    print("=" * 80)

if __name__ == '__main__':
    main()