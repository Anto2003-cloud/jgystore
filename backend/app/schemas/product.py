from pydantic import BaseModel, Field
from typing import List, Optional

# --- VARIACIONES (Simplificadas) ---
class VariationBase(BaseModel):
    size: str
    version: str  # Ahora es un string simple, más flexible
    stock: int = 0
    min_stock_alert: int = 2

class VariationCreate(VariationBase):
    pass

class VariationRead(VariationBase):
    id: int
    sku: Optional[str] = None
    
    class Config:
        from_attributes = True

# --- PRODUCTOS ---
class ProductBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = ""
    base_cost_usd: float
    freight_cost_usd: float
    target_margin: float
    is_active: Optional[bool] = True

class ProductCreate(ProductBase):
    variations: List[VariationCreate]

class ProductRead(ProductBase):
    id: int
    variations: List[VariationRead]
    # Campos calculados para el frontend
    price_usd: float = 0.0
    price_bs: float = 0.0
    profit_usd: float = 0.0

    class Config:
        from_attributes = True