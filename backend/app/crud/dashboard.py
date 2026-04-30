# backend/app/crud/dashboard.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import Sale, SaleItem, Product, ProductVariation, ExchangeRate, FinanceTransaction

def get_dashboard_metrics(db: Session):
    try:
        # 1. Datos de Ventas y Costo de Inventario
        financials_raw = db.query(
            func.sum(SaleItem.quantity * SaleItem.unit_price_usd), 
            func.sum(SaleItem.quantity * SaleItem.unit_cost_at_sale)
        ).first()
        
        revenue = float(financials_raw[0] or 0.0)
        inventory_cost = float(financials_raw[1] or 0.0)
        gross_profit = revenue - inventory_cost

        # 2. Gastos Operativos (Fletes, publicidad, etc.)
        total_expenses = db.query(func.sum(FinanceTransaction.amount_usd)).filter(
            FinanceTransaction.type == "GASTO"
        ).scalar() or 0.0
        total_expenses = float(total_expenses)

        # 3. UTILIDAD NETA REAL
        net_profit = gross_profit - total_expenses
        margin = (net_profit / revenue * 100) if revenue > 0 else 0.0

        # 4. TASAS CON PUNTERO DE PRECISIÓN (Siempre la más reciente)
        usd_rate_obj = db.query(ExchangeRate).filter(
            ExchangeRate.currency == "USD"
        ).order_by(ExchangeRate.updated_at.desc()).first()

        eur_rate_obj = db.query(ExchangeRate).filter(
            ExchangeRate.currency == "EUR"
        ).order_by(ExchangeRate.updated_at.desc()).first()
        
        # Fallbacks dinámicos por si Neon está vacío
        current_usd = float(usd_rate_obj.rate) if usd_rate_obj else 486.20
        current_eur = float(eur_rate_obj.rate) if eur_rate_obj else 525.09

        return {
            "best_sellers": [], 
            "low_stock": [],
            "financials": {
                "total_revenue_usd": round(revenue, 2),
                "total_cost_usd": round(inventory_cost, 2),
                "total_expenses_usd": round(total_expenses, 2),
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
            "rates": {"USD": 486.20, "EUR": 525.09}, "rate_used": 486.20
        }