from pydantic import BaseModel
from typing import List, Optional  # <--- Asegúrate de que diga esto
from datetime import datetime

class SaleItemBase(BaseModel):
    variation_id: int
    quantity: int

class SaleItemCreate(SaleItemBase):
    pass

class SaleItemRead(SaleItemBase):
    id: int
    unit_price_usd: float
    unit_cost_at_sale: float # Para auditoría de utilidad

    class Config:
        from_attributes = True

class SaleCreate(BaseModel):
    customer_id: Optional[int] = None
    items: List[SaleItemCreate]

class SaleRead(BaseModel):
    id: int
    total_usd: float
    total_bs: float
    exchange_rate_used: float
    created_at: datetime
    items: List[SaleItemRead]

    class Config:
        from_attributes = True