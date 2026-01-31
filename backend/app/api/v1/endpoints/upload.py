from fastapi import APIRouter, UploadFile, File, HTTPException, Request, Form
from typing import List, Optional
from app.services.parser_service import parser_service
from app.services.financial_engine import financial_engine
from app.services.bigquery_service import bq_service
from app.engines.reasoning.query_builder import QueryBuilder
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/financial-data")
async def upload_financial_data(
    request: Request,
    file: UploadFile = File(...),
    ai_query: Optional[str] = Form(None)
):
    """
    1. Parses ANY Excel file (Adaptive Parser)
    2. Applies SGP Business Logic (Financial Engine)
    3. Ingests into BigQuery (Data Warehouse)
    4. OPTIONAL: If ai_query is provided, generates an AI report.
    """
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only Excel files allowed")

    try:
        # Read file content
        content = await file.read()
        
        # Determine Organization Context
        # Check header, then valid tokens, default to UNKNOWN
        org_id = request.headers.get("X-Company-ID", "UNKNOWN")
        if hasattr(request.state, "org_id") and request.state.org_id:
            org_id = request.state.org_id

        # ---------------------------------------------------------
        # BRANCH 1: SGP STRICT PIPELINE
        # ---------------------------------------------------------
        if org_id == 'SGP' or org_id == 'socar_petroleum':
            from app.services.sgp_engine_service import SGPFinancialEngine
            import pandas as pd
            import io
            from google.cloud import bigquery
            from app.core.config import settings
            from datetime import datetime

            logger.info(f"Processing SGP Upload strictly via SGPFinancialEngine. File: {file.filename}")
            
            # Load Engine
            sgp_engine = SGPFinancialEngine()
            
            # Parse Excel using Pandas to keep original headers for Regex
            xls = pd.ExcelFile(io.BytesIO(content))
            
            processed_records_count = 0
            
            # 1. Process Revenue
            if "Revenue Breakdown" in xls.sheet_names:
                df_rev = pd.read_excel(xls, "Revenue Breakdown")
                # Reuse logic from load_sgp_data.py but inline here or adapted
                # We need to create the exact records list
                
                rev_records = []
                # Find columns
                prod_col = next((c for c in df_rev.columns if "Product" in str(c) or "პროდუქტი" in str(c)), df_rev.columns[0])
                net_dest = next((c for c in df_rev.columns if "Net Revenue" in str(c) or "თანხა" in str(c)), df_rev.columns[3] if len(df_rev.columns) > 3 else None)
                
                for idx, row in df_rev.iterrows():
                    pname = str(row[prod_col]).strip()
                    if not pname or pname.lower() == 'nan': continue
                    try: amt = float(row[net_dest]) if net_dest else 0.0
                    except: continue
                    if amt == 0: continue
                    
                    cls = sgp_engine.classify_product(pname)
                    rev_records.append({
                        'revenue_record_id': f"rev_upload_{int(datetime.now().timestamp())}_{idx}",
                        'company_id': 'socar_petroleum',
                        'period': '2025-12', # TODO: Extract from filename or prompt
                        'product_name_georgian': pname,
                        'product_category': cls['category'],
                        'product_type': cls['type'],
                        'unit_of_measure': 'kg' if cls['is_wholesale'] else 'liter',
                        'net_revenue': amt,
                        'revenue_line_item': cls['line_item'],
                        'is_wholesale': cls['is_wholesale'],
                        'is_retail': cls['is_retail'],
                        'source_file': file.filename,
                        'source_sheet': 'Revenue Breakdown',
                        'source_row': idx + 2,
                        'processing_timestamp': datetime.now().isoformat()
                    })
                
                # Insert Revenue
                client = bigquery.Client(project=settings.PROJECT_ID)
                table_id = f"{settings.PROJECT_ID}.sgp_financial_intelligence.revenue_data"
                
                # Check if table exists (it should, created by script)
                # Ensure schema matching is strict or auto
                job_config = bigquery.LoadJobConfig(write_disposition="WRITE_APPEND", source_format="NEWLINE_DELIMITED_JSON", autodetect=True)
                import json
                
                # Load via JSON
                if rev_records:
                   errors = client.insert_rows_json(table_id, rev_records) 
                   if errors: logger.error(f"BQ Insert Errors (Revenue): {errors}")
                   processed_records_count += len(rev_records)
                   
                   # Trigger Intelligence: Universal Discovery
                   bq_service.perform_universal_discovery(table_id, ["net_revenue"], org_id)

            # 2. Process COGS
            if "COGS Breakdown" in xls.sheet_names:
                df_cogs = pd.read_excel(xls, "COGS Breakdown")
                cogs_records = []
                # Find cols
                c6 = next((c for c in df_cogs.columns if str(c).strip() == '6'), None)
                c7310 = next((c for c in df_cogs.columns if str(c).strip() == '7310'), None)
                c8230 = next((c for c in df_cogs.columns if str(c).strip() == '8230'), None)
                pcol = df_cogs.columns[0]
                
                for idx, row in df_cogs.iterrows():
                    pname = str(row[pcol]).strip()
                    if not pname or pname.lower() == 'nan': continue
                    
                    v6 = float(row[c6]) if c6 and pd.notna(row[c6]) else 0.0
                    v7310 = float(row[c7310]) if c7310 and pd.notna(row[c7310]) else 0.0
                    v8230 = float(row[c8230]) if c8230 and pd.notna(row[c8230]) else 0.0
                    tot = v6 + v7310 + v8230
                    if tot == 0: continue
                    
                    cls = sgp_engine.classify_product(pname)
                    cogs_records.append({
                        'cogs_record_id': f"cogs_upload_{int(datetime.now().timestamp())}_{idx}",
                        'company_id': 'socar_petroleum',
                        'period': '2025-12',
                        'product_name_georgian': pname,
                        'product_category': cls['category'],
                        'cogs_6': v6,
                        'cogs_7310': v7310,
                        'cogs_8230': v8230,
                        'total_cogs': tot,
                        'calculation_formula': 'Account_6 + Account_7310 + Account_8230',
                        'source_file': file.filename,
                        'source_sheet': 'COGS Breakdown',
                        'source_row': idx + 2,
                        'processing_timestamp': datetime.now().isoformat()
                    })

                # Insert COGS
                client = bigquery.Client(project=settings.PROJECT_ID)
                table_id = f"{settings.PROJECT_ID}.sgp_financial_intelligence.cogs_data"
                if cogs_records:
                   errors = client.insert_rows_json(table_id, cogs_records) 
                   if errors: logger.error(f"BQ Insert Errors (COGS): {errors}")
                   processed_records_count += len(cogs_records)

                   # Trigger Intelligence: Universal Discovery
                   bq_service.perform_universal_discovery(table_id, ["cogs_6", "cogs_7310", "cogs_8230", "total_cogs"], org_id)

            return {
                "status": "success",
                "message": f"Successfully processed {processed_records_count} SGP records (Revenue + COGS) using Strict Engine",
                "engine": "SGPFinancialEngine",
                "bq_tables": ["sgp_financial_intelligence.revenue_data", "sgp_financial_intelligence.cogs_data"]
            }

        # ---------------------------------------------------------
        # BRANCH 2: GENERIC / OTHER ORG PIPELINE
        # ---------------------------------------------------------
        
        # 1. Parse (Adaptive)
        raw_records = parser_service.parse_excel(content, file.filename)
        
        # 2. Process (Generic Logic)
        processed_records = financial_engine.process_records(raw_records, org_id)
        
        # 3. Ingest (BigQuery)
        bq_service.insert_financial_records(processed_records)
        
        # Trigger Intelligence: Universal Discovery
        bq_service.perform_universal_discovery(f"{dataset_id}.financial_records", ["amount"], org_id)
        
        bq_service.generate_training_data() # Trigger ETL
        
        # 4. AI Query Handling
        ai_response = None
        if ai_query:
            try:
                qb = QueryBuilder()
                sql = await qb.build_query(ai_query)
                
                # Execute the query
                job = bq_service.client.query(sql)
                results = [dict(row) for row in job.result()]
                
                ai_response = {
                    "query": sql,
                    "explanation": f"Executed analysis for: '{ai_query}'",
                    "data": results[:10] # Limit to 10 rows for UI
                }
            except Exception as ai_e:
                logger.warning(f"AI Query failed: {str(ai_e)}")
                ai_response = {"error": str(ai_e)}
        
        return {
            "status": "success",
            "message": f"Successfully processed {len(processed_records)} records",
            "ai_report": ai_response,
            "sample": processed_records[:3]
        }

    except Exception as e:
        logger.error(f"Upload processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
