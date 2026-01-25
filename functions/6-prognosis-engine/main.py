from firebase_functions import https_fn, options
import json
import logging
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LinearRegression

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("prognosis-engine")

class PrognosisModel:
    def __init__(self):
        self.baseline_revenue = 100000000.0 # 100M GEL Base
        
    def generate_synthetic_history(self, periods=365, category='total'):
        """Generates synthetic daily data for training if no history provided."""
        dates = pd.date_range(end=pd.Timestamp.now(), periods=periods)
        df = pd.DataFrame({'ds': dates})
        
        if category == 'social_gas':
            base, growth, noise = 60000000.0, 0.0002, 30000
        elif category == 'commercial_gas':
            base, growth, noise = 30000000.0, 0.0008, 40000
        else:
            base, growth, noise = 100000000.0, 0.0005, 50000

        df['y'] = base / 365 * (1 + growth * df.index) + np.random.normal(0, noise, len(df))
        
        if 'gas' in category:
            df['month'] = df['ds'].dt.month
            df['seasonality'] = df['month'].apply(lambda m: 1.4 if m in [1, 2, 12] else (0.7 if m in [6, 7, 8] else 1.0))
            df['y'] = df['y'] * df['seasonality']

        return df

    def predict(self, assumptions: dict, historical_data: list = None) -> dict:
        """
        Predicts financial outcomes using Linear Regression + Isolation Forest.
        """
        category = assumptions.get('category', 'total')
        if historical_data:
            df = pd.DataFrame(historical_data)
        else:
            df = self.generate_synthetic_history(category=category)
            
        if 'date' in df.columns: df.rename(columns={'date': 'ds'}, inplace=True)
        if 'value' in df.columns: df.rename(columns={'value': 'y'}, inplace=True)

        # Anomaly Detection
        iso_model = IsolationForest(contamination=0.01, random_state=42)
        df['anomaly'] = iso_model.fit_predict(df[['y']])
        anomalies = df[df['anomaly'] == -1].tail(5).to_dict(orient='records')

        # Forecasting
        df['ds_ordinal'] = pd.to_datetime(df['ds']).map(pd.Timestamp.toordinal)
        reg = LinearRegression()
        reg.fit(df[['ds_ordinal']], df['y'])
        
        future_dates = pd.date_range(start=df['ds'].max() + pd.Timedelta(days=1), periods=365)
        future_df = pd.DataFrame({'ds': future_dates})
        future_df['ds_ordinal'] = future_df['ds'].map(pd.Timestamp.toordinal)
        future_df['yhat'] = reg.predict(future_df[['ds_ordinal']])
        
        # Seasonality (Winter Peak)
        future_df['month_num'] = future_df['ds'].dt.month
        future_df['seasonality'] = future_df['month_num'].apply(lambda m: 1.2 if m in [1, 2, 12] else (0.8 if m in [6, 7, 8] else 1.0))
        future_df['yhat'] = future_df['yhat'] * future_df['seasonality']
        
        # Sensitivity
        impact = float(assumptions.get('gas_price_impact', 0))
        future_df['yhat'] = future_df['yhat'] * (1 + impact)

        # Build monthly forecast
        future_df['month'] = future_df['ds'].dt.strftime('%Y-%m')
        monthly = future_df.groupby('month')['yhat'].sum().reset_index()
        
        time_series = []
        for _, row in monthly.tail(12).iterrows():
            time_series.append({
                "month": row['month'],
                "baseline": round(row['yhat'], 2),
                "optimistic": round(row['yhat'] * 1.1, 2),
                "pessimistic": round(row['yhat'] * 0.9, 2)
            })

        return {
            "status": "success",
            "model": "LinearRegression + IsolationForest",
            "anomalies_detected": len(anomalies),
            "forecast_annual_revenue": round(monthly['yhat'].tail(12).sum(), 2),
            "time_series": time_series
        }

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["POST", "OPTIONS"]),
    timeout_sec=60,
    memory=options.MemoryOption.MB_512,
)
def generate_prognosis(req: https_fn.Request) -> https_fn.Response:
    try:
        body = req.get_json(silent=True) or {}
        logger.info(f"Prognosis Request: {body}")
        assumptions = body.get('assumptions', {})
        model = PrognosisModel()
        result = model.predict(assumptions)
        return https_fn.Response(json.dumps(result), status=200, headers={"Content-Type": "application/json"})
    except Exception as e:
        logger.exception("Prognosis failed")
        return https_fn.Response(json.dumps({"error": str(e)}), status=500, headers={"Content-Type": "application/json"})
