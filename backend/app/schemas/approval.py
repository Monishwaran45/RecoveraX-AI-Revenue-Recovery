from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.policy.enums import ApprovalStatus, ActionType

class ApprovalModifyRequest(BaseModel):
    action: ActionType
    delay_minutes: int = 30
    reason: Optional[str] = None

class ApprovalActionRequest(BaseModel):
    reason: Optional[str] = None

class ApprovalRead(BaseModel):
    id: str
    case_id: str
    status: ApprovalStatus
    ai_recommendation: str
    human_decision: Optional[str] = None
    modified_action: Optional[ActionType] = None
    modified_delay_minutes: Optional[int] = None
    reason: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
