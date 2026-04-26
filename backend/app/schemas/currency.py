from pydantic import BaseModel
from datetime import datetime
from enum import Enum

class CurrencySource(str, Enum):
    BCV = "BCV"
    P2P = "P2P"
    MANUAL = "Manual"

class ExchangeRateBase(BaseModel):
    source: CurrencySource
    rate: float

class ExchangeRateRead(ExchangeRateBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True # Permite leer modelos de SQLAlchemy