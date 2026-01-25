from firebase_admin import firestore
import firebase_admin
from firebase_functions import https_fn, options
import json
import logging
import math
import random

# --- 1. Init ---
if not firebase_admin._apps:
    firebase_admin.initialize_app()

logger = logging.getLogger(__name__)

# --- 2. Registry ---
STATUTORY_HIERARCHY = {
    "ASSETS": ["1000", "1100", "1200", "1300", "1400", "1500", "1600"],
    "LIABILITIES": ["2000", "2100", "2200", "2300", "2400", "2500"],
    "EQUITY": ["3000", "3100"],
    "REVENUE": ["4000", "4100", "4200"],
    "COGS": ["5000", "5100"],
    "OPEX": ["6000", "6100", "6200", "6300", "6400", "6500", "6600"],
}

SEMANTIC_METRICS = {
    "REVENUE": {"type": "FLOW", "sign": 1},
    "OPEX": {"type": "FLOW", "sign": -1},
    "COGS": {"type": "FLOW", "sign": -1},
}

MAPPING_RULES = {
    "REVENUE": {"categories": ["Sales", "Revenue", "Income", "service_revenue"], "gl_range": (3000, 4999)},
    "COGS": {"categories": ["COGS", "Direct Cost", "material_cost"], "gl_range": (5000, 5999)},
    "OPEX": {"categories": ["Rent", "Salary", "Utilities", "Maintenance", "Admin"], "gl_range": (6000, 7999)},
}

# --- 3. Logic ---
def get_statutory_key(acct_code):
    if not acct_code: return "OTHER"
    prefix = str(acct_code)[:1]
    mapping = {"1": "ASSETS", "2": "LIABILITIES", "3": "EQUITY", "4": "REVENUE", "5": "COGS", "6": "OPEX"}
    return mapping.get(prefix, "OTHER")

def get_semantic_bucket(fact):
    direct = fact.get("metric")
    if direct and direct.upper() in SEMANTIC_METRICS: return direct.upper()
    acct = fact.get("account_code")
    if acct:
        try:
            code = int(acct)
            for key, rule in MAPPING_RULES.items():
                r = rule.get("gl_range")
                if r and r[0] <= code <= r[1]: return key
        except: pass
    cat = fact.get("cost_category")
    if cat:
        norm_cat = cat.lower().strip()
        for key, rule in MAPPING_RULES.items():
            if any(c.lower() == norm_cat for c in rule.get("categories", [])): return key
    return None

def detect_anomalies(facts):
    anomalies = []
    cat_stats = {}
    for f in facts:
        cat = f.get("cost_category", "General")
        val = float(f.get("actual_month", 0) or 0)
        if cat not in cat_stats: cat_stats[cat] = []
        cat_stats[cat].append(val)
    
    for cat, vals in cat_stats.items():
        if not vals: continue
        avg = sum(vals) / len(vals)
        for val in vals:
            if val > avg * 1.8 and val > 1000:
                anomalies.append({
                    "id": f"anom-{random.randint(1000,9999)}",
                    "description": f"Spike detection in {cat}: {val} vs avg {round(avg)}",
                    "severity": "high" if val > avg * 2.5 else "medium",
                    "amount": val,
                    "rule": "SpikeAnomaly"
                })
    return anomalies

def generate_forecast(actual_history, horizon_months=6):
    last_val = actual_history[-1]['actual'] if actual_history else 45000
    forecast = []
    for i in range(1, horizon_months + 1):
        drift = random.uniform(0.97, 1.05)
        last_val = last_val * drift
        forecast.append({
            "name": f"Month +{i}",
            "actual": None,
            "forecast": round(last_val),
            "Range": [round(last_val * 0.9), round(last_val * 1.1)]
        })
    return forecast

def materialize_truth(db, datasets, filters):
    entity = filters.get("entity")
    department = filters.get("department", "All")
    
    aggregates = {k: 0.0 for k in SEMANTIC_METRICS.keys()}
    statutory = {k: 0.0 for k in STATUTORY_HIERARCHY.keys()}
    breakdown_map = {}
    all_facts = []
    
    for ds in datasets:
        # BASE QUERY
        query = db.collection("fact_financial_summary")\
                  .where("dataset_id", "==", ds['id'])\
                  .where("dataset_version", "==", ds.get('current_version'))
        
        # SMART FILTERING: Only apply filters if they aren't "Wildcard"
        # This bypasses the need for index-intensive multi-field composite indexes for broad views.
        if entity and entity != "GROUP":
            query = query.where("entity", "==", entity)
            
        if department and department != "All":
            query = query.where("department", "==", department)
            
        try:
            facts = query.stream()
            for doc in facts:
                f = doc.to_dict()
                all_facts.append(f)
                acct = f.get("account_code")
                mk = get_semantic_bucket(f)
                sk = get_statutory_key(acct)
                actual = float(f.get("actual_month", 0) or 0)
                budget = float(f.get("budget_month", 0) or 0)
                
                if mk and mk in aggregates: aggregates[mk] += actual
                if sk in statutory: statutory[sk] += actual
                
                lbl = f.get("cost_category") or f.get("metric") or "Unclassified"
                if lbl not in breakdown_map:
                    breakdown_map[lbl] = {"article": lbl, "actual": 0.0, "budget": 0.0, "semantic_key": mk or "OTHER"}
                breakdown_map[lbl]["actual"] += actual
                breakdown_map[lbl]["budget"] += budget
        except Exception as qe:
            logger.error(f"Query Execution Failed: {qe}")
            # If query fails (likely missing index for the specific combination), return empty but continue
            pass

    waterfall = []
    for lbl, vals in breakdown_map.items():
        var = vals['actual'] - vals['budget']
        if abs(var) > 0.01:
            waterfall.append({"name": lbl, "value": var})
            
    revenue = aggregates.get("REVENUE", 0)
    opex = abs(aggregates.get("OPEX", 0))
    cogs = abs(aggregates.get("COGS", 0))
    net_income = revenue - opex - cogs
    
    anomalies = detect_anomalies(all_facts)
    forecast = generate_forecast([{"actual": revenue}])

    return {
        "metrics": {
            **aggregates,
            "net_income": net_income,
            "burn_rate": opex,
            "cash_runway": round(revenue/opex * 12, 1) if opex > 0 else 0
        },
        "statutory": statutory,
        "breakdown": list(breakdown_map.values()),
        "waterfall": waterfall,
        "anomalies": anomalies,
        "forecast": forecast,
        "transactions": [
            {
                "id": f"txn-{i}",
                "description": f.get("cost_category", "Transaction"),
                "amount": float(f.get("actual_month", 0)),
                "category": get_semantic_bucket(f) or "OTHER",
                "type": "credit" if get_semantic_bucket(f) == "REVENUE" else "debit",
                "timestamp": f.get("period_date", "2023-11")
            } for i, f in enumerate(all_facts[:30])
        ]
    }

# --- 4. Entry ---
_db = None
def get_db():
    global _db
    if _db is None: _db = firestore.client()
    return _db

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["POST", "OPTIONS"]),
    timeout_sec=60,
    memory=options.MemoryOption.MB_512,
)
def generate_financial_truth(req: https_fn.Request) -> https_fn.Response:
    try:
        db = get_db()
        data = req.get_json(silent=True) or {}
        action = data.get("action", "generate")
        
        if action == "manage_locks":
            period = data.get("period")
            locked = data.get("locked", True)
            if not period: return https_fn.Response("Period required", status=400)
            tag = f"period:{period}"
            docs = db.collection("dataset_registry").where("tags", "array_contains", tag).stream()
            count = 0
            for d in docs:
                d.reference.update({"locked": locked})
                count += 1
            return https_fn.Response(json.dumps({"status": "success", "count": count}), status=200, headers={"Content-Type":"application/json"})

        # Common Parameters
        entity = data.get("entity", "SGG-001")
        period = data.get("period", "2023-11")
        department = data.get("department", "All")
        
        if action == "hud_metrics":
            tag = f"period:{period}"
            docs = db.collection("dataset_registry").where("tags", "array_contains", tag).where("locked", "==", True).stream()
            datasets = [ {**d.to_dict(), 'id': d.id} for d in docs ]
            if not datasets: 
                return https_fn.Response(json.dumps({"REVENUE": 0, "OPEX": 0, "net_income": 0, "burn_rate": 0, "cash_runway": 0}), status=200, headers={"Content-Type":"application/json"})
            res = materialize_truth(db, datasets, {"entity": entity, "department": department})
            return https_fn.Response(json.dumps(res['metrics']), status=200, headers={"Content-Type":"application/json"})

        # Default: Generate Full Truth Object
        tag = f"period:{period}"
        docs = db.collection("dataset_registry").where("tags", "array_contains", tag).where("locked", "==", True).stream()
        datasets = [ {**d.to_dict(), 'id': d.id} for d in docs ]
            
        if not datasets:
            return https_fn.Response(json.dumps({"error": "No locked data", "locked": False}), status=409, headers={"Content-Type":"application/json"})

        res = materialize_truth(db, datasets, {"entity": entity, "department": department})
        truth = {
            "entity": entity, "period": period, "department": department,
            "metrics": res['metrics'],
            "statutory": res['statutory'],
            "breakdown": res['breakdown'],
            "waterfall": res['waterfall'],
            "anomalies": res['anomalies'],
            "forecast": res['forecast'],
            "transactions": res['transactions'],
            "locked": True,
            "generated_at": firestore.SERVER_TIMESTAMP
        }
        return https_fn.Response(json.dumps(truth, default=str), status=200, headers={"Content-Type":"application/json"})
    except Exception as e:
        logger.error(f"Failed: {e}")
        return https_fn.Response(json.dumps({"error": str(e)}), status=500, headers={"Content-Type":"application/json"})
