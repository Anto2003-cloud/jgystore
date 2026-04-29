from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class VersionEnum(str, Enum):
    FAN = "FAN"
    PLAYER = "PLAYER"
    RETRO = "RETRO"
    NONE = "NONE"

# --- VARIACIONES ---
class VariationBase(BaseModel):
    size: str = Field(..., example="L")
    version: VersionEnum = VersionEnum.FAN
    stock: int = Field(default=0, ge=0)
    min_stock_alert: int = Field(default=3)

class VariationCreate(VariationBase):
    pass

class VariationRead(VariationBase):
    id: int
    sku: Optional[str]
    
    class Config:
        from_attributes = True

# --- PRODUCTOS ---
class ProductBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    base_cost_usd: float
    freight_cost_usd: float
    target_margin: float
    is_active: Optional[bool] = True # <--- Asegúrate de que tenga el default True aquí

class ProductCreate(ProductBase):
    variations: List[VariationCreate] # Al crear un producto, enviamos sus tallas iniciales

class ProductRead(ProductBase):
    id: int
    variations: List[VariationRead]
    # Campos calculados que enviaremos al Frontend
    price_usd: float 
    price_bs: float
    profit_usd: float

    class Config:
        from_attributes = True