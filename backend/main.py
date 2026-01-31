from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.middleware import CompanyContextMiddleware
from app.api.v1.api import api_router
from google.cloud import bigquery
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, Dict, List
from app.services.intelligence_service import intelligence_service

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise Financial Intelligence System - Modular Refactor",
    version="2.0.0"
)

# 1. Enable CORS for Frontend Access (MUST BE FIRST)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://studio-9381016045-4d625.web.app",
        "https://firebasefin-backend-733431756980.us-central1.run.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://studio-9381016045-4d625.firebaseapp.com" # Added common firebase suffix
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Company-ID",
        "Accept",
        "Origin",
        "X-Requested-With"
    ],
    expose_headers=["*"],
)

# 2. Company Context Middleware
app.add_middleware(CompanyContextMiddleware)

# Initialize BigQuery Client for Systemic Brain
bq_client = bigquery.Client(project=settings.PROJECT_ID)

# Mount V1 API
app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
