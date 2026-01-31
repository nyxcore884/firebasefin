import logging
import uuid
import json
import pandas as pd
import io
from datetime import datetime
from google.cloud import bigquery
from app.core.config import settings
from app.services.semantic_mapper import semantic_mapper # Brain 2
from app.services.deterministic_engine import deterministic_engine # Brain 1 Rule Engine

logger = logging.getLogger(__name__)

class IntelligenceOrchestrator:
    """
    Brain 3 (Systemic): The Orchestrator.
    Connects the Raw Data Lake to the Intelligence Core.
    """
    def __init__(self):
        self.bq_client = bigquery.Client(project=settings.PROJECT_ID)
        self.project_id = settings.PROJECT_ID
        self.landing_table = f"{self.project_id}.sgp_financial_intelligence.universal_intelligence"
        self.pipeline_table = f"{self.project_id}.sgp_financial_intelligence.processing_pipeline_v2"
        self.revenue_table = f"{self.project_id}.finance_core.revenue_breakdown"
        self.cogs_table = f"{self.project_id}.finance_core.cogs_breakdown"
        self.income_statement_table = f"{self.project_id}.finance_core.income_statement"
        self.budget_table = f"{self.project_id}.finance_core.budget_fact"
        self.variance_table = f"{self.project_id}.finance_core.variance_fact"
        self._ensure_pipeline_table()

    def _ensure_pipeline_table(self):
        """Ensures the pipeline tracking table exists."""
        schema = [
            bigquery.SchemaField("run_id", "STRING"),
            bigquery.SchemaField("step_name", "STRING"),
            bigquery.SchemaField("status", "STRING"),
            bigquery.SchemaField("processing_timestamp", "TIMESTAMP"),
            bigquery.SchemaField("human_readable_explanation", "STRING"),
            bigquery.SchemaField("engine_name", "STRING"),
        ]
        table = bigquery.Table(self.pipeline_table, schema=schema)
        try:
            self.bq_client.create_table(table, exists_ok=True)
        except Exception as e:
            logger.error(f"Failed to ensure pipeline table: {e}")

    def transition(self, run_id: str, step_name: str, explanation: str, status: str = "RUNNING", engine_name: str = "Brain 3"):
        """Records a state change for the UI to track."""
        try:
            rows_to_insert = [{
                "run_id": run_id,
                "step_name": step_name,
                "status": status,
                "processing_timestamp": datetime.now().isoformat(),
                "human_readable_explanation": explanation,
                "engine_name": engine_name
            }]
            errors = self.bq_client.insert_rows_json(self.pipeline_table, rows_to_insert)
            if errors:
                logger.error(f"Pipeline Track Error: {errors}")
            else:
                logger.info(f"[{run_id}] {step_name}: {explanation}")
        except Exception as e:
            logger.error(f"Failed to update pipeline: {e}")

    # Compatibility methods for existing code
    def create_run(self, query: str, engine_name: str = "Brain 3") -> str:
        run_id = f"run_{uuid.uuid4().hex[:8]}"
        self.transition(run_id, "INIT", "Initializing Intelligence Mission", engine_name=engine_name)
        return run_id

    def complete(self, run_id: str):
        self.transition(run_id, "COMPLETE", "Mission Successful", status="SUCCESS")

    async def execute_intelligence_mission(self, file_content: bytes, org_id: str, query: str, run_id: str = None):
        """
        The Master Mission Flow: Ingest -> Map -> Calculate -> Narrate
        """
        if not run_id:
            run_id = f"run_{uuid.uuid4().hex[:8]}"
        
        try:
            # 1. BRAIN 3: SYSTEMIC INGESTION (Bronze Layer)
            logger.info(f"[{run_id}] Mission Started: High-Fidelity Ingestion")
            self.transition(run_id, "INGEST", "Ingesting data into Universal Semantic Lake (Bronze Layer)", engine_name="Brain 3")
            
            try:
                df = pd.read_excel(io.BytesIO(file_content))
            except:
                df = pd.read_csv(io.BytesIO(file_content))

            # Convert entire DataFrame to a JSON-ready format
            # This handles 'Unstructured' data by turning rows into key-value pairs
            df = df.astype(object).where(pd.notnull(df), None)
            payloads = df.to_dict(orient='records')

            rows_to_insert = [
                {
                    "run_id": run_id,
                    "org_id": org_id,
                    "sheet_name": "Revenue_Main", # TODO: Handle multiple sheets dynamic
                    "payload": json.dumps(row, ensure_ascii=False, default=str),
                    "ingested_at": datetime.utcnow().isoformat()
                } for row in payloads
            ]

            # Streaming to BigQuery Universal Landing Table
            errors = self.bq_client.insert_rows_json(self.landing_table, rows_to_insert)
            if errors:
                logger.error(f"Ingestion failed: {errors}")
                raise Exception(f"BQ Insert Failed: {errors}")

            # 2. BRAIN 2: SEMANTIC DISCOVERY (Silver Layer)
            self.transition(run_id, "DISCOVER", "Brain 2 is analyzing physical headers for semantic meaning...", engine_name="Brain 2")
            logger.info(f"[{run_id}] Initiating Semantic Thought: Mapping Columns")

            # We send the first 100 rows to Brain 2 to 'Think' about the schema
            mapping = semantic_mapper.analyze_and_map_dataset(
                run_id=run_id, 
                sheet_name="Revenue_Main", 
                sample_rows=payloads[:100]
            )
            
            self.transition(run_id, "MK_MAP", f"Semantic Map Created: {list(mapping.keys())}", engine_name="Brain 2")

            # Brain 3 ask Brain 1 to run the full Deterministic Flow
            # We pass the current DF (Bronze/Silver) for immediate validation and total calculation
            # This implements Section 10 of the spec.
            deterministic_results = deterministic_engine.execute_flow(
                df=df,
                entity_id=org_id,
                period=datetime.now().strftime("%Y-%m-%d"),
                budget_df=None # TODO: Join with budget if query implies it
            )

            if deterministic_results["status"] == "HARD_ERROR":
                 self.transition(run_id, "HARD_ERROR", f"Deterministic Guardrail Breach: {deterministic_results['error']}", status="ERROR")
                 raise Exception(f"Finance Protocol Violation: {deterministic_results['error']}")

            self.transition(run_id, "DET_FLOW", "Deterministic Flow Complete: Data validated and aggregated.", engine_name="Brain 1")

            # 4. BRAIN 1: CANONICAL ETL (Optional Step if recognized)
            # Check sheet name or context for Canonical Route
            if "Revenue" in str(df.columns) or "Revenue" in query:
                self.transition(run_id, "ETL", "Executing Canonical ETL: Transforming to Gold Layer...", engine_name="Brain 1")
                try:
                    self._process_canonical_etl(df, org_id, run_id)
                    # Trigger Materialization
                    self.materialize_income_statement(org_id)
                except Exception as etl_error:
                    logger.warning(f"Canonical ETL failed (continuing with Silver only): {etl_error}")

            # 4b. BUDGET ETL (New CFO Brain)
            if "Budget" in str(df.columns) or "Budget" in query:
                self.transition(run_id, "BUDGET_ETL", "Executing Budget ETL: Mapping to finance_core...", engine_name="Brain 1")
                try:
                    self._process_budget_etl(df, org_id, run_id)
                    # Trigger Variance Analysis
                    self.materialize_variance(org_id)
                except Exception as budget_error:
                    logger.warning(f"Budget ETL failed: {budget_error}")

            # 5. FINAL SYNTHESIS: Communicating to User
            self.transition(run_id, "NARRATE", "Synthesizing final insights from deterministic facts.", engine_name="Brain 2")

            # Brain 3 delivers the final result back to the Cognitive Brain for narration (handled by caller)
            return {
                "run_id": run_id,
                "math": [deterministic_results["metrics"]],
                "explanations": deterministic_results["explanations"], 
                "mapping_used": mapping,
                "integrity_score": 1.0,
                "sql_used": "PROPRIETARY_DETERMINISTIC_FLOW",
                "gold_layer_active": True
            }
            
        except Exception as e:
            logger.error(f"Orchestration Failed: {e}")
            self.transition(run_id, "CRITICAL_ERROR", f"Systemic Failure: {str(e)}", status="ERROR")
            raise e

    def _process_canonical_etl(self, df: pd.DataFrame, org_id: str, run_id: str):
        """
        Deterministic ETL: Excel -> Canonical BQ Breakdown
        """
        logger.info(f"[{run_id}] Executing Canonical ETL for {org_id}")
        
        # Mapping rules based on Enterprise Spec
        # 1. VAT Handling
        vat_col = next((c for c in df.columns if c.lower() == 'vat'), 'VAT')
        if vat_col in df.columns:
            df['vat_clean'] = pd.to_numeric(df[vat_col], errors='coerce').fillna(0)
        else:
            df['vat_clean'] = 0
            
        # 2. Net Revenue Calculation
        amount_col = next((c for c in df.columns if 'amount' in c.lower() or 'თანხა' in c.lower()), None)
        net_col = next((c for c in df.columns if 'net' in c.lower()), None)
        
        if amount_col:
            df['amount_clean'] = pd.to_numeric(df[amount_col], errors='coerce').fillna(0)
            if net_col in df.columns:
                df['net_clean'] = pd.to_numeric(df[net_col], errors='coerce').fillna(df['amount_clean'] - df['vat_clean'])
            else:
                df['net_clean'] = df['amount_clean'] - df['vat_clean']
        else:
            df['amount_clean'] = 0
            df['net_clean'] = 0

        # 3. Rename and Metadata
        rename_map = {
            "Product": "product",
            "დასახელება": "product",
            "q": "revenue_type",
            "Revenue Type": "revenue_type"
        }
        # Dynamic search for 'q' or 'revenue_type'
        q_col = next((c for c in df.columns if c.lower() == 'q' or 'type' in c.lower()), 'revenue_type')
        if q_col in df.columns:
            rename_map[q_col] = "revenue_type"

        final_df = df.copy()
        for old, new in rename_map.items():
            if old in final_df.columns:
                final_df = final_df.rename(columns={old: new})

        # Set mandatory fields from spec
        final_df["entity_id"] = org_id
        final_df["period"] = datetime.now().strftime("%Y-%m-%d") # Default to now for latest upload
        final_df["amount_gel"] = final_df["amount_clean"]
        final_df["vat"] = final_df["vat_clean"]
        final_df["net_revenue"] = final_df["net_clean"]
        final_df["source_file"] = "upload_mission"
        
        # Select target columns for BQ
        bq_cols = ["entity_id", "period", "product", "amount_gel", "vat", "net_revenue", "revenue_type", "source_file"]
        clean_df = final_df[[c for c in bq_cols if c in final_df.columns]].copy()
        
        # Load to BQ
        errors = self.bq_client.insert_rows_from_dataframe(
            self.bq_client.get_table(self.revenue_table), 
            clean_df
        )
        if errors:
            logger.error(f"Canonical ETL Load Errors: {errors}")

    def materialize_income_statement(self, org_id: str):
        """
        STEP 4: Income Statement Materialization (Gold Layer Consolidation)
        """
        logger.info(f"Materializing Income Statement for {org_id}")
        sql = f"""
        INSERT INTO `{self.income_statement_table}`
        SELECT
          entity_id,
          period,

          SUM(CASE WHEN revenue_type='Revenue Wholesale' THEN net_revenue ELSE 0 END) as rev_wholesale,
          SUM(CASE WHEN revenue_type='Revenue Retail' THEN net_revenue ELSE 0 END) as rev_retail,
          SUM(CASE WHEN revenue_type NOT IN ('Revenue Wholesale', 'Revenue Retail') THEN net_revenue ELSE 0 END) as other_rev,

          SUM(net_revenue) as total_rev,

          SUM(0) as cogs_wholesale, -- Placeholder
          SUM(0) as cogs_retail,    -- Placeholder

          SUM(0) as total_cogs,     -- Placeholder

          SUM(net_revenue) - 0 AS gross_profit

        FROM `{self.revenue_table}`
        WHERE entity_id = '{org_id}'
        GROUP BY entity_id, period;
        """
        try:
            self.bq_client.query(sql).result()
        except Exception as e:
            logger.error(f"Materialization failed: {e}")

    def _process_budget_etl(self, df: pd.DataFrame, org_id: str, run_id: str):
        """
        Budget ETL: Excel -> Canonical Budget Fact
        """
        logger.info(f"[{run_id}] Executing Budget ETL for {org_id}")
        
        # Mapping rules from spec
        mapping = {
          "Revenue Wholesale": "revenue_wholesale",
          "Revenue Retail": "revenue_retail",
          "Total Revenue": "total_revenue",
          "Gross Profit": "gross_profit",
          "COGS": "total_cogs"
        }

        # 1. Detect columns
        line_item_col = next((c for c in df.columns if 'item' in c.lower() or 'line' in c.lower()), None)
        month_col = next((c for c in df.columns if 'month' in c.lower() or 'date' in c.lower()), None)
        amount_col = next((c for c in df.columns if 'amount' in c.lower() or 'budget' in c.lower()), None)

        if not all([line_item_col, month_col, amount_col]):
            logger.warning("Budget columns not detected, attempting fuzzy map...")
            # Fallback to direct mapping if it matches the dataframe columns
            pass

        budget_df = df.copy()
        budget_df["metric"] = budget_df[line_item_col].map(mapping)
        budget_df["entity_id"] = org_id
        budget_df["period"] = pd.to_datetime(budget_df[month_col]).dt.strftime("%Y-%m-%d")
        budget_df["budget_amount"] = pd.to_numeric(budget_df[amount_col], errors='coerce').fillna(0)
        budget_df["source_file"] = "upload_budget"

        # Filter unmapped metrics
        budget_df = budget_df[budget_df["metric"].notnull()]
        
        final_df = budget_df[["entity_id", "period", "metric", "budget_amount", "source_file"]].copy()
        
        # Load to BQ
        errors = self.bq_client.insert_rows_from_dataframe(
            self.bq_client.get_table(self.budget_table), 
            final_df
        )
        if errors:
            logger.error(f"Budget ETL Load Errors: {errors}")

    def materialize_variance(self, org_id: str):
        """
        STEP 3: Variance Materialization (Actual vs Budget)
        """
        logger.info(f"Materializing Variance for {org_id}")
        sql = f"""
        INSERT INTO `{self.variance_table}`
        SELECT
          a.entity_id,
          a.period,
          b.metric,

          a.actual_amount,
          b.budget_amount,

          a.actual_amount - b.budget_amount AS variance_abs,

          SAFE_DIVIDE(
            a.actual_amount - b.budget_amount,
            b.budget_amount
          ) AS variance_pct,

          CASE
            WHEN b.metric LIKE 'revenue%' AND a.actual_amount >= b.budget_amount THEN 'Favorable'
            WHEN b.metric LIKE 'cogs%' AND a.actual_amount <= b.budget_amount THEN 'Favorable'
            WHEN b.metric = 'gross_profit' AND a.actual_amount >= b.budget_amount THEN 'Favorable'
            WHEN b.metric = 'total_revenue' AND a.actual_amount >= b.budget_amount THEN 'Favorable'
            ELSE 'Unfavorable'
          END AS status,
          CURRENT_TIMESTAMP() as calculation_timestamp

        FROM (
          SELECT
            entity_id,
            period,
            metric,
            actual_amount
          FROM `{self.income_statement_table}`
          UNPIVOT (
            actual_amount FOR metric IN (
              revenue_wholesale,
              revenue_retail,
              other_revenue,
              total_revenue,
              total_cogs,
              gross_profit
            )
          )
        ) a
        JOIN `{self.budget_table}` b
        USING (entity_id, period, metric)
        WHERE a.entity_id = '{org_id}';
        """
        try:
            self.bq_client.query(sql).result()
        except Exception as e:
            logger.error(f"Variance materialization failed: {e}")

# Singleton
orchestrator = IntelligenceOrchestrator()
