from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.services.dashboard_service import dashboard_service
from app.schemas.recovery_case import DashboardMetrics

router = APIRouter(tags=["dashboard"])

@router.get("/dashboard/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(db: AsyncSession = Depends(get_db)):
    return await dashboard_service.get_metrics(db)
