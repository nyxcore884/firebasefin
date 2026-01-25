import requests
import os
import logging

logger = logging.getLogger(__name__)

TRUTH_ENGINE_URL = os.getenv(
    'TRUTH_ENGINE_URL',
    'https://us-central1-studio-9381016045-4d625.cloudfunctions.net/process-transaction'
)

def get_financial_metrics(company_id, period, department="All"):
    """
    Tool: Fetches verified financial metrics from the Truth Engine.
    """
    try:
        resp = requests.post(TRUTH_ENGINE_URL, json={
            "action": "metrics",
            "company_id": company_id,
            "period": period,
            "department": department
        }, timeout=10)
        return resp.json() if resp.status_code == 200 else {"error": "Truth Engine unavailable"}
    except Exception as e:
        return {"error": str(e)}

def detect_financial_anomalies(company_id, period):
    """
    Tool: Runs the statistical anomaly detection engine.
    """
    try:
        resp = requests.post(TRUTH_ENGINE_URL, json={
            "action": "anomalies",
            "company_id": company_id,
            "period": period
        }, timeout=10)
        return resp.json() if resp.status_code == 200 else {"error": "Anomaly engine unavailable"}
    except Exception as e:
        return {"error": str(e)}

def run_strategic_simulation(company_id, iterations=1000, horizon=12):
    """
    Tool: Runs a Monte Carlo simulation for financial forecasting.
    """
    try:
        resp = requests.post(TRUTH_ENGINE_URL, json={
            "action": "simulate",
            "company_id": company_id,
            "iterations": iterations,
            "horizon": horizon
        }, timeout=20)
        return resp.json() if resp.status_code == 200 else {"error": "Simulation engine unavailable"}
    except Exception as e:
        return {"error": str(e)}

def list_group_entities(company_id):
    """
    Tool: Retrieves the corporate hierarchy for a given company.
    """
    try:
        resp = requests.post(TRUTH_ENGINE_URL, json={
            "action": "hierarchy",
            "company_id": company_id
        }, timeout=10)
        return resp.json() if resp.status_code == 200 else {"error": "Hierarchy service unavailable"}
    except Exception as e:
        return {"error": str(e)}
