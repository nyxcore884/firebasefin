from fastapi import APIRouter, HTTPException, Query
from app.services.bigquery_service import bq_service
from app.services.deterministic_engine import DeterministicEngine
from app.core.config import settings
from google.cloud import bigquery
from typing import Optional, Dict, List
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/dashboard/metrics")
async def get_dashboard_metrics(
    org_id: str = Query(..., description="Organization ID"),
    period: str = Query("current_month", description="Period: current_month, current_quarter, current_year")
):
    """
    Get comprehensive dashboard metrics for a company
    
    Returns:
    - Total Revenue (current vs previous)
    - Total Expenses
    - EBITDA
    - Top 5 revenue products
    - Top 5 expense categories
    - Revenue trend (last 12 months)
    - Growth percentages
    """
    try:
        # Initialize deterministic engine
        engine = DeterministicEngine()
        
        # Calculate period dates
        current_period, previous_period = _calculate_periods(period)
        
        # Get current metrics
        current_metrics = await _get_period_metrics(org_id, current_period, engine)
        
        # Get previous metrics for comparison
        previous_metrics = await _get_period_metrics(org_id, previous_period, engine)
        
        # Get top products
        top_products = await _get_top_products(org_id, current_period)
        
        # Get top expenses
        top_expenses = await _get_top_expenses(org_id, current_period)
        
        # Get revenue trend (last 12 months)
        revenue_trend = await _get_revenue_trend(org_id)
        
        # Calculate growth percentages
        revenue_growth = _calculate_growth(
            current_metrics.get("total_revenue", 0),
            previous_metrics.get("total_revenue", 0)
        )
        
        ebitda_growth = _calculate_growth(
            current_metrics.get("ebitda", 0),
            previous_metrics.get("ebitda", 0)
        )
        
        return {
            "success": True,
            "data": {
                "current_period": current_period,
                "previous_period": previous_period,
                "metrics": {
                    "total_revenue": {
                        "current": current_metrics.get("total_revenue", 0),
                        "previous": previous_metrics.get("total_revenue", 0),
                        "growth_percentage": revenue_growth
                    },
                    "total_cogs": {
                        "current": current_metrics.get("total_cogs", 0),
                        "previous": previous_metrics.get("total_cogs", 0)
                    },
                    "gross_profit": {
                        "current": current_metrics.get("gross_profit", 0),
                        "previous": previous_metrics.get("gross_profit", 0)
                    },
                    "total_expenses": {
                        "current": current_metrics.get("total_expenses", 0),
                        "previous": previous_metrics.get("total_expenses", 0)
                    },
                    "ebitda": {
                        "current": current_metrics.get("ebitda", 0),
                        "previous": previous_metrics.get("ebitda", 0),
                        "growth_percentage": ebitda_growth
                    },
                    "profit_margin": {
                        "current": _calculate_margin(
                            current_metrics.get("gross_profit", 0),
                            current_metrics.get("total_revenue", 0)
                        ),
                        "previous": _calculate_margin(
                            previous_metrics.get("gross_profit", 0),
                            previous_metrics.get("total_revenue", 0)
                        )
                    }
                },
                "top_products": top_products,
                "top_expenses": top_expenses,
                "revenue_trend": revenue_trend
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get dashboard metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get metrics: {str(e)}")


async def _get_period_metrics(org_id: str, period: str, engine: DeterministicEngine) -> Dict:
    """Get metrics for a specific period"""
    try:
        # Use deterministic engine for calculations
        revenue_trends = engine.calculate_metrics(
            org_id=org_id,
            metric_type="revenue_trends",
            period=period
        )
        
        expenses = engine.calculate_metrics(
            org_id=org_id,
            metric_type="top_expenses",
            period=period
        )
        
        profit_margin = engine.calculate_metrics(
            org_id=org_id,
            metric_type="profit_margin",
            period=period
        )
        
        return {
            "total_revenue": revenue_trends.get("total", 0),
            "total_cogs": profit_margin.get("total_cogs", 0),
            "gross_profit": profit_margin.get("gross_profit", 0),
            "total_expenses": sum(e.get("amount", 0) for e in expenses.get("data", [])),
            "ebitda": profit_margin.get("gross_profit", 0) - sum(e.get("amount", 0) for e in expenses.get("data", []))
        }
        
    except Exception as e:
        logger.warning(f"Failed to get period metrics, returning zeros: {str(e)}")
        return {
            "total_revenue": 0,
            "total_cogs": 0,
            "gross_profit": 0,
            "total_expenses": 0,
            "ebitda": 0
        }


async def _get_top_products(org_id: str, period: str, limit: int = 5) -> List[Dict]:
    """Get top revenue-generating products"""
    try:
        dataset = _get_dataset_for_org(org_id)
        
        query = f"""
            SELECT 
                product_name,
                SUM(revenue) as total_revenue,
                SUM(quantity) as total_quantity
            FROM `{settings.PROJECT_ID}.{dataset}.financial_records`
            WHERE org_id = @org_id
                AND period = @period
                AND product_name IS NOT NULL
            GROUP BY product_name
            ORDER BY total_revenue DESC
            LIMIT {limit}
        """
        
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("org_id", "STRING", org_id),
                bigquery.ScalarQueryParameter("period", "STRING", period)
            ]
        )
        
        query_job = bq_service.client.query(query, job_config=job_config)
        results = query_job.result()
        
        products = []
        for row in results:
            products.append({
                "name": row.product_name,
                "revenue": float(row.total_revenue) if row.total_revenue else 0.0,
                "quantity": float(row.total_quantity) if row.total_quantity else 0.0
            })
        
        return products
        
    except Exception as e:
        logger.warning(f"Failed to get top products: {str(e)}")
        return []


async def _get_top_expenses(org_id: str, period: str, limit: int = 5) -> List[Dict]:
    """Get top expense categories"""
    try:
        dataset = _get_dataset_for_org(org_id)
        
        query = f"""
            SELECT 
                category,
                SUM(debit - credit) as total_amount
            FROM `{settings.PROJECT_ID}.{dataset}.financial_records`
            WHERE org_id = @org_id
                AND period = @period
                AND category LIKE '%expense%'
            GROUP BY category
            ORDER BY total_amount DESC
            LIMIT {limit}
        """
        
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("org_id", "STRING", org_id),
                bigquery.ScalarQueryParameter("period", "STRING", period)
            ]
        )
        
        query_job = bq_service.client.query(query, job_config=job_config)
        results = query_job.result()
        
        expenses = []
        for row in results:
            expenses.append({
                "category": row.category,
                "amount": float(row.total_amount) if row.total_amount else 0.0
            })
        
        return expenses
        
    except Exception as e:
        logger.warning(f"Failed to get top expenses: {str(e)}")
        return []


async def _get_revenue_trend(org_id: str, months: int = 12) -> List[Dict]:
    """Get revenue trend for last N months"""
    try:
        dataset = _get_dataset_for_org(org_id)
        
        query = f"""
            SELECT 
                period,
                SUM(CASE WHEN category = 'revenue' THEN debit - credit ELSE 0 END) as revenue
            FROM `{settings.PROJECT_ID}.{dataset}.financial_records`
            WHERE org_id = @org_id
            GROUP BY period
            ORDER BY period DESC
            LIMIT {months}
        """
        
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("org_id", "STRING", org_id)
            ]
        )
        
        query_job = bq_service.client.query(query, job_config=job_config)
        results = query_job.result()
        
        trend = []
        for row in results:
            trend.append({
                "period": row.period,
                "revenue": float(row.revenue) if row.revenue else 0.0
            })
        
        # Reverse to get chronological order
        trend.reverse()
        
        return trend
        
    except Exception as e:
        logger.warning(f"Failed to get revenue trend: {str(e)}")
        return []


def _calculate_periods(period_type: str) -> tuple:
    """Calculate current and previous period strings"""
    now = datetime.now()
    
    if period_type == "current_month":
        current = now.strftime("%Y-%m")
        previous = (now - relativedelta(months=1)).strftime("%Y-%m")
    elif period_type == "current_quarter":
        quarter = (now.month - 1) // 3 + 1
        current = f"{now.year}-Q{quarter}"
        prev_date = now - relativedelta(months=3)
        prev_quarter = (prev_date.month - 1) // 3 + 1
        previous = f"{prev_date.year}-Q{prev_quarter}"
    elif period_type == "current_year":
        current = str(now.year)
        previous = str(now.year - 1)
    else:
        current = now.strftime("%Y-%m")
        previous = (now - relativedelta(months=1)).strftime("%Y-%m")
    
    return current, previous


def _calculate_growth(current: float, previous: float) -> float:
    """Calculate percentage growth"""
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    
    return round(((current - previous) / previous) * 100, 2)


def _calculate_margin(profit: float, revenue: float) -> float:
    """Calculate profit margin percentage"""
    if revenue == 0:
        return 0.0
    
    return round((profit / revenue) * 100, 2)


def _get_dataset_for_org(org_id: str) -> str:
    """Determine BigQuery dataset based on org_id"""
    org_id_upper = org_id.upper()
    
    if org_id_upper == "SGG" or "GAS" in org_id_upper:
        return "sgg_core"
    elif org_id_upper == "SGP" or "PETROLEUM" in org_id_upper:
        return "sgp_core"
    else:
        return "socar_consolidated"
