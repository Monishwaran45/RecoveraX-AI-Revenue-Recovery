from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base
from app.policy.enums import ActionType

class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    case_id: Mapped[str] = mapped_column(String(64), ForeignKey("recovery_cases.id"), nullable=False)
    diagnosis: Mapped[str] = mapped_column(String(64), nullable=False)
    recovery_score: Mapped[int] = mapped_column(Integer, nullable=False)
    recommended_action: Mapped[ActionType] = mapped_column(SQLEnum(ActionType), nullable=False)
    delay_minutes: Mapped[int] = mapped_column(Integer, default=30)
    expected_recovery_value: Mapped[float] = mapped_column(Float, default=0.0)
    reason: Mapped[str] = mapped_column(String(512), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    recovery_case: Mapped["RecoveryCase"] = relationship("RecoveryCase", back_populates="recommendations")
