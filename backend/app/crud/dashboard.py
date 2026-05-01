from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import Sale, SaleItem, Product, ProductVariation, ExchangeRate, FinanceTransaction

def get_dashboard_metrics(db: Session):
    try:
        # 1. Buscar las tasas reales guardadas por el Scraper
        usd_rate_obj = db.query(ExchangeRate).filter(ExchangeRate.currency == "USD").order_by(ExchangeRate.updated_at.desc()).first()
        eur_rate_obj = db.query(ExchangeRate).filter(ExchangeRate.currency == "EUR").order_by(ExchangeRate.updated_at.desc()).first()
        
        # Si existen en DB las usamos, sino el valor de hoy
        current_usd = float(usd_rate_obj.rate) if usd_rate_obj else 489.55
        current_eur = float(eur_rate_obj.rate) if eur_rate_obj else 528.71

        # 2. Datos de Ventas y Costos
        financials_raw = db.query(
            func.sum(SaleItem.quantity * SaleItem.unit_price_usd),
            func.sum(SaleItem.quantity * SaleItem.unit_cost_at_sale)
        ).first()
        
        rev = float(financials_raw[0] or 0.0)
        cost = float(financials_raw[1] or 0.0)
        
        # 3. Gastos
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
        print(f"Error en Dashboard: {e}")
        return {
            "best_sellers": [], "low_stock": [],
            "financials": {"total_revenue_usd": 0, "total_cost_usd": 0, "total_expenses_usd": 0, "net_profit_usd": 0, "margin_percentage": 0},
            "rates": {"USD": 489.55, "EUR": 528.71}, 
            "rate_used": 489.55
        }