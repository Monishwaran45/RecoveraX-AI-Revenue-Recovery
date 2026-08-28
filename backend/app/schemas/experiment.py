from datetime import datetime
from typing import List
from pydantic import BaseModel, ConfigDict

class ExperimentResultRead(BaseModel):
    id: str
    experiment_id: str
    case_id: str
    baseline_outcome: str
    ai_outcome: str
    amount_at_risk: float
    amount_recovered: float
    incremental_recovered: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ExperimentRead(BaseModel):
    id: str
    name: str
    case_count: int
    revenue_at_risk: float
    baseline_recovered: float
    ai_recovered: float
    incremental_recovered: float
    baseline_recovery_rate: float = 0.0
    ai_recovery_rate: float = 0.0
    auto_count: int = 0
    human_count: int = 0
    blocked_count: int = 0
    stopped_count: int = 0
    safety_actions_prevented: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ExperimentDetailRead(ExperimentRead):
    results: List[ExperimentResultRead] = []
