"""
Vertex AI Prediction Endpoint
Serves Prophet model predictions
"""

from flask import Flask, request, jsonify
from google.cloud import storage
import pickle
import pandas as pd
from datetime import datetime

app = Flask(__name__)

# Load models on startup
MODELS = {}

def load_models():
    global MODELS
    storage_client = storage.Client()
    bucket = storage_client.bucket('YOUR-PROJECT-ml-artifacts')
    
    # Read latest model pointer
    latest_blob = bucket.blob('models/latest.txt')
    model_file = latest_blob.download_as_text().strip()
    
    # Download models
    model_blob = bucket.blob(f'models/{model_file}')
    with model_blob.open('rb') as f:
        MODELS = pickle.load(f)
    
    print(f"Loaded {len(MODELS)} models from {model_file}")

load_models()

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        item_code = data['instances'][0]['item_code']
        horizon = data['instances'][0]['horizon']
        
        if item_code not in MODELS:
            return jsonify({'error': f'No model for {item_code}'}), 404
        
        model = MODELS[item_code]
        future = model.make_future_dataframe(periods=horizon, freq='M')
        forecast = model.predict(future)
        
        predictions = []
        for _, row in forecast.tail(horizon).iterrows():
            predictions.append({
                'ds': row['ds'].strftime('%Y-%m-%d'),
                'yhat': float(row['yhat']),
                'yhat_lower': float(row['yhat_lower']),
                'yhat_upper': float(row['yhat_upper'])
            })
        
        return jsonify({'predictions': [predictions]})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'models_loaded': len(MODELS)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
