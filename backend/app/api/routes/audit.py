from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogRead

router = APIRouter(tags=["audit"])

@router.get("/cases/{case_id}/audit", response_model=List[AuditLogRead])
async def get_case_audit_logs(case_id: str, db: AsyncSession = Depends(get_db)):
    query = select(AuditLog).where(AuditLog.case_id == case_id).order_by(AuditLog.timestamp.asc())
    res = await db.execute(query)
    logs = list(res.scalars().all())
    return logs
