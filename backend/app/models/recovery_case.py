from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Float, Integer, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base
from app.policy.enums import ProblemType, RiskLevel, ActionType, PolicyDecision, CaseStatus

class RecoveryCase(Base):
    __tablename__ = "recovery_cases"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    source_type: Mapped[str] = mapped_column(String(32), default="TRANSACTION") # TRANSACTION, SUBSCRIPTION, INVOICE
    source_id: Mapped[str] = mapped_column(String(64), nullable=False)
    customer_id: Mapped[str] = mapped_column(String(64), ForeignKey("customers.id"), nullable=False)
    amount_at_risk: Mapped[float] = mapped_column(Float, nullable=False)
    problem_type: Mapped[ProblemType] = mapped_column(SQLEnum(ProblemType), nullable=False)
    recovery_score: Mapped[int] = mapped_column(Integer, default=50)
    risk_level: Mapped[RiskLevel] = mapped_column(SQLEnum(RiskLevel), default=RiskLevel.MEDIUM)
    recommended_action: Mapped[ActionType] = mapped_column(SQLEnum(ActionType), default=ActionType.RETRY)
    policy_decision: Mapped[PolicyDecision] = mapped_column(SQLEnum(PolicyDecision), default=PolicyDecision.HUMAN)
    status: Mapped[CaseStatus] = mapped_column(SQLEnum(CaseStatus), default=CaseStatus.OPEN)
    verification_result: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, default="NONE")
    amount_recovered: Mapped[float] = mapped_column(Float, default=0.0)
    approval_status: Mapped[Optional[str]] = mapped_column(String(32), nullable=True, default="NOT_REQUIRED")
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    max_retries: Mapped[int] = mapped_column(Integer, default=2)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer: Mapped["Customer"] = relationship("Customer", back_populates="recovery_cases")
    recommendations: Mapped[List["Recommendation"]] = relationship("Recommendation", back_populates="recovery_case")
    actions: Mapped[List["ActionModel"]] = relationship("ActionModel", back_populates="recovery_case")
    approval_requests: Mapped[List["ApprovalRequest"]] = relationship("ApprovalRequest", back_populates="recovery_case")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="recovery_case")
