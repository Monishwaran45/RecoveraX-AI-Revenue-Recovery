from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base
from app.policy.enums import ApprovalStatus, ActionType

class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    case_id: Mapped[str] = mapped_column(String(64), ForeignKey("recovery_cases.id"), nullable=False)
    status: Mapped[ApprovalStatus] = mapped_column(SQLEnum(ApprovalStatus), default=ApprovalStatus.PENDING)
    ai_recommendation: Mapped[str] = mapped_column(String(512), nullable=False)
    human_decision: Mapped[Optional[str]] = mapped_column(String(64), nullable=True) # APPROVE, REJECT, MODIFY
    modified_action: Mapped[Optional[ActionType]] = mapped_column(SQLEnum(ActionType), nullable=True)
    modified_delay_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    reason: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    recovery_case: Mapped["RecoveryCase"] = relationship("RecoveryCase", back_populates="approval_requests")
