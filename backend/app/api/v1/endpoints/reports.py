from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import JSONResponse
from typing import List, Optional
from datetime import datetime
import json
import pandas as pd
import logging

from app.services.report_generator import report_generator

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/generate")
async def generate_report(
    org_id: str = Query(..., description="Organization ID"),
    report_type: str = Query(..., description="Type: management, financial_statements, custom"),
    period: str = Query(..., description="Period (YYYY-MM)"),
    format: str = Query("json", description="Format: json, pdf, excel (pdf/excel upcoming)"),
    metrics: Optional[List[str]] = Query(None, description="Custom metrics list")
):
    """
    Generate financial report
    
    **Report Types:**
    - `management`: Executive summary with KPIs, trends, insights
    - `financial_statements`: Income statement, balance sheet, cash flow
    - `custom`: User-defined metrics selection
    
    **Formats:**
    - `json`: Return structured data (current)
    - `pdf`: Download as PDF (coming soon)
    - `excel`: Download as Excel workbook (coming soon)
    """
    try:
        logger.info(f"Report request: {report_type} for {org_id}, period {period}, format {format}")
        
        # Generate report based on type
        if report_type == "management":
            report_data = report_generator.generate_management_report(org_id, period)
        
        elif report_type == "financial_statements":
            report_data = report_generator.generate_financial_statements(org_id, period)
        
        elif report_type == "custom":
            if not metrics:
                raise HTTPException(
                    status_code=400, 
                    detail="Custom reports require 'metrics' parameter"
                )
            report_data = report_generator.generate_custom_report(org_id, period, metrics)
        
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid report_type: {report_type}. Use: management, financial_statements, custom"
            )
        
        # Return based on format
        if format == "json":
            return JSONResponse(content={
                "success": True,
                "report": report_data,
                "generated_at": datetime.now().isoformat()
            })
        
        elif format == "pdf":
            # Unified Reporting Bridge: Generate PDF using the new ReportGenerator bridge
            if report_type == "management":
                data = report_generator.generate_management_report(org_id, period)
                # Convert dict to DataFrame for the generic PDF bridge
                df = pd.DataFrame([data['executive_summary']])
                report_url = report_generator.generate_intelligence_pdf(df, f"Management Report - {org_id}", f"mgmt_{period}")
            else:
                raise HTTPException(status_code=501, detail="PDF for this report type coming soon.")
            
            return JSONResponse(content={"success": True, "url": report_url})
        
        elif format == "excel":
            # TODO: Implement Excel generation with openpyxl
            raise HTTPException(
                status_code=501,
                detail="Excel generation coming soon. Use format=json for now."
            )
        
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid format: {format}. Use: json, pdf, excel"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Report generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@router.get("/available-metrics")
async def get_available_metrics():
    """
    Get list of available metrics for custom reports
    """
    return {
        "success": True,
        "metrics": [
            {
                "id": "revenue_trends",
                "name": "Revenue Trends",
                "description": "Revenue breakdown by category and time",
                "category": "revenue"
            },
            {
                "id": "top_expenses",
                "name": "Top Expenses",
                "description": "Highest expense categories",
                "category": "expenses"
            },
            {
                "id": "profit_margin",
                "name": "Profit Margin Analysis",
                "description": "Gross profit, COGS, margins",
                "category": "profitability"
            },
            {
                "id": "cash_flow",
                "name": "Cash Flow",
                "description": "Cash inflows, outflows, balance",
                "category": "cash"
            },
            {
                "id": "working_capital",
                "name": "Working Capital",
                "description": "Current assets vs liabilities",
                "category": "liquidity"
            },
            {
                "id": "variance_analysis",
                "name": "Budget Variance",
                "description": "Actual vs budget comparison",
                "category": "performance"
            }
        ]
    }


@router.get("/templates")
async def get_report_templates():
    """
    Get available report templates
    """
    return {
        "success": True,
        "templates": [
            {
                "id": "monthly_executive",
                "name": "Monthly Executive Summary",
                "description": "High-level KPIs and insights for executives",
                "metrics": ["revenue_trends", "profit_margin", "top_expenses"],
                "default_format": "pdf"
            },
            {
                "id": "quarterly_board",
                "name": "Quarterly Board Report",
                "description": "Comprehensive financial review for board meetings",
                "metrics": ["revenue_trends", "profit_margin", "cash_flow", "variance_analysis"],
                "default_format": "pdf"
            },
            {
                "id": "detailed_analysis",
                "name": "Detailed Financial Analysis",
                "description": "In-depth analysis with all metrics",
                "metrics": ["revenue_trends", "top_expenses", "profit_margin", "cash_flow", "working_capital"],
                "default_format": "excel"
            }
        ]
    }
