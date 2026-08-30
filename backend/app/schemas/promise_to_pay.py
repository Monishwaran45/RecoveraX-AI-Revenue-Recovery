from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict

class PromiseToPayCreate(BaseModel):
    promised_amount: float = Field(..., gt=0, description="Promised amount must be greater than zero")
    promised_date: datetime = Field(..., description="Target date customer promised to settle payment")
    notes: Optional[str] = Field(None, max_length=512, description="Optional agent or customer commitment notes")

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v.strip()) > 512:
            raise ValueError("Notes length cannot exceed 512 characters")
        return v.strip() if v else None

class PromiseToPayRead(BaseModel):
    id: str
    case_id: str
    promised_amount: float
    promised_date: datetime
    status: str # PROMISED, P2P_KEPT, P2P_BROKEN, EXPIRED
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PromiseToPayVerify(BaseModel):
    case_id: str
    promise_id: str
    verified: bool
    status: str # PROMISED, P2P_KEPT, P2P_BROKEN
    reason: str
    verification_date: datetime
