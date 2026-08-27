from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.policy.enums import ActionType

class LLMDiagnosisOutput(BaseModel):
    diagnosis: str
    confidence: float
    reason: str

class LLMRecommendationOutput(BaseModel):
    recommended_action: ActionType
    delay_minutes: int = 30
    reason: str

class RecommendationRead(BaseModel):
    id: str
    case_id: str
    diagnosis: str
    recovery_score: int
    recommended_action: ActionType
    delay_minutes: int
    expected_recovery_value: float
    reason: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
