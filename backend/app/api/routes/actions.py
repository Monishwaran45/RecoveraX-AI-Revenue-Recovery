from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.services.action_service import action_service
from app.schemas.recovery_case import RecoveryCaseDetailRead

router = APIRouter(tags=["actions"])

@router.post("/cases/{case_id}/recheck", response_model=RecoveryCaseDetailRead)
async def recheck_case(case_id: str, db: AsyncSession = Depends(get_db)):
    case = await action_service.recheck_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    return case

@router.post("/cases/{case_id}/execute", response_model=RecoveryCaseDetailRead)
async def execute_case(case_id: str, db: AsyncSession = Depends(get_db)):
    case = await action_service.execute_case_action(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found for execution")
    return case

@router.post("/cases/{case_id}/reset", response_model=RecoveryCaseDetailRead)
async def reset_case(case_id: str, db: AsyncSession = Depends(get_db)):
    case = await action_service.reset_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found for reset")
    return case
