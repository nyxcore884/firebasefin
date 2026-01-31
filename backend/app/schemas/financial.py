from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class FinancialRecordBase(BaseModel):
    org_id: str
    period: str
    entity: str
    account_name: str
    product_name: Optional[str] = None
    amount: float
    currency: str = "GEL"
    source_file: Optional[str] = None

class FinancialRecordCreate(FinancialRecordBase):
    pass

class FinancialRecord(FinancialRecordBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class ConsolidationResult(BaseModel):
    period: str
    total_revenue: float
    total_cogs: float
    gross_margin: float
    breakdown: List[dict]
