from fastapi import APIRouter
from app.api.v1.endpoints import upload, ai, companies, analytics, datasets, financial_records, dashboard, reports
from app.api.v1 import financial_intelligence, analytics as analytics_v1, auto_clean

api_router = APIRouter()
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(companies.router, prefix="/companies", tags=["companies"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(datasets.router, prefix="/datasets", tags=["datasets"])
api_router.include_router(financial_records.router, prefix="/financial", tags=["financial"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(financial_intelligence.router, prefix="/financial-ai", tags=["Financial AI"])
api_router.include_router(analytics_v1.router, prefix="/analytics-engine", tags=["Analytics Engine"])
api_router.include_router(auto_clean.router, prefix="/auto-clean", tags=["Auto Clean"])
