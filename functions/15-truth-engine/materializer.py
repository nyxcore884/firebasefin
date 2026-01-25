from metrics_registry import SEMANTIC_METRICS, DERIVED_METRICS, MAPPING_RULES
from google.cloud import firestore

def get_semantic_bucket(fact):
    """
    Determines the Semantic Metric Key (e.g., 'OPEX') from a raw fact.
    """
    # 1. Direct Override (If transformer already mapped it)
    direct = fact.get("metric")
    if direct and direct.upper() in SEMANTIC_METRICS:
        return direct.upper()
        
    # 2. Account Code Mapping
    acct = fact.get("account_code")
    if acct:
        try:
            code = int(acct)
            for key, rule in MAPPING_RULES.items():
                r = rule.get("gl_range")
                if r and r[0] <= code <= r[1]:
                    return key
        except:
            pass # Non-numeric code
            
    # 3. Category String Mapping
    cat = fact.get("cost_category")
    if cat:
        norm_cat = cat.lower().strip()
        for key, rule in MAPPING_RULES.items():
            # Check list
            if any(c.lower() == norm_cat for c in rule.get("categories", [])):
                return key
                
    return None

def materialize_metrics(db, datasets, registry):
    """
    Computes metrics from LOCKED datasets using Semantic Mapping.
    """
    # Initialize Aggregates
    aggregates = {k: 0.0 for k in registry.keys()}
    
    # Detailed Breakdown for Analysis Page
    breakdown_map = {} # { "Office Supplies": { actual: 0, budget: 0, metric: 'OPEX' } }

    for ds in datasets:
        ds_id = ds['id']
        ds_ver = ds.get('current_version')
        
        # Stream Facts (Trusted)
        facts = (
            db.collection("fact_financial_summary")
            .where(filter=firestore.FieldFilter("dataset_id", "==", ds_id))
            .where(filter=firestore.FieldFilter("dataset_version", "==", ds_ver))
            .stream()
        )
        
        for doc in facts:
            f = doc.to_dict()
            
            # Use Mapping Engine
            metric_key = get_semantic_bucket(f)
            
            # Raw Values
            actual_m = float(f.get("actual_month", 0))
            budget_m = float(f.get("budget_month", 0))
            
            # 1. Semantic Aggregation (High Level)
            if metric_key and metric_key in aggregates:
                # Sign Logic
                target_sign = registry[metric_key].get("sign", 1)
                
                # Apply sign to HIGH LEVEL aggregate
                val_to_add = actual_m
                if target_sign == -1 and val_to_add > 0:
                    val_to_add = -val_to_add
                
                aggregates[metric_key] += val_to_add
            
            # 2. Granular Breakdown (Low Level)
            label = f.get("cost_category") or f.get("metric") or "Unclassified"
            if label not in breakdown_map:
                breakdown_map[label] = {
                    "article": label,
                    "actual": 0.0,
                    "budget": 0.0,
                    "semantic_key": metric_key or "OTHER"
                }
            
            breakdown_map[label]["actual"] += actual_m
            breakdown_map[label]["budget"] += budget_m

    # Derived Metrics
    derived = {}
    for k, fn in DERIVED_METRICS.items():
        try:
            derived[k] = fn(aggregates)
        except Exception as e:
            derived[k] = 0.0
        
    return {
        "metrics": {**aggregates, **derived},
        "breakdown": list(breakdown_map.values())
    }
