from firebase_functions import https_fn, options
import json
import logging
import os
import pandas as pd
import numpy as np
from prophet import Prophet

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("analysis-prognosis")

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["POST", "OPTIONS"]),
    timeout_sec=120,
    memory=options.MemoryOption.MB_512,
)
def run_financial_simulation(req: https_fn.Request) -> https_fn.Response:
    """
    HTTP Cloud Function to run Financial Prognostics using Prophet.
    Accepts: { horizon, inflation, seasonality }
    """
    try:
        body = req.get_json(silent=True) or {}
        horizon = int(body.get('horizon', 12))
        inflation = float(body.get('inflation', 2.0))
        seasonality = bool(body.get('seasonality', True))

        logger.info(f"Running simulation: Horizon={horizon}, Inflation={inflation}%, Seasonality={seasonality}")

        # Generating Synthetic "Actuals" Data
        dates = pd.date_range(start='2022-01-01', end='2024-12-31', freq='M')
        base_val = 60000
        
        df_data = []
        for i, date in enumerate(dates):
            val = base_val + (i * 250) + (np.random.normal(0, 1500))
            if date.month in [10, 11, 12]:
                val += 7000
            df_data.append({'ds': date, 'y': val})
            
        df = pd.DataFrame(df_data)

        # Prophet Modeling
        m = Prophet(yearly_seasonality=seasonality, weekly_seasonality=False, daily_seasonality=False)
        m.fit(df)

        future = m.make_future_dataframe(periods=horizon, freq='M')
        forecast = m.predict(future)
        
        forecast_tail = forecast.tail(horizon).copy()
        inflation_multiplier = 1 + (inflation / 100)
        
        results = []
        # 1. Historicals
        for _, row in df.iterrows():
            results.append({
                "month": row['ds'].strftime('%Y-%b'),
                "actual": round(row['y'], 2),
                "forecast": None,
                "lower": None,
                "upper": None
            })
            
        # 2. Forecast
        for _, row in forecast_tail.iterrows():
            adjusted_yhat = row['yhat'] * inflation_multiplier
            uncertainty = (row['yhat_upper'] - row['yhat_lower']) / 2
            if inflation > 5:
                uncertainty *= 1.3
                
            results.append({
                "month": row['ds'].strftime('%Y-%b'),
                "actual": None,
                "forecast": round(adjusted_yhat, 2),
                "lower": round(adjusted_yhat - uncertainty, 2),
                "upper": round(adjusted_yhat + uncertainty, 2)
            })

        explanation = f"Prophet Engine Analysis: Trained on {len(df)} cycles. "
        explanation += f"{'Cyclicality enabled' if seasonality else 'Linear trend focus'}. "
        explanation += f"Macro adjustment of {inflation}% applied."

        return https_fn.Response(
            json.dumps({"chartData": results, "explanation": explanation}),
            status=200,
            headers={"Content-Type": "application/json"}
        )

    except Exception as e:
        logger.exception("Analysis error: %s", e)
        return https_fn.Response(json.dumps({"error": str(e)}), status=500, headers={"Content-Type": "application/json"})
