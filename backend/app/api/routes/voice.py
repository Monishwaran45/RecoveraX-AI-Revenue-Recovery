from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.services.voice_service import voice_service

router = APIRouter(tags=["voice"])

@router.post("/cases/{case_id}/voice-call")
async def trigger_voice_call(
    case_id: str,
    custom_intent: Optional[str] = Body(None, embed=True),
    db: AsyncSession = Depends(get_db)
):
    try:
        res = await voice_service.dispatch_voice_call(db=db, case_id=case_id, custom_intent=custom_intent)
        if res.get("policy_blocked"):
            raise HTTPException(status_code=403, detail=res.get("message", "Action prohibited by guardrail policy."))
        return res
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice service failure: {str(e)}")
