from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.services.case_service import case_service
from app.services.action_service import action_service
from app.schemas.recovery_case import RecoveryCaseRead, RecoveryCaseDetailRead

router = APIRouter(tags=["cases"])

@router.get("/cases", response_model=List[RecoveryCaseRead])
async def get_cases(
    status: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    problem_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    limit: int = Query(50, ge=1, le=10000),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    return await case_service.get_cases(
        db=db,
        status=status,
        risk_level=risk_level,
        problem_type=problem_type,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        limit=limit,
        offset=offset
    )

@router.get("/cases/{case_id}", response_model=RecoveryCaseDetailRead)
async def get_case_detail(case_id: str, db: AsyncSession = Depends(get_db)):
    case = await case_service.get_case_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Recovery case {case_id} not found")
    return case

@router.post("/cases/{case_id}/analyze", response_model=RecoveryCaseDetailRead)
async def analyze_case(case_id: str, db: AsyncSession = Depends(get_db)):
    case = await case_service.analyze_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Recovery case {case_id} not found")
    return case

@router.post("/cases/{case_id}/stop", response_model=RecoveryCaseDetailRead)
async def stop_case(case_id: str, reason: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    case = await action_service.stop_case(db, case_id, reason=reason)
    if not case:
        raise HTTPException(status_code=404, detail=f"Recovery case {case_id} not found")
    return case
