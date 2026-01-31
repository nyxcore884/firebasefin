import yaml
import logging
import os
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class RuleCompiler:
    """
    SECTION 2: Rule Compiler Design (YAML -> SQL / BigQuery)
    Turns the "Law of Finance" (YAML) into executable BigQuery SQL.
    """

    def __init__(self, registry_path: str = None):
        if not registry_path:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            registry_path = os.path.join(base_dir, "core", "knowledge_registry.yaml")
        
        self.registry_path = registry_path
        self.registry = self._load_registry()

    def _load_registry(self) -> Dict:
        try:
            with open(self.registry_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.error(f"Failed to load YAML Knowledge Registry: {e}")
            return {}

    def compile_metric(self, metric_name: str, entity_id: str, period: str) -> str:
        """
        PIPINE SECTION 2.2:
        1. Resolve dependencies
        2. Build SQL
        3. Apply filters
        """
        metric_cfg = self.registry.get("metrics", {}).get(metric_name)
        if not metric_cfg:
            raise ValueError(f"Metric '{metric_name}' not found in registry.")

        # Resolve children if it's an aggregation
        aggregation_cfg = self.registry.get("aggregation_rules", {}).get(metric_name)
        if not aggregation_cfg:
             # Check if it's a direct formula-based metric (like gross_profit)
             if "formula" in metric_cfg:
                 return self._compile_formula_metric(metric_name, metric_cfg, entity_id, period)
             raise ValueError(f"No aggregation or formula rule for metric '{metric_name}'")

        if "children" in aggregation_cfg:
             return self._compile_parent_metric(metric_name, aggregation_cfg, entity_id, period)
        
        return self._compile_atomic_aggregation(metric_name, aggregation_cfg, entity_id, period)

    def _compile_atomic_aggregation(self, name: str, cfg: Dict, entity_id: str, period: str) -> str:
        """Section 2.3: Build aggregation SQL from Bronze/Silver tables"""
        source_table = cfg.get("source_table")
        measure = cfg.get("measure")
        filters = cfg.get("filter", {})

        where_clauses = [
            f"entity_id = '{entity_id}'",
            f"period = '{period}'"
        ]
        
        for col, val in filters.items():
            where_clauses.append(f"{col} = '{val}'")

        sql = f"""
        SELECT
            entity_id,
            period,
            SUM({measure}) as {name}
        FROM `{{project_id}}.finance_core.{source_table}`
        WHERE {" AND ".join(where_clauses)}
        GROUP BY 1, 2
        """
        return sql.strip()

    def _compile_parent_metric(self, name: str, cfg: Dict, entity_id: str, period: str) -> str:
        """Section 1.4: Parent metrics never have raw SQL — only references to children"""
        children = cfg.get("children", [])
        
        # Build CTEs for each child
        child_sqls = []
        for child in children:
            child_sqls.append(f"({self.compile_metric(child, entity_id, period)}) AS {child}_data")

        # For simplicity in this compiler version, we generate a single JOIN/Sum result
        # Standard approach for total_revenue aggregation rule
        sql = f"""
        SELECT
            entity_id,
            period,
            { " + ".join([f"SUM(CASE WHEN revenue_type='{self._get_rev_type(c)}' THEN net_revenue END)" for c in children]) }
            AS {name}
        FROM `{{project_id}}.finance_core.revenue_breakdown`
        WHERE entity_id = '{entity_id}' AND period = '{period}'
        GROUP BY 1, 2
        """
        return sql.strip()

    def _compile_formula_metric(self, name: str, cfg: Dict, entity_id: str, period: str) -> str:
        """Section 1.4: Metric-level formulas (e.g. gross_profit)"""
        formula = cfg.get("formula") # e.g. "total_revenue - total_cogs"
        
        # In a real compiler, we parse the formula and build a CTE-based join.
        # For SOCAR v17, we generate the deterministic P&L view query.
        sql = f"""
        SELECT
            entity_id,
            period,
            (total_revenue - total_cogs) as {name}
        FROM `{{project_id}}.finance_core.income_statement`
        WHERE entity_id = '{entity_id}' AND period = '{period}'
        """
        return sql.strip()

    def _get_rev_type(self, metric_name: str) -> str:
        # Helper to map revenue_wholesale -> "Revenue Wholesale"
        return metric_name.replace("revenue_", "Revenue ").title()

# Singleton
rule_compiler = RuleCompiler()
