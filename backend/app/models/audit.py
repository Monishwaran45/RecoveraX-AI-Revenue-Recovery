from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base
from app.policy.enums import ActorType, AuditEventType

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    case_id: Mapped[str] = mapped_column(String(64), ForeignKey("recovery_cases.id"), nullable=False)
    event_type: Mapped[AuditEventType] = mapped_column(SQLEnum(AuditEventType), nullable=False)
    actor_type: Mapped[ActorType] = mapped_column(SQLEnum(ActorType), nullable=False)
    actor_id: Mapped[str] = mapped_column(String(64), default="SYSTEM")
    reason: Mapped[str] = mapped_column(String(512), nullable=False)
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    recovery_case: Mapped["RecoveryCase"] = relationship("RecoveryCase", back_populates="audit_logs")
