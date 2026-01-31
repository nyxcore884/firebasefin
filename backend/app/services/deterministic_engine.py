import json
import logging
import os
import yaml
import pandas as pd
from typing import Dict, List, Any, Optional
from app.services.rule_compiler import rule_compiler
from app.services.engine_tester import engine_tester

logger = logging.getLogger(__name__)

class DeterministicEngine:
    """
    The heart of the deterministic architecture (v17).
    Executes the 10-Point Flow:
    1. Validate schema
    2. Validate classifications
    3. Apply atomic formulas
    4. Aggregate metrics
    5. Apply time logic
    6. Compare actual/budget/forecast
    7. Evaluate variance semantics
    8. Generate explanations
    9. Return numbers + reasoning
    """

    def __init__(self, registry_path: str = None):
        if not registry_path:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            registry_path = os.path.join(base_dir, "core", "knowledge_registry.yaml")
        
        self.registry_path = registry_path
        self.compiler = rule_compiler
        self.tester = engine_tester
        self.registry = self._load_registry()

    def _load_registry(self) -> Dict:
        try:
            with open(self.registry_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.error(f"Failed to load YAML Knowledge Registry: {e}")
            return {}

    def validate_schema(self, df: pd.DataFrame) -> bool:
        """Section 9: Validate schema against Data Knowledge"""
        required_cols = [col for col, meta in self.registry.get("data_dictionary", {}).items() if meta.get("required")]
        actual_cols = df.columns.tolist()
        
        missing = [c for c in required_cols if c not in actual_cols]
        if missing:
            logger.error(f"HARD ERROR: Missing mandatory columns {missing}")
            return False
        return True

    def run_unit_tests(self) -> bool:
        """Section 3: Run Deterministic Unit Tests"""
        test_results = self.tester.run_all_tests()
        if test_results["overall_status"] == "FAIL":
            logger.error(f"Deterministic Unit Tests FAILED: {json.dumps(test_results, indent=2)}")
            return False
        logger.info("Deterministic Unit Tests PASSED.")
        return True

    def generate_sql(self, metric: str, entity_id: str, period: str) -> str:
        """Uses Rule Compiler to generate deterministic SQL"""
        return self.compiler.compile_metric(metric, entity_id, period)

    def calculate_variance(self, actual: float, baseline: float, category: str = "revenue") -> Dict:
        """Section 5: Compare Actual/Baseline with Semantic Favorability"""
        if baseline == 0:
            pct = 0
        else:
            pct = (actual - baseline) / baseline
        
        diff = actual - baseline
        
        # Section 5: Favorable / Unfavorable Knowledge
        eval_rules = self.registry.get("variance_evaluation", {}).get(category, {})
        favorable_rule = eval_rules.get("favorable", "actual >= baseline")
        
        is_favorable = False
        if "actual >= baseline" in favorable_rule:
            is_favorable = actual >= baseline
        elif "actual <= baseline" in favorable_rule:
            is_favorable = actual <= baseline
            
        return {
            "actual": actual,
            "baseline": baseline,
            "variance_abs": diff,
            "variance_pct": pct,
            "status": "Favorable" if is_favorable else "Unfavorable"
        }

    def generate_explanation_tree(self, actual_data: Dict, baseline_data: Dict) -> List[str]:
        """Section 8: Rule-Based Reasoning (Explanation Tree)"""
        explanations = []
        tree_config = self.registry.get("explanation_knowledge", {}).get("trees", {}).get("gross_profit_change", {})
        
        # Check order from registry
        check_order = tree_config.get("check_order", ["revenue_change", "cogs_change"])
        templates = tree_config.get("explanation_templates", {})
        
        for check in check_order:
            if check == "revenue_change":
                act_rev = actual_data.get("total_revenue", 0)
                base_rev = baseline_data.get("total_revenue", 0)
                diff = act_rev - base_rev
                if abs(diff) > 0.01:
                    label = "revenue_up" if diff > 0 else "revenue_down"
                    template = templates.get(label, "Revenue changed by {x}")
                    explanations.append(template.replace("{x}", f"{abs(diff):,.2f}"))
            
            if check == "cogs_change":
                act_cogs = actual_data.get("total_cogs", 0)
                base_cogs = baseline_data.get("total_cogs", 0)
                diff = act_cogs - base_cogs
                if abs(diff) > 0.01:
                    label = "cogs_up" if diff > 0 else "cogs_down"
                    template = templates.get(label, "COGS changed by {y}")
                    explanations.append(template.replace("{y}", f"{abs(diff):,.2f}"))
                    
        return explanations

    def execute_flow(self, df: pd.DataFrame, entity_id: str, period: str, budget_df: pd.DataFrame = None) -> Dict:
        """Section 10: Engine Execution Flow (FINAL)"""
        # 1. Validate schema
        if not self.validate_schema(df):
             return {"status": "HARD_ERROR", "error": "Schema Validation Failed"}

        # 2. Run Unit Tests
        if not self.run_unit_tests():
             return {"status": "HARD_ERROR", "error": "Deterministic Unit Tests Failed"}

        # 3. Apply atomic formulas (In-Memory for this run, or via SQL)
        # 4. Aggregate metrics
        actual_metrics = {
            "total_revenue": df['amount_gel'].sum() - df['vat'].sum() if ('amount_gel' in df.columns and 'vat' in df.columns) else 0,
            "total_cogs": df['cost_amount'].sum() if 'cost_amount' in df.columns else 0
        }
        actual_metrics["gross_profit"] = actual_metrics["total_revenue"] - actual_metrics["total_cogs"]
        
        results = {
            "metrics": actual_metrics,
            "explanations": [],
            "variance": {},
            "status": "SUCCESS"
        }

        # 5. Compare Actual/Budget
        if budget_df is not None:
            budget_metrics = {
                "total_revenue": budget_df['total_revenue'].sum() if 'total_revenue' in budget_df.columns else 0,
                "total_cogs": budget_df['total_cogs'].sum() if 'total_cogs' in budget_df.columns else 0
            }
            budget_metrics["gross_profit"] = budget_metrics["total_revenue"] - budget_metrics["total_cogs"]
            
            # 6. Evaluate variance semantics
            results["variance"]["revenue"] = self.calculate_variance(actual_metrics["total_revenue"], budget_metrics["total_revenue"], "revenue")
            results["variance"]["profit"] = self.calculate_variance(actual_metrics["gross_profit"], budget_metrics["gross_profit"], "profit")
            
            # 7. Generate explanations (The 'Why')
            results["explanations"] = self.generate_explanation_tree(actual_metrics, budget_metrics)
            
        return results

    def calculate_metrics(self, org_id: str, metric_type: str, period: str = None) -> Dict:
        """Dashboard support: Aggregates metrics for Pulse/Canvas UI."""
        if not period:
            from datetime import datetime
            period = datetime.now().strftime("%Y-%m-%d") # Default to today or latest
        from app.services.bigquery_service import bq_service
        dataset = bq_service.get_dataset_for_org(org_id)
        
        # Mapping dashboard types to v18 metrics
        metric_map = {
            "revenue": "total_revenue",
            "profit_margin": "gross_profit",
            "revenue_trends": "total_revenue"
        }
        
        target = metric_map.get(metric_type, metric_type)
        
        try:
            # For simplicity in this bridge, we query the high-level P&L view
            if metric_type == "top_expenses":
                 query = f"""
                    SELECT category, SUM(amount) as amount 
                    FROM `{dataset}.operating_expenses` 
                    WHERE period = '{period}' 
                    GROUP BY 1 ORDER BY 2 DESC LIMIT 5
                 """
            else:
                table = "income_statement" if target == "gross_profit" else "revenue_breakdown"
                column = "gross_profit" if target == "gross_profit" else "net_revenue"
                query = f"SELECT SUM({column}) as total FROM `{dataset}.{table}` WHERE period = '{period}'"

            job = bq_service.client.query(query)
            df = job.to_dataframe()
            
            if metric_type == "top_expenses":
                return {"data": df.to_dict('records')}
            
            val = float(df['total'].iloc[0]) if not df.empty and not pd.isna(df['total'].iloc[0]) else 0.0
            
            # Special logic for profit margin return structure
            if metric_type == "profit_margin":
                return {"gross_profit": val, "total_cogs": 0} # Simplified stub
                
            return {"total": val}
            
        except Exception as e:
            logger.warning(f"Engine metric calculation failed for {metric_type}: {e}")
            return {"total": 0, "data": []}

# Singleton
deterministic_engine = DeterministicEngine()
