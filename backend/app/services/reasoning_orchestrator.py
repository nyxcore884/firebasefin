import yaml
import logging
import os
from typing import Dict, List, Any, Optional
from app.services.deterministic_engine import deterministic_engine

logger = logging.getLogger(__name__)

class ReasoningOrchestrator:
    """
    SECTION 9 & 10: REASONING ORCHESTRATOR 🧩
    The "Nervous System" above the Deterministic Engine.
    Decides "what to ask" and "where to look".
    """

    def __init__(self, registry_path: str = None):
        if not registry_path:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            registry_path = os.path.join(base_dir, "core", "knowledge_registry.yaml")
        
        self.registry_path = registry_path
        self.engine = deterministic_engine
        self.registry = self._load_registry()

    def _load_registry(self) -> Dict:
        try:
            with open(self.registry_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.error(f"Failed to load YAML Knowledge Registry: {e}")
            return {}

    def analyze_variance_drivers(self, actual_data: Dict, budget_data: Dict, focus_metric: str = "gross_profit") -> Dict:
        """
        Implements Step 2: Reasoning Plans (Decision Trees)
        1. Identify Variance
        2. Select Hypothesis
        3. Test Drivers
        4. Calculate Confidence
        """
        total_variance = actual_data.get(focus_metric, 0) - budget_data.get(focus_metric, 0)
        
        if abs(total_variance) < 0.01:
            return {"status": "NO_VARIANCE", "explanation": "No significant variance to analyze."}

        # Step 1: Detect intent/hypothesis candidate
        hypothesis_key = "profit_decline" if total_variance < 0 else "profit_growth"
        hypotheses = self.registry.get("hypothesis_knowledge", {}).get("profit_decline", {})
        
        # Step 2: Reasoning Plan (Cascading Checks)
        reasoning_path = []
        findings = []
        explained_variance = 0
        
        # Check Revenue Driver
        revenue_actual = actual_data.get("total_revenue", 0)
        revenue_budget = budget_data.get("total_revenue", 0)
        rev_var = revenue_actual - revenue_budget
        
        reasoning_path.append("Testing Hypothesis: Revenue Decrease")
        if rev_var < 0:
             findings.append(f"Confirmed: Revenue shortfall of {abs(rev_var):,.2f}")
             explained_variance += abs(rev_var) if total_variance < 0 else rev_var
        else:
             findings.append("Hypothesis Rejected: Revenue is favorable.")

        # Check COGS Driver
        cogs_actual = actual_data.get("total_cogs", 0)
        cogs_budget = budget_data.get("total_cogs", 0)
        cogs_var = cogs_actual - cogs_budget # Positive Var in COGS is bad
        
        reasoning_path.append("Testing Hypothesis: COGS Increase")
        if cogs_var > 0:
             findings.append(f"Confirmed: COGS overrun of {abs(cogs_var):,.2f}")
             explained_variance += abs(cogs_var) if total_variance < 0 else -cogs_var
        else:
             findings.append("Hypothesis Rejected: COGS is below budget.")

        # Step 3: Confidence Scoring (Explained / Total)
        confidence_score = 0
        if abs(total_variance) > 0:
             confidence_score = min(1.0, abs(explained_variance) / abs(total_variance))

        # Heuristics check: Should we stop?
        stop_threshold = self.registry.get("reasoning_heuristics", {}).get("stop_when_explained_pct", 0.8)
        
        return {
            "focus_metric": focus_metric,
            "total_variance": total_variance,
            "explained_variance": explained_variance,
            "confidence_score": confidence_score,
            "reasoning_path": reasoning_path,
            "ranked_causes": findings,
            "status": "EXPLAINED" if confidence_score >= stop_threshold else "PARTIALLY_EXPLAINED"
        }

    def select_reasoning_plan(self, query: str) -> Optional[str]:
        """Detects if query requires reasoning vs simple calculation"""
        query_lower = query.lower()
        if any(x in query_lower for x in ["why", "drive", "cause", "explain", "reason"]):
            return "variance_analysis"
        return None

# Singleton
reasoning_orchestrator = ReasoningOrchestrator()
