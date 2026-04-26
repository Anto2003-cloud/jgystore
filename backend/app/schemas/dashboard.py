from pydantic import BaseModel
from typing import List

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
    total_cost_usd: float
    net_profit_usd: float
    margin_percentage: float

class DashboardData(BaseModel):
    best_sellers: List[BestSeller]
    low_stock: List[LowStockAlert]
    financials: FinancialSummary
    rate_used: float  # <--- ESTA ES LA PIEZA QUE ABRE EL GRIFO