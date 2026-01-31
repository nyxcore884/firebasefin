import json
import logging
import uuid
import pandas as pd
from typing import List
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud import bigquery
from app.core.config import settings
from app.services.forensic_engine import forensic_engine
from app.services.orchestrator_service import orchestrator
from app.services.vertex_ai_service import vertex_ai_service
from app.services.bigquery_service import bq_service

import io
from app.services.metadata_discovery_service import metadata_discovery_service
from app.services.semantic_mapper import semantic_mapper
from app.services.deterministic_brain import deterministic_brain
from app.services.deterministic_engine import deterministic_engine
from app.services.reasoning_orchestrator import reasoning_orchestrator

logger = logging.getLogger(__name__)

# Initialize Firebase Admin
if not firebase_admin._apps:
    try:
        firebase_admin.initialize_app()
    except Exception as e:
        logger.warning(f"Firebase Admin init warning: {e}")

class IntelligenceService:
    def __init__(self):
        self.bq_client = bigquery.Client(project=settings.PROJECT_ID)
        try:
            self.db = firestore.client()
        except Exception as e:
            logger.warning(f"Firestore client init failed: {e}")
            self.db = None

    async def handle_query(self, user_query: str, context: dict, files: List[bytes] = None):
        org_id = context.get("company", {}).get("org_id", "SOCAR_GROUP")
        user_query_clean = user_query.lower().strip()
        
        # Determine if we have a forced run_id
        run_id = context.get("forced_run_id") or orchestrator.create_run(user_query)
        
        # --- BRAIN 3: THE SYSTEMIC ORCHESTRATOR / DIRECT FILE ANALYSIS ---
        if files:
            try:
                logger.info(f"[{run_id}] Processing File Intelligence Mission: {len(files)} files")
                orchestrator.transition(run_id, "INGEST", "Parsing uploaded dataset clusters...")
                
                # --- FAST PATH: Direct LLM Analysis (No BigQuery Dependency) ---
                orchestrator.transition(run_id, "CALCULATE", "Reasoning over raw data via Gemini Neural Engine...")
                direct_response = vertex_ai_service.process_file_query(
                    files=files,
                    query=user_query,
                    context=context
                )
                
                answer = direct_response.get("answer", "Analysis incomplete.")
                orchestrator.transition(run_id, "NARRATE", "Finalizing intelligence synthesis...")

                # PERSIST CONTEXT
                if self.db:
                    try:
                        self.db.collection('ai_context').document(org_id).set({
                            'content': answer, 
                            'data_context': direct_response.get("data_context", ""),
                            'timestamp': firestore.SERVER_TIMESTAMP,
                            'query': user_query,
                            'source': 'direct_file',
                            'run_id': run_id
                        })
                    except:
                        pass

                # --- NEW: Store result in a way that the poller can find it ---
                # We update the COMPLETE step with the final answer in the explanation
                orchestrator.transition(run_id, "COMPLETE", answer, status="SUCCESS")

                return {
                    "answer": answer,
                    "type": "intelligence",
                    "sources": ["Gemini Reasoning", "Direct Analysis"],
                    "visualizations": direct_response.get("visualizations", []),
                    "confidence": 0.95,
                    "query_id": run_id
                }

            except Exception as orch_error:
                logger.error(f"[{run_id}] File Analysis Failure: {orch_error}")
                orchestrator.transition(run_id, "ERROR", str(orch_error), status="FAILED")
                return {
                    "answer": f"Systemic Analysis Error: {str(orch_error)}",
                    "type": "error",
                    "sources": ["Brain 3"],
                    "confidence": 0.0
                }

        # --- HIGH-SPEED DETERMINISTIC SHORTCUT (Brain 1) ---
        # If user asks "calculate revenue", "show kpis", etc. skip the LLM SQL gen if we can.
        if any(kw in user_query_clean for kw in ["calculate revenue", "show revenue", "revenue kpi"]):
            try:
                logger.info(f"Using Deterministic Shortcut for: {user_query}")
                metrics = deterministic_engine.calculate_metrics(org_id=org_id, metric_type="revenue")
                if metrics:
                    narrative = f"I've calculated the deterministic revenue figures for {org_id}. Current Total Revenue is ₾{metrics.get('total_revenue', 0):,.2f}."
                    return {
                        "answer": narrative,
                        "type": "deterministic",
                        "sources": ["Brain 1 (Deterministic Engine)"],
                        "visualizations": [{
                             "type": "stats",
                             "title": "Deterministic Revenue",
                             "data": [{"label": "Total Revenue", "value": f"₾{metrics.get('total_revenue', 0):,.0f}", "trend": "up"}]
                        }],
                        "confidence": 1.0
                    }
            except Exception as e:
                logger.warning(f"Deterministic shortcut failed, falling back to LLM flow: {e}")

        # --- STANDARD QUERY PATH ---
        # ... (Existing logic below)
        
        # --- CHECK FOR RECENT CONTEXT (Follow-up Questions) ---
        if self.db:
            try:
                doc_ref = self.db.collection('ai_context').document(org_id)
                doc = doc_ref.get()
                if doc.exists:
                    data = doc.to_dict()
                    # Check if context is fresh (e.g. within 15 mins)
                    # Note: Using simple timestamp check if available, otherwise just use it
                    # Logic: If query seems like a follow-up (short, refers to 'it', 'revenue', etc), use context
                    # For simplicity, ALWAYS try context first if it exists.
                    
                    context_text = data.get('content', '')
                    if context_text:
                        # Use Contextual AI Path
                        logger.info(f"Using persisted context for query: {user_query}")
                        return vertex_ai_service.process_contextual_query(user_query, context_text)
            except Exception as context_error:
                logger.warning(f"Context retrieval failed: {context_error}")

        # --- STANDARD QUERY PATH: Uses BigQuery ---
        try:
            # 1. GENERATE SQL (Brain 2)
            orchestrator.transition(run_id, "DISCOVER", "Translating financial intent to SQL...")
            generated_sql = vertex_ai_service.generate_sql(user_query, context)
            
            # 2. EXECUTE SQL (Brain 1)
            orchestrator.transition(run_id, "CALCULATE", "Executing deterministic audit in BigQuery...")
            try:
                query_job = self.bq_client.query(generated_sql)
                df = query_job.to_dataframe(timeout=20)
            except Exception as sql_error:
                logger.error(f"SQL Execution Failed: {sql_error}")
                # Fallbact to empty DF to allow "I don't know" narration
                df = pd.DataFrame()
            
            # 3. RECALL MEMORY
            memories = vertex_ai_service._recall_memory(user_query, org_id)

        except Exception as e:
            logger.warning(f"Orchestrator create_run components failed: {e}")
            run_id = "fallback_run"
            df = pd.DataFrame()
            memories = []
        
        try:
            # Assets for UI
            assets = []
            
            # --- RULE-BASED EXPLANATION ENGINE ---
            explanations = []
            if not df.empty:
                # Attempt to find drivers if budget/baseline is available in Assets or Context
                # For this version, we will run the Engine on the current dataframe
                # and any related data (e.g. if we have variance results in the asset list)
                
                # Check if we have variance data in assets
                variance_asset = next((a for a in assets if "variance" in a.get("title", "").lower()), None)
                if variance_asset:
                    # Use the engine to evaluate favorability and drivers
                    # (Simplified: Extracting from asset records)
                    records = variance_asset.get("data", {}).get("rows", [])
                    if records:
                        # Convert to simple Dict for engine
                        # actual_data = { "total_revenue": ..., "total_cogs": ... }
                        # This matches the engine's expected input for explanation trees
                        pass 

            # Asset identification for the engine usually happens in the Orchestrator
            # But the IntelligenceService can also trigger it for standard queries.
            
            if not df.empty:
                assets.append({
                    "id": f"res_{run_id}_01",
                    "type": "table",
                    "title": "Query Synthesis Result",
                    "data": {
                        "columns": list(df.columns),
                        "rows": df.fillna(0).to_dict('records')
                    }
                })

            # --- FORENSIC SCAN (Brain 1 Expansion) ---
            if any(kw in user_query.lower() for kw in ["forensic", "anomaly", "suspicious", "fx"]):
                orchestrator.transition(run_id, "FORENSIC", "Running direct forensic scan on primary data clusters...")
                
                dataset_id = bq_service.get_dataset_for_org(org_id)
                if "fx" in user_query.lower() or "leakage" in user_query.lower():
                    f_sql = forensic_engine.get_fx_leakage_sql(dataset_id)
                else:
                    f_sql = forensic_engine.get_universal_anomaly_sql(dataset_id, "revenue_data", "net_revenue", "product_category")
                
                f_job = self.bq_client.query(f_sql)
                f_df = f_job.to_dataframe(timeout=20)
                
                if not f_df.empty:
                    assets.append({
                        "id": f"stat_{run_id}_01",
                        "type": "stats",
                        "title": "Forensic Insight",
                        "data": [
                            { 
                                "label": "Detected Outliers", 
                                "value": str(len(f_df[f_df.get('forensic_status', '') == 'CRITICAL'])), 
                                "trend": "up" 
                            },
                        ]
                    })
                    
                    assets.append({
                        "id": f"forensic_{run_id}_01",
                        "type": "table",
                        "title": "Forensic Scan Results",
                        "data": {
                            "columns": list(f_df.columns),
                            "rows": f_df.fillna(0).to_dict('records')
                        }
                    })

                    # proactive notification for CRITICAL breaches
                    if any(f_df.get('forensic_status', []) == 'CRITICAL'):
                        from app.services.notification_service import notification_service
                        report_url = f"https://console.cloud.google.com/bigquery?project={settings.PROJECT_ID}&p={settings.PROJECT_ID}&d=sgp_financial_intelligence&t=processing_pipeline&page=table"
                        notification_service.alert_critical_anomaly(run_id, "Multiple Entities", report_url)

            # Final Synthesis (Brain 2 + Brain 1 Synthesis + Rule-Based Explanations)
            orchestrator.transition(run_id, "NARRATE", "Synthesizing natural language intelligence...")
            
            # --- DETERMINISTIC DISCOVERY ---
            # If we see variance columns, generate a deterministic explanation tree
            if 'variance_abs' in df.columns or 'actual_amount' in df.columns:
                # Use engine to generate tree
                # (Mocking the data struct for the engine for now)
                explanations = deterministic_engine.generate_explanation_tree(
                    actual_data={"total_revenue": df['actual_amount'].sum() if 'actual_amount' in df.columns else 0},
                    baseline_data={"total_revenue": df['budget_amount'].sum() if 'budget_amount' in df.columns else 0}
                )
            else:
                # --- REASONING ORCHESTRATION (The Nervous System) ---
                reasoning_plan = reasoning_orchestrator.select_reasoning_plan(user_query)
                reasoning_insight = None
                
                if reasoning_plan and not df.empty:
                    # If we have variance columns, run the Reasoning Orchestrator
                    if 'actual_amount' in df.columns and 'budget_amount' in df.columns:
                        # Mocking data structures for reasoning check
                        actual_data = {"total_revenue": df['actual_amount'].sum(), "total_cogs": 0} # Simplified
                        budget_data = {"total_revenue": df['budget_amount'].sum(), "total_cogs": 0}
                        reasoning_insight = reasoning_orchestrator.analyze_variance_drivers(actual_data, budget_data)
                        explanations.extend(reasoning_insight.get("ranked_causes", []))
                        explanations.append(f"Reasoning Confidence: {reasoning_insight.get('confidence_score', 0):.1%}")
                # Initialize explanations if not already done by deterministic engine
                if not explanations:
                    explanations = []

            narrative_text = vertex_ai_service.narrate(
                data=df, 
                memories=memories, 
                explanations=explanations,
                reasoning_path=reasoning_insight.get("reasoning_path") if reasoning_insight else [],
                ranked_causes=reasoning_insight.get("ranked_causes") if reasoning_insight else []
            )
            
            orchestrator.complete(run_id)
            
            return {
                "answer": narrative_text,
                "assets": assets,
                "run_id": run_id,
                "sources": ["BigQuery: Core Engine", "Forensic Lab"],
                "success": True,
                "confidence": reasoning_insight.get("confidence_score", 0.9) if reasoning_insight else 0.9,
                "reasoning_path": reasoning_insight.get("reasoning_path", []) if reasoning_insight else [],
                "explanations": explanations
            }

        except Exception as e:
            logger.error(f"Intelligence Pipeline Failure: {str(e)}")
            orchestrator.transition(run_id, "ERROR", f"Interruption in logic array: {str(e)}", status="ERROR")
            return {
                "success": False,
                "error": str(e),
                "answer": "Intelligence link severed. Failed to access BigQuery nodes.",
                "run_id": run_id,
                "assets": []
            }

    async def handle_assistant_query(self, user_query: str, context: dict):
        """
        AI Assistant Path: Purely Gemini Reasoning LLM.
        Bypasses BigQuery for speed and flexibility.
        """
        try:
            logger.info(f"Processing Assistant Query (Gemini Only): {user_query}")
            
            # Simple context preparation
            company = context.get("company", {})
            org_id = company.get("org_id", "SOCAR_GROUP")
            
            # Use direct LLM path with basic context
            response = vertex_ai_service.process_contextual_query(
                query=user_query,
                context_text=f"Company: {org_id}. Role: Financial Assistant. Query: {user_query}"
            )
            
            return {
                "answer": response["answer"],
                "type": "assistant",
                "sources": ["Gemini Reasoning Engine"],
                "confidence": 0.95,
                "query_id": response.get("query_id", str(uuid.uuid4()))
            }
        except Exception as e:
            logger.error(f"Assistant path failed: {e}")
            return {
                "answer": f"Assistant Error: {str(e)}",
                "type": "error",
                "sources": ["LLM"],
                "confidence": 0.0
            }

    async def handle_feedback(self, request_id: str, org_id: str, query: str, score: int, comment: str, was_corrected: bool):
        """
        Brain 2 Learns: Stores feedback in the ai_feedback_loop for future prompting.
        Pinned to org_id for strict multi-tenant isolation.
        """
        table_id = f"{settings.PROJECT_ID}.sgp_financial_intelligence.ai_feedback_loop"
        try:
            records = [{
                "request_id": request_id,
                "org_id": org_id,
                "user_query": query,
                "user_comment": comment,
                "feedback_score": score,
                "was_corrected": was_corrected,
                "timestamp": datetime.now().isoformat()
            }]
            errors = self.bq_client.insert_rows_json(table_id, records)
            if errors:
                logger.error(f"Feedback Log Errors: {errors}")
            return True
        except Exception as e:
            logger.error(f"Failed to log feedback: {e}")
            return False

# Singleton
intelligence_service = IntelligenceService()
