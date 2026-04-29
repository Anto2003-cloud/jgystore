from pydantic import BaseModel
from typing import List, Dict, Any

# Mantenemos estas clases para que la validación sea fuerte
class BestSeller(BaseModel):
    product_name: str
    total_sold: int
    revenue_usd: float

class LowStockAlert(BaseModel):
    product_name: str
    size: str
    version: str
    current_stock: int
    min_alert: int

class FinancialSummary(BaseModel):
    total_revenue_usd: float
    total_cost_usd: float      # Costo de las prendas (Inventario)
    total_expenses_usd: float  # <--- NUEVO: Fletes/Publicidad
    net_profit_usd: float      # Utilidad Neta Real
    margin_percentage: float

class DashboardData(BaseModel):
    best_sellers: List[BestSeller]
    low_stock: List[LowStockAlert]
    financials: FinancialSummary
    rates: Dict[str, float]    # <--- NUEVO: Diccionario para USD y EUR
    rate_used: float           # Mantenemos para compatibilidad con el frontend actual

    class Config:
        from_attributes = True