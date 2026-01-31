from fastapi import APIRouter, HTTPException, Body, Response
from app.engines.analytics.growth import growth_engine
from app.engines.analytics.simulation import simulation_engine
from app.engines.reporting.pdf_generator import pdf_generator
from app.engines.analytics.advanced_analytics import tax_leakage_engine, forecasting_engine
from app.engines.analytics.intelligence_suite import breakeven_engine, linked_scenario_engine
from app.engines.automation.pipeline_orchestrator import pipeline_orchestrator
from typing import Dict, Any

router = APIRouter()

@router.get("/growth")
async def get_mom_growth():
    """
    Get Month-over-Month Growth Analysis.
    """
    return growth_engine.calculate_mom_growth()

@router.post("/simulation")
async def run_simulation(payload: Dict[str, float] = Body(...)):
    """
    Run What-If Scenario.
    Payload: {"target_vat_rate": 0.20, "cogs_inflation_multiplier": 1.05}
    """
    target_vat = payload.get("target_vat_rate", 0.18)
    cogs_inflation = payload.get("cogs_inflation_multiplier", 1.0)
    
    return simulation_engine.run_simulation(target_vat, cogs_inflation)

@router.get("/report/{month}")
async def get_pdf_report(month: str):
    """
    Download PDF Report for a specific month (YYYY-MM).
    """
    pdf_buffer = pdf_generator.generate_pdf_summary(month)
    
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=SGP_Report_{month}.pdf"}
    )

@router.get("/tax-leakage")
async def get_tax_leakage():
    """
    Detect VAT Leakage (Theoretical vs Actual).
    """
    return tax_leakage_engine.detect_leakage()

@router.get("/forecast")
async def get_forecast():
    """
    Get AI-driven Margin Forecast.
    """
    return forecasting_engine.generate_forecast()

@router.get("/breakeven")
async def get_breakeven_analysis():
    """
    Get Breakeven Analysis (Min Margin to cover OPEX).
    """
    return breakeven_engine.calculate_breakeven()

@router.get("/scenario/linked")
async def run_linked_scenario(price_delta: float = 0.0):
    """
    Run Linked Scenario: Impact of Price Change on Cash Balance.
    """
    return linked_scenario_engine.simulate_cash_impact(price_delta)

@router.post("/pipeline/run")
async def trigger_pipeline():
    """
    Trigger the Automated Financial Data Pipeline.
    """
    return pipeline_orchestrator.run_financial_pipeline()

@router.get("/pipeline/status")
async def get_pipeline_status():
    """
    Get Real-Time Pipeline Health Stats.
    """
    return pipeline_orchestrator.get_pipeline_status()

@router.get("/reports/scorecard")
async def download_scorecard():
    """
    Download Executive Scorecard PDF.
    """
    # Mock metrics for demo - in real app query BigQuery/Views
    metrics = {
        "net_revenue": 5000000,
        "gross_margin": 1200000,
        "forecast_margin": 1150000,
        "breakeven": 0.05,
        "is_critical": False
    }
    
    pdf_buffer = pdf_generator.generate_executive_scorecard(metrics)
    
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=SGP_Executive_Scorecard.pdf"}
    )
