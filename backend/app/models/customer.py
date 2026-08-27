from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Float, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    email: Mapped[str] = mapped_column(String(128), nullable=False)
    lifetime_value: Mapped[float] = mapped_column(Float, default=0.0)
    successful_payment_count: Mapped[int] = mapped_column(Integer, default=0)
    failed_payment_count: Mapped[int] = mapped_column(Integer, default=0)
    average_payment_delay_days: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    transactions: Mapped[List["Transaction"]] = relationship("Transaction", back_populates="customer")
    subscriptions: Mapped[List["Subscription"]] = relationship("Subscription", back_populates="customer")
    invoices: Mapped[List["Invoice"]] = relationship("Invoice", back_populates="customer")
    recovery_cases: Mapped[List["RecoveryCase"]] = relationship("RecoveryCase", back_populates="customer")
