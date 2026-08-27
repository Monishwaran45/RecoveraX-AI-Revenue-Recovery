from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.policy.enums import TransactionStatus, PaymentState

class TransactionBase(BaseModel):
    customer_id: str
    amount: float
    currency: str = "INR"
    status: TransactionStatus = TransactionStatus.FAILED
    payment_method: str = "CARD"
    failure_reason: Optional[str] = None
    payment_state: PaymentState = PaymentState.CLEAR
    possible_customer_debit: bool = False
    fraud_signal: bool = False
    retry_count: int = 0

class TransactionRead(TransactionBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
