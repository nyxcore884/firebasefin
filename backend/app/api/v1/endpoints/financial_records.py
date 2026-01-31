from fastapi import APIRouter, HTTPException, Query, Depends
from google.cloud import firestore, bigquery
from app.api.deps import get_db
from app.services.bigquery_service import bq_service
from app.core.config import settings
from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class FinancialRecordResponse(BaseModel):
    record_id: str
    org_id: str
    period: str
    transaction_date: Optional[date]
    account_code: str
    account_name: str
    debit: float
    credit: float
    balance: float
    category: Optional[str]
    created_at: datetime


@router.get("/financial-records")
async def get_financial_records(
    org_id: str = Query(..., description="Organization ID"),
    period: Optional[str] = Query(None, description="Period (YYYY-MM)"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    account_code: Optional[str] = Query(None, description="Filter by account code"),
    category: Optional[str] = Query(None, description="Filter by category")
):
    """
    Get financial records for a company with optional filters
    """
    try:
        # Determine dataset based on org_id
        dataset = _get_dataset_for_org(org_id)
        
        # Build query
        query = f"""
            SELECT 
                GENERATE_UUID() as record_id,
                org_id,
                period,
                transaction_date,
                account_code,
                account_name,
                debit,
                credit,
                balance,
                category,
                created_at
            FROM `{settings.PROJECT_ID}.{dataset}.financial_records`
            WHERE org_id = @org_id
        """
        
        query_params = [
            bigquery.ScalarQueryParameter("org_id", "STRING", org_id)
        ]
        
        # Add filters
        if period:
            query += " AND period = @period"
            query_params.append(bigquery.ScalarQueryParameter("period", "STRING", period))
        
        if account_code:
            query += " AND account_code LIKE @account_code"
            query_params.append(bigquery.ScalarQueryParameter("account_code", "STRING", f"%{account_code}%"))
        
        if category:
            query += " AND category = @category"
            query_params.append(bigquery.ScalarQueryParameter("category", "STRING", category))
        
        query += f" ORDER BY transaction_date DESC, created_at DESC LIMIT {limit} OFFSET {offset}"
        
        # Execute query
        job_config = bigquery.QueryJobConfig(query_parameters=query_params)
        query_job = bq_service.client.query(query, job_config=job_config)
        results = query_job.result()
        
        records = []
        for row in results:
            records.append({
                "record_id": row.record_id,
                "org_id": row.org_id,
                "period": row.period,
                "transaction_date": row.transaction_date.isoformat() if row.transaction_date else None,
                "account_code": row.account_code,
                "account_name": row.account_name,
                "debit": float(row.debit) if row.debit else 0.0,
                "credit": float(row.credit) if row.credit else 0.0,
                "balance": float(row.balance) if row.balance else 0.0,
                "category": row.category,
                "created_at": row.created_at.isoformat() if row.created_at else None
            })
        
        return {
            "success": True,
            "data": records,
            "count": len(records),
            "offset": offset,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch financial records: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch records: {str(e)}")


@router.get("/financial-summaries")
async def get_financial_summaries(
    org_id: str = Query(..., description="Organization ID"),
    start_period: str = Query(..., description="Start period (YYYY-MM)"),
    end_period: str = Query(..., description="End period (YYYY-MM)")
):
    """
    Get aggregated financial summaries for a period range
    """
    try:
        dataset = _get_dataset_for_org(org_id)
        
        query = f"""
            SELECT 
                period,
                SUM(CASE WHEN category = 'revenue' THEN debit - credit ELSE 0 END) as total_revenue,
                SUM(CASE WHEN category = 'cogs' THEN debit - credit ELSE 0 END) as total_cogs,
                SUM(CASE WHEN category = 'operating_expense' THEN debit - credit ELSE 0 END) as total_expenses,
                SUM(CASE WHEN category = 'revenue' THEN debit - credit ELSE 0 END) - 
                SUM(CASE WHEN category = 'cogs' THEN debit - credit ELSE 0 END) as gross_profit,
                COUNT(*) as transaction_count
            FROM `{settings.PROJECT_ID}.{dataset}.financial_records`
            WHERE org_id = @org_id
                AND period >= @start_period
                AND period <= @end_period
            GROUP BY period
            ORDER BY period ASC
        """
        
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("org_id", "STRING", org_id),
                bigquery.ScalarQueryParameter("start_period", "STRING", start_period),
                bigquery.ScalarQueryParameter("end_period", "STRING", end_period)
            ]
        )
        
        query_job = bq_service.client.query(query, job_config=job_config)
        results = query_job.result()
        
        summaries = []
        for row in results:
            summaries.append({
                "period": row.period,
                "total_revenue": float(row.total_revenue) if row.total_revenue else 0.0,
                "total_cogs": float(row.total_cogs) if row.total_cogs else 0.0,
                "total_expenses": float(row.total_expenses) if row.total_expenses else 0.0,
                "gross_profit": float(row.gross_profit) if row.gross_profit else 0.0,
                "ebitda": float(row.gross_profit) - float(row.total_expenses) if row.gross_profit and row.total_expenses else 0.0,
                "transaction_count": row.transaction_count
            })
        
        return {
            "success": True,
            "data": summaries,
            "count": len(summaries)
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch financial summaries: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch summaries: {str(e)}")


@router.delete("/financial-records/{record_id}")
async def delete_financial_record(
    record_id: str,
    org_id: str = Query(..., description="Organization ID for security check")
):
    """
    Delete a financial record (soft delete - marks as deleted)
    """
    try:
        dataset = _get_dataset_for_org(org_id)
        
        # Update record to mark as deleted
        query = f"""
            UPDATE `{settings.PROJECT_ID}.{dataset}.financial_records`
            SET deleted_at = CURRENT_TIMESTAMP(),
                deleted = TRUE
            WHERE record_id = @record_id
                AND org_id = @org_id
        """
        
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("record_id", "STRING", record_id),
                bigquery.ScalarQueryParameter("org_id", "STRING", org_id)
            ]
        )
        
        query_job = bq_service.client.query(query, job_config=job_config)
        query_job.result()
        
        return {
            "success": True,
            "message": f"Record {record_id} deleted successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to delete record: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete record: {str(e)}")


def _get_dataset_for_org(org_id: str) -> str:
    """Determine BigQuery dataset based on org_id"""
    org_id_upper = org_id.upper()
    
    if org_id_upper == "SGG" or "GAS" in org_id_upper:
        return "sgg_core"
    elif org_id_upper == "SGP" or "PETROLEUM" in org_id_upper:
        return "sgp_core"
    else:
        return "socar_consolidated"
