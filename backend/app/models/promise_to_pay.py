from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

if TYPE_CHECKING:
    from app.models.recovery_case import RecoveryCase

class PromiseToPay(Base):
    __tablename__ = "promise_to_pay"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    case_id: Mapped[str] = mapped_column(String(64), ForeignKey("recovery_cases.id"), nullable=False)
    promised_amount: Mapped[float] = mapped_column(Float, nullable=False)
    promised_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="PROMISED") # PROMISED, P2P_KEPT, P2P_BROKEN, EXPIRED
    notes: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    recovery_case: Mapped["RecoveryCase"] = relationship("RecoveryCase", back_populates="promises")
