"""
Firestore Collection: financial_records

Document Schema:
{
    "org_id": str,          # Tenant ID (e.g., SGG-001)
    "period": str,          # YYYY-MM
    "entity": str,          # Regional Entity
    "account_name": str,    # Revenue, COGS, etc.
    "product_name": str,    # Optional (e.g., Natural Gas)
    "amount": float,        # Value
    "currency": str,        # GEL
    "source_file": str,     # Origin filename
    "created_at": datetime  # Ingestion timestamp
}
"""
