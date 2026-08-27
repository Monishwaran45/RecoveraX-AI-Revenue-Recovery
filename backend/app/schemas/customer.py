from datetime import datetime
from pydantic import BaseModel, ConfigDict

class CustomerBase(BaseModel):
    name: str
    email: str
    lifetime_value: float = 0.0
    successful_payment_count: int = 0
    failed_payment_count: int = 0
    average_payment_delay_days: float = 0.0

class CustomerRead(CustomerBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
