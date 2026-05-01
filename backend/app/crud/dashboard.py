# backend/app/crud/dashboard.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import Sale, SaleItem, Product, ProductVariation, ExchangeRate, FinanceTransaction
from app.services.currency import CurrencyService

def get_dashboard_metrics(db: Session):
    try:
        # 1. Obtener tasas REALES del motor de Amazon
        current_usd = CurrencyService.get_rate(db, "USD")
        current_eur = CurrencyService.get_rate(db, "EUR")

        # 2. Cálculos financieros básicos
        financials_raw = db.query(
            func.sum(SaleItem.quantity * SaleItem.unit_price_usd),
            func.sum(SaleItem.quantity * SaleItem.unit_cost_at_sale)
        ).first()
        
        rev = float(financials_raw[0] or 0.0)
        cost = float(financials_raw[1] or 0.0)
        
        total_expenses = db.query(func.sum(FinanceTransaction.amount_usd)).filter(
            FinanceTransaction.type == "GASTO"
        ).scalar() or 0.0

        net_profit = (rev - cost) - float(total_expenses)
        margin = (net_profit / rev * 100) if rev > 0 else 0.0

        return {
            "best_sellers": [], 
            "low_stock": [],
            "financials": {
                "total_revenue_usd": round(rev, 2),
                "total_cost_usd": round(cost, 2),
                "total_expenses_usd": round(float(total_expenses), 2),
                "net_profit_usd": round(net_profit, 2),
                "margin_percentage": round(margin, 2)
            },
            "rates": {
                "USD": current_usd,
                "EUR": current_eur
            },
            "rate_used": current_usd
        }
    except Exception as e:
        print(f"Error Crítico Dashboard: {e}")
        return {
            "best_sellers": [], "low_stock": [],
            "financials": {"total_revenue_usd": 0, "total_cost_usd": 0, "total_expenses_usd": 0, "net_profit_usd": 0, "margin_percentage": 0},
            "rates": {"USD": 1.0, "EUR": 1.0}, 
            "rate_used": 1.0
        }