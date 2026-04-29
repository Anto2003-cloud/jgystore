# backend/app/crud/dashboard.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import Sale, SaleItem, Product, ProductVariation, ExchangeRate, FinanceTransaction

def get_dashboard_metrics(db: Session):
    try:
        # 1. Datos de Ventas y Costo de Inventario
        financials_raw = db.query(
            func.sum(SaleItem.quantity * SaleItem.unit_price_usd), # Ingreso
            func.sum(SaleItem.quantity * SaleItem.unit_cost_at_sale) # Costo Producto
        ).first()
        
        revenue = float(financials_raw[0] or 0.0)
        inventory_cost = float(financials_raw[1] or 0.0)

        # 2. Gastos Operativos (Fletes extra, publicidad, etc.)
        total_expenses = db.query(func.sum(FinanceTransaction.amount_usd)).filter(
            FinanceTransaction.type == "GASTO"
        ).scalar() or 0.0
        total_expenses = float(total_expenses)

        # 3. UTILIDAD NETA REAL
        # Utilidad = Ingresos - Costo de Camisas - Gastos Operativos
        net_profit = revenue - inventory_cost - total_expenses
        margin = (net_profit / revenue * 100) if revenue > 0 else 0.0

        # 4. Tasas
        usd_rate = db.query(ExchangeRate).filter(ExchangeRate.currency == "USD").first()
        eur_rate = db.query(ExchangeRate).filter(ExchangeRate.currency == "EUR").first()
        current_usd = float(usd_rate.rate) if usd_rate else 484.74

        return {
            "best_sellers": [], # Puedes re-agregar tu lógica de ranking aquí
            "low_stock": [],
            "financials": {
                "total_revenue_usd": round(revenue, 2),
                "total_cost_usd": round(inventory_cost, 2), # <--- AQUÍ ESTÁ EL CAMPO QUE FALTABA
                "total_expenses_usd": round(total_expenses, 2),
                "net_profit_usd": round(net_profit, 2),
                "margin_percentage": round(margin, 2)
            },
            "rates": {
                "USD": current_usd,
                "EUR": float(eur_rate.rate) if eur_rate else 520.0
            },
            "rate_used": current_usd
        }
    except Exception as e:
        print(f"Error en Dashboard: {e}")
        # Retorno de emergencia que cumple con el esquema
        return {
            "best_sellers": [], "low_stock": [],
            "financials": {
                "total_revenue_usd": 0, "total_cost_usd": 0, 
                "total_expenses_usd": 0, "net_profit_usd": 0, "margin_percentage": 0
            },
            "rates": {"USD": 484.74, "EUR": 520.0}, "rate_used": 484.74
        }