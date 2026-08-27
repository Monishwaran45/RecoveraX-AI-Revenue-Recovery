from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from app.policy.enums import ActorType, AuditEventType

class AuditLogRead(BaseModel):
    id: str
    case_id: str
    event_type: AuditEventType
    actor_type: ActorType
    actor_id: str
    reason: str
    metadata_json: Optional[Dict[str, Any]] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
