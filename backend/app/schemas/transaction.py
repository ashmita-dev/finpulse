from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.risk import RiskAssessment


class TransactionCreate(BaseModel):
    user_id: int
    amount: Decimal = Field(gt=0)
    currency: str = Field(min_length=3, max_length=3)
    merchant: str = Field(min_length=1, max_length=255)
    category: str = Field(min_length=1, max_length=100)
    timestamp: datetime
    location: str | None = None
    device_id: str | None = None
    status: str = "completed"


class TransactionResponse(BaseModel):
    id: int
    user_id: int
    amount: Decimal
    currency: str
    merchant: str
    category: str
    timestamp: datetime
    location: str | None
    device_id: str | None
    status: str


class TransactionWithRiskResponse(TransactionResponse):
    risk: RiskAssessment