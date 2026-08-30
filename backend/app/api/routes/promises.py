from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.promise_to_pay import PromiseToPayCreate, PromiseToPayRead
from app.services.p2p_service import p2p_service

router = APIRouter(tags=["promises"])

@router.post("/cases/{case_id}/p2p", response_model=PromiseToPayRead)
async def create_promise(
    case_id: str,
    payload: PromiseToPayCreate,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await p2p_service.create_promise(
            db=db,
            case_id=case_id,
            promised_amount=payload.promised_amount,
            promised_date=payload.promised_date,
            notes=payload.notes
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record promise-to-pay: {str(e)}")

@router.get("/cases/{case_id}/p2p", response_model=List[PromiseToPayRead])
async def get_promises(
    case_id: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await p2p_service.get_promises(db=db, case_id=case_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch promise-to-pay records: {str(e)}")

@router.put("/cases/{case_id}/p2p/{promise_id}", response_model=PromiseToPayRead)
async def update_promise(
    case_id: str,
    promise_id: str,
    payload: PromiseToPayCreate,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await p2p_service.update_promise(
            db=db,
            case_id=case_id,
            promise_id=promise_id,
            promised_amount=payload.promised_amount,
            promised_date=payload.promised_date,
            notes=payload.notes
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update promise-to-pay: {str(e)}")

@router.post("/cases/{case_id}/p2p/verify", response_model=PromiseToPayRead)
async def verify_promise(
    case_id: str,
    promise_id: Optional[str] = Body(None, embed=True),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await p2p_service.verify_promise(db=db, case_id=case_id, promise_id=promise_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify promise-to-pay: {str(e)}")

@router.delete("/cases/{case_id}/p2p")
async def delete_promise(
    case_id: str,
    promise_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    try:
        success = await p2p_service.delete_promise(db=db, case_id=case_id, promise_id=promise_id)
        return {"success": success, "message": "Promise-to-pay commitment deleted."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete promise-to-pay: {str(e)}")
