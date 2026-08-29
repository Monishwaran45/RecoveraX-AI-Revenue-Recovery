from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.services.approval_service import approval_service
from app.schemas.approval import ApprovalRead, ApprovalModifyRequest, ApprovalActionRequest
from app.schemas.recovery_case import RecoveryCaseDetailRead

router = APIRouter(tags=["approvals"])

@router.get("/approvals", response_model=List[ApprovalRead])
async def get_approvals(db: AsyncSession = Depends(get_db)):
    return await approval_service.get_pending_approvals(db)

@router.post("/cases/{case_id}/approve", response_model=RecoveryCaseDetailRead)
async def approve_case(
    case_id: str,
    payload: Optional[ApprovalActionRequest] = None,
    db: AsyncSession = Depends(get_db)
):
    reason = payload.reason if payload else None
    try:
        case = await approval_service.approve_case(db, case_id, reason=reason)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found for approval")
    return case

@router.post("/cases/{case_id}/reject", response_model=RecoveryCaseDetailRead)
async def reject_case(
    case_id: str,
    payload: Optional[ApprovalActionRequest] = None,
    db: AsyncSession = Depends(get_db)
):
    reason = payload.reason if payload else None
    try:
        case = await approval_service.reject_case(db, case_id, reason=reason)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found for rejection")
    return case

@router.post("/cases/{case_id}/modify", response_model=RecoveryCaseDetailRead)
async def modify_case(
    case_id: str,
    payload: ApprovalModifyRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        case = await approval_service.modify_case(
            db=db, case_id=case_id, modified_action=payload.action,
            modified_delay_minutes=payload.delay_minutes, reason=payload.reason
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found for modification")
    return case
