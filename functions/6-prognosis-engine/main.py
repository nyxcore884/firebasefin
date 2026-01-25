from firebase_functions import https_fn
import json

<<<<<<< Updated upstream
# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Mock Data & ML Model ---
# In a real scenario, this would load from Firestore and use a trained .h5 model.

class PrognosisModel:
    def __init__(self):
        self.baseline_revenue = 100000000.0 # 100M GEL Base
        # Lazy imports are handled in methods

        
    def generate_synthetic_history(self, periods=365, category='total'):
        """Generates synthetic daily data for training if no history provided."""
        import pandas as pd
        import numpy as np
        
        dates = pd.date_range(end=pd.Timestamp.now(), periods=periods)
        df = pd.DataFrame({'ds': dates})
        
        # Define characteristics per category (SOCAR Logic)
        if category == 'social_gas':
            base = 60000000.0 # 60M
            growth = 0.0002
            noise = 30000
            # Strong winter seasonality
        elif category == 'commercial_gas':
            base = 30000000.0 # 30M
            growth = 0.0008 # Higher growth
            noise = 40000
        else: # Total or unknown
            base = 100000000.0
            growth = 0.0005
            noise = 50000

        # Simulate seasonality and trend
        # Simple sinusoidal seasonality for demo (Peak in Jan/Feb for gas)
        df['y'] = base / 365 * (1 + growth * df.index) + np.random.normal(0, noise, len(df))
        
        # Add Gas Seasonality (Peak in Winter)
        if 'gas' in category:
            df['month'] = df['ds'].dt.month
            # Simple factor: 1.5x in Jan/Feb, 0.6x in July
            df['seasonality'] = df['month'].apply(lambda m: 1.4 if m in [1, 2, 12] else (0.7 if m in [6, 7, 8] else 1.0))
            df['y'] = df['y'] * df['seasonality']

        return df

    def predict(self, assumptions: dict, historical_data: list = None) -> dict:
        """
        Predicts financial outcomes using sklearn for trend forecasting
        and Isolation Forest for anomaly detection.
        (Prophet removed due to Windows compatibility issues in emulator)
        """
        import pandas as pd
        import numpy as np
        from sklearn.ensemble import IsolationForest
        from sklearn.linear_model import LinearRegression

        # 1. Prepare Data
        category = assumptions.get('category', 'total')
        if historical_data:
            df = pd.DataFrame(historical_data)
        else:
            df = self.generate_synthetic_history(category=category)
            
        # Ensure correct columns
        if 'date' in df.columns: df.rename(columns={'date': 'ds'}, inplace=True)
        if 'value' in df.columns: df.rename(columns={'value': 'y'}, inplace=True)

        # 2. Anomaly Detection (Isolation Forest)
        iso_model = IsolationForest(contamination=0.01, random_state=42)
        df['anomaly'] = iso_model.fit_predict(df[['y']])
        
        # Serialize timestamps for JSON response
        df_anom = df.copy()
        if 'ds' in df_anom.columns:
            df_anom['ds'] = df_anom['ds'].dt.strftime('%Y-%m-%d')
            
        anomalies = df_anom[df_anom['anomaly'] == -1].to_dict(orient='records')

        # 3. Forecasting (Linear Regression Trend + Seasonality)
        # Convert date to ordinal for regression
        df['ds_ordinal'] = pd.to_datetime(df['ds']).map(pd.Timestamp.toordinal)
        
        reg = LinearRegression()
        reg.fit(df[['ds_ordinal']], df['y'])
        
        # Future dates
        future_dates = pd.date_range(start=df['ds'].max() + pd.Timedelta(days=1), periods=365)
        future_df = pd.DataFrame({'ds': future_dates})
        future_df['ds_ordinal'] = future_df['ds'].map(pd.Timestamp.toordinal)
        
        # Predict trend
        future_df['yhat'] = reg.predict(future_df[['ds_ordinal']])
        
        # Add simple seasonality (just noise/sine wave for demo)
        # If we had real seasonality logic, we'd apply it here.
        # Re-using the logic from generate_synthetic_history for consistency if implicit
        future_df['month'] = future_df['ds'].dt.month
        # Peak in Winter (Gas logic)
        future_df['seasonality'] = future_df['month'].apply(lambda m: 1.2 if m in [1, 2, 12] else (0.8 if m in [6, 7, 8] else 1.0))
        future_df['yhat'] = future_df['yhat'] * future_df['seasonality']
        
        # Confidence intervals (mocked as +/- 10%)
        future_df['yhat_lower'] = future_df['yhat'] * 0.9
        future_df['yhat_upper'] = future_df['yhat'] * 1.1

        forecast = future_df
        
        # Apply Assumptions (Sensitivity Analysis on the Forecast)
        gas_price_impact = assumptions.get('gas_price_impact', 0) # e.g. -0.05 for 5% drop
        forecast['yhat'] = forecast['yhat'] * (1 + float(gas_price_impact))
        forecast['yhat_lower'] = forecast['yhat_lower'] * (1 + float(gas_price_impact))
        forecast['yhat_upper'] = forecast['yhat_upper'] * (1 + float(gas_price_impact))


        # Format output for Frontend
        forecast['month'] = forecast['ds'].dt.strftime('%Y-%m')
        monthly_forecast = forecast.groupby('month')[['yhat', 'yhat_lower', 'yhat_upper']].sum().reset_index()
        
        time_series = []
        for _, row in monthly_forecast.tail(12).iterrows():
            time_series.append({
                "month": row['month'],
                "baseline": round(row['yhat'], 2),
                "optimistic": round(row['yhat_upper'], 2),
                "pessimistic": round(row['yhat_lower'], 2)
            })

        return {
            "status": "success",
            "model": "LinearRegression + IsolationForest",
            "anomalies_detected": len(anomalies),
            "latest_anomalies": anomalies[-5:] if anomalies else [],
            "forecast_annual_revenue": round(monthly_forecast['yhat'].tail(12).sum(), 2),
            "time_series": time_series
        }

# --- Cloud Function Entry Point ---

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["post", "options"]),
    timeout_sec=60,
    memory=options.MemoryOption.MB_512,
)
def generate_prognosis(req: https_fn.Request) -> https_fn.Response:
    """
    HTTP Cloud Function to generate financial prognosis.
    """
    try:
        request_json = req.get_json(silent=True)
        if not request_json:
            return https_fn.Response(json.dumps({"error": "Invalid JSON"}), status=400, headers={"Content-Type": "application/json"})

        logger.info(f"Received Prognosis Request: {request_json}")
        
        assumptions = request_json.get('assumptions', {})
        
        model = PrognosisModel()
        result = model.predict(assumptions)
        
        return https_fn.Response(json.dumps(result), status=200, headers={"Content-Type": "application/json"})

    except Exception as e:
        logger.error(f"Error processing prognosis: {e}")
        return https_fn.Response(json.dumps({"error": str(e)}), status=500, headers={"Content-Type": "application/json"})
=======
@https_fn.on_request()
def generate_prognosis(req):
    return https_fn.Response(json.dumps({"error": "Service Deprecated"}), status=410)
>>>>>>> Stashed changes
