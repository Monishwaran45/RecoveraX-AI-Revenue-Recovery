from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.policy.enums import ProblemType, RiskLevel, ActionType, PolicyDecision, CaseStatus
from app.schemas.customer import CustomerRead
from app.schemas.recommendation import RecommendationRead
from app.schemas.action import ActionRead
from app.schemas.approval import ApprovalRead
from app.schemas.audit import AuditLogRead

class RecoveryCaseBase(BaseModel):
    source_type: str
    source_id: str
    customer_id: str
    amount_at_risk: float
    problem_type: ProblemType
    recovery_score: int = 50
    risk_level: RiskLevel = RiskLevel.MEDIUM
    recommended_action: ActionType = ActionType.RETRY
    policy_decision: PolicyDecision = PolicyDecision.HUMAN
    status: CaseStatus = CaseStatus.OPEN
    retry_count: int = 0
    max_retries: int = 2

class RecoveryCaseRead(RecoveryCaseBase):
    id: str
    created_at: datetime
    updated_at: datetime
    customer: Optional[CustomerRead] = None
    latest_recommendation: Optional[RecommendationRead] = None

    model_config = ConfigDict(from_attributes=True)

class RecoveryCaseDetailRead(RecoveryCaseRead):
    recommendations: List[RecommendationRead] = []
    actions: List[ActionRead] = []
    approval_requests: List[ApprovalRead] = []
    audit_logs: List[AuditLogRead] = []

class DashboardMetrics(BaseModel):
    revenue_at_risk: float
    recoverable_revenue: float
    gross_recovered: float
    incremental_recovered: float
    recovery_rate: float
    auto_count: int
    human_count: int
    blocked_count: int
    stopped_count: int
    total_cases: int
    decision_distribution: List[dict]
    safety_actions_prevented: int
