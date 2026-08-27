from datetime import datetime
from typing import List
from sqlalchemy import String, Float, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class Experiment(Base):
    __tablename__ = "experiments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    case_count: Mapped[int] = mapped_column(Integer, default=0)
    revenue_at_risk: Mapped[float] = mapped_column(Float, default=0.0)
    baseline_recovered: Mapped[float] = mapped_column(Float, default=0.0)
    ai_recovered: Mapped[float] = mapped_column(Float, default=0.0)
    incremental_recovered: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    results: Mapped[List["ExperimentResult"]] = relationship("ExperimentResult", back_populates="experiment")
