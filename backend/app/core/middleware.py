from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse

class CompanyContextMiddleware(BaseHTTPMiddleware):
    """
    Ensures every request is isolated to a specific company.
    Reads 'X-Company-ID' header and injects it into request state.
    Falls back to SOCAR_GROUP for AI/general queries if not provided.
    """
    async def dispatch(self, request: Request, call_next):
        # Skip health checks and company bootstrap
        if request.url.path.endswith("/health") or request.url.path.endswith("/api/v1/companies"):
            return await call_next(request)

        org_id = request.headers.get("X-Company-ID")
        
        # Use default for AI endpoints or when header is missing
        # This allows queries without strict multi-tenant context
        if not org_id:
            org_id = "SOCAR_GROUP"  # Default to consolidated view
        
        # Store in state for easy access in endpoints
        request.state.org_id = org_id
        response = await call_next(request)
        return response

