from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class OrderBase(BaseModel):
    customer_name: str
    product_details: str
    amount_usd: float
    deposit_usd: float
    status: Optional[str] = "PEDIDO"

class OrderCreate(OrderBase):
    pass

class OrderRead(OrderBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True