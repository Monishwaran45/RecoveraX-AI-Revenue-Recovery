import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.data.seed import seed_database_if_empty
from app.api.routes import dashboard, cases, approvals, actions, audit, experiments

from app.observability import configure_langsmith
from app.api.dependencies import require_api_auth, enforce_rate_limit
from fastapi import Depends

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.is_production() and (settings.DEMO_MODE or not settings.API_AUTH_TOKEN):
        raise RuntimeError("Production requires DEMO_MODE=false and a non-empty API_AUTH_TOKEN")
    logger.info("Initializing RecoveraX Backend Services...")
    configure_langsmith()
    seed_database_if_empty()
    yield
    logger.info("Shutting down backend services.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FastAPI Backend Engine for RecoveraX (Autonomous Financial Safety & Revenue Recovery Engine)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Cache-Control"] = "no-store"
    return response

# Root & Health Checks
@app.get("/", tags=["system"])
async def root():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "docs": "/docs",
        "health": "/health",
        "demo_mode": settings.DEMO_MODE,
        "groq_model": settings.GROQ_MODEL
    }

@app.get("/health", tags=["system"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "demo_mode": settings.DEMO_MODE,
        "groq_model": settings.GROQ_MODEL
    }

# Register Routers
protected = [Depends(enforce_rate_limit), Depends(require_api_auth)]
app.include_router(dashboard.router, prefix=settings.API_V1_STR, dependencies=protected)
app.include_router(cases.router, prefix=settings.API_V1_STR, dependencies=protected)
app.include_router(approvals.router, prefix=settings.API_V1_STR, dependencies=protected)
app.include_router(actions.router, prefix=settings.API_V1_STR, dependencies=protected)
app.include_router(audit.router, prefix=settings.API_V1_STR, dependencies=protected)
app.include_router(experiments.router, prefix=settings.API_V1_STR, dependencies=protected)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
