# SINGLE SOURCE OF TRUTH FOR METRICS

SEMANTIC_METRICS = {
    "REVENUE": {
        "type": "FLOW",
        "sign": 1
    },
    "OPEX": {
        "type": "FLOW",
        "sign": -1
    },
    "COGS": {
        "type": "FLOW",
        "sign": -1
    },
    "PROCUREMENT_SPEND": {
        "type": "FLOW",
        "sign": -1
    }
}

DERIVED_METRICS = {
    "GROSS_MARGIN": lambda a: a.get("REVENUE", 0) + a.get("COGS", 0),
    "EBITDA": lambda a: a.get("REVENUE", 0) + a.get("COGS", 0) + a.get("OPEX", 0),
    "OPERATING_CASHFLOW": lambda a: a.get("EBITDA", 0) # Simplified
}

# BASIC FINANCIAL MAPPING RULES (Fallback MDM)
# In production, this should be loaded from a Firestore collection 'chart_of_accounts'
MAPPING_RULES = {
    "REVENUE": {
        "categories": ["Sales", "Revenue", "Income", "service_revenue", "product_sales"],
        "gl_range": (3000, 4999)
    },
    "COGS": {
        "categories": ["Direct Cost", "Cost of Sales", "COGS", "material_cost", "Social Gas Cost"],
        "gl_range": (5000, 5999)
    },
    "OPEX": {
        "categories": [
            "Office Supplies", "Rent", "Salary", "Communication", "Transport", 
            "Marketing", "Legal", "Utilities", "Maintenance", "personnel", "admin"
        ],
        "gl_range": (6000, 7999)
    },
    "PROCUREMENT_SPEND": {
        "categories": ["Procurement", "Purchase"],
        "gl_range": None
    }
}
