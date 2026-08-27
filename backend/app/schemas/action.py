from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.policy.enums import ActionType

class ActionCreate(BaseModel):
    case_id: str
    action_type: ActionType
    scheduled_at: Optional[datetime] = None

class ActionRead(BaseModel):
    id: str
    case_id: str
    action_type: ActionType
    status: str
    scheduled_at: Optional[datetime] = None
    executed_at: Optional[datetime] = None
    result: Optional[str] = None
    amount_recovered: float = 0.0
    created_by: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
