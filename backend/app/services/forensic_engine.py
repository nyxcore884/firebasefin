import logging
from typing import List, Optional, Dict
from datetime import datetime
from app.core.config import settings

logger = logging.getLogger(__name__)

class ForensicEngine:
    """
    Brain 1 (Deterministic): The core mathematical engine for SGP Intelligence.
    Dynamically generates forensic SQL for any data structure.
    """
    def __init__(self, project_id: str, dataset: str = "sgp_financial_intelligence"):
        self.project_id = project_id
        self.dataset = dataset
        self.base_path = f"{project_id}.{dataset}"

    def get_universal_anomaly_sql(self, 
                                  dataset_id: str,
                                  table_name: str, 
                                  metric_col: str, 
                                  id_col: str, 
                                  time_col: str = "period") -> str:
        """
        Brain 1: Statistical Outlier Detection (Z-Score > 3).
        Injected with dataset_id for strict tenant isolation.
        """
        base_path = dataset_id
        return f"""
        WITH stats AS (
            SELECT 
                {id_col} as entity_id,
                AVG({metric_col}) as avg_val,
                STDDEV({metric_col}) as std_val
            FROM `{base_path}.{table_name}`
            GROUP BY 1
        ),
        raw_data AS (
            SELECT 
                {id_col} as entity_id,
                {time_col} as analysis_date,
                {metric_col} as metric_value
            FROM `{base_path}.{table_name}`
        )
        SELECT 
            r.entity_id as Entity,
            r.analysis_date as Period,
            r.metric_value as Value,
            s.avg_val,
            s.std_val,
            ABS(r.metric_value - s.avg_val) / NULLIF(s.std_val, 0) as z_score,
            CASE 
                WHEN ABS(r.metric_value - s.avg_val) / NULLIF(s.std_val, 0) > 4 THEN 'CRITICAL'
                WHEN ABS(r.metric_value - s.avg_val) / NULLIF(s.std_val, 0) > 3 THEN 'SUSPICIOUS'
                ELSE 'STABLE'
            END as Status
        FROM raw_data r
        JOIN stats s ON r.entity_id = s.entity_id
        WHERE ABS(r.metric_value - s.avg_val) > (3 * s.std_val)
        ORDER BY z_score DESC
        """

    def get_fx_leakage_sql(self, dataset_id: str, table_name: str = "cogs_data") -> str:
        """
        SGP Specific Rule: Detects misallocation in Account 8230 (FX).
        """
        base_path = dataset_id
        return f"""
        SELECT 
            product_name_georgian as Entity,
            total_cogs as TotalCost,
            cogs_8230 as FXValue,
            SAFE_DIVIDE(cogs_8230, total_cogs) as fx_intensity,
            CASE 
                WHEN SAFE_DIVIDE(cogs_8230, total_cogs) > 0.80 THEN 'CRITICAL'
                ELSE 'STABLE'
            END as Status
        FROM `{base_path}.{table_name}`
        WHERE total_cogs > 0
        ORDER BY fx_intensity DESC
        """

    def get_metadata_discovery_sql(self, table_name: str) -> str:
        """
        Brain 1: Automated Discovery. 
        Identifies numeric columns for universal scanning.
        """
        return f"""
        SELECT column_name, data_type 
        FROM `{self.project_id}.{self.dataset}.INFORMATION_SCHEMA.COLUMNS`
        WHERE table_name = '{table_name}'
        AND data_type IN ('FLOAT64', 'INT64', 'NUMERIC', 'BIGNUMERIC')
        """

    def get_margin_correction_sql(self, revenue_table: str = "revenue_data", cogs_table: str = "cogs_data") -> str:
        """
        Generates a consolidated Margin Intelligence report.
        """
        return f"""
        SELECT 
            r.product_name_georgian as Entity,
            SUM(r.net_revenue) as Revenue,
            SUM(c.total_cogs) as Cost,
            SAFE_DIVIDE(SUM(r.net_revenue) - SUM(c.total_cogs), NULLIF(SUM(r.net_revenue), 0)) as Margin
        FROM `{self.base_path}.{revenue_table}` r
        JOIN `{self.base_path}.{cogs_table}` c 
          ON r.product_name_georgian = c.product_name_georgian 
          AND r.period = c.period
        GROUP BY 1
        HAVING Margin < 0
        """

    def get_universal_scan_sql(self, table_name: str, numeric_columns: List[str]) -> str:
        """
        Brain 1: Forensic Unpivot. 
        Scans ALL numeric columns for outliers simultaneously.
        """
        columns_list = ", ".join(numeric_columns)
        return f"""
        WITH unpivoted_data AS (
            SELECT 
                * 
            FROM `{self.base_path}.{table_name}`
            UNPIVOT(value FOR column_meta IN ({columns_list}))
        ),
        stats AS (
            SELECT 
                column_meta,
                AVG(value) as avg_val,
                STDDEV(value) as std_val
            FROM unpivoted_data
            GROUP BY 1
        )
        SELECT 
            u.column_meta as Field,
            u.value as Value,
            s.avg_val,
            s.std_val,
            ABS(u.value - s.avg_val) / NULLIF(s.std_val, 0) as z_score,
            CASE 
                WHEN ABS(u.value - s.avg_val) / NULLIF(s.std_val, 0) > 4 THEN 'CRITICAL'
                WHEN ABS(u.value - s.avg_val) / NULLIF(s.std_val, 0) > 3 THEN 'SUSPICIOUS'
                ELSE 'STABLE'
            END as Status
        FROM unpivoted_data u
        JOIN stats s ON u.column_meta = s.column_meta
        WHERE ABS(u.value - s.avg_val) > (3 * s.std_val)
        ORDER BY z_score DESC
        LIMIT 20
        """

# Singleton
forensic_engine = ForensicEngine(project_id=settings.PROJECT_ID)
