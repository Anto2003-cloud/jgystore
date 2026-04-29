from sqlalchemy.orm import Session
from sqlalchemy import func
# Añadimos FinanceTransaction a los imports
from app.models.models import Sale, SaleItem, Product, ProductVariation, ExchangeRate, FinanceTransaction
from app.services.currency import CurrencyService

def get_dashboard_metrics(db: Session):
    # 1. Ranking de más vendidos (Mantenemos tu lógica exacta)
    best_sellers_raw = (
        db.query(
            Product.name,
            func.sum(SaleItem.quantity).label("total_sold"),
            func.sum(SaleItem.quantity * SaleItem.unit_price_usd).label("revenue")
        )
        .join(ProductVariation, SaleItem.variation_id == ProductVariation.id)
        .join(Product, ProductVariation.product_id == Product.id)
        .group_by(Product.id)
        .order_by(func.sum(SaleItem.quantity).desc())
        .limit(5)
        .all()
    )
    
    best_sellers = [
        {"product_name": row[0], "total_sold": row[1], "revenue_usd": row[2]} 
        for row in best_sellers_raw
    ]

    # 2. Alertas de Stock Bajo (Mantenemos tu lógica exacta)
    low_stock_raw = (
        db.query(ProductVariation)
        .join(Product)
        .filter(ProductVariation.stock <= ProductVariation.min_stock_alert)
        .all()
    )
    
    low_stock = [
        {
            "product_name": v.product.name,
            "size": v.size,
            "version": v.version.value,
            "current_stock": v.stock,
            "min_alert": v.min_stock_alert
        }
        for v in low_stock_raw
    ]

    # 3. Resumen Financiero con UTILIDAD REAL (Cambio del Arquitecto)
    financials_raw = (
        db.query(
            func.sum(SaleItem.quantity * SaleItem.unit_price_usd),
            func.sum(SaleItem.quantity * SaleItem.unit_cost_at_sale)
        ).first()
    )
    
    rev = financials_raw[0] or 0.0
    cost = financials_raw[1] or 0.0
    gross_profit = rev - cost

    # --- NUEVO: RESTAR GASTOS OPERATIVOS ---
    total_expenses = db.query(func.sum(FinanceTransaction.amount_usd)).filter(
        FinanceTransaction.type == "GASTO"
    ).scalar() or 0.0

    # Utilidad Neta Real
    net_profit = gross_profit - total_expenses
    margin = (net_profit / rev * 100) if rev > 0 else 0.0

    # 4. TASAS ACTUALES (USD y EUR)
    usd_rate_obj = db.query(ExchangeRate).filter(ExchangeRate.currency == "USD").first()
    eur_rate_obj = db.query(ExchangeRate).filter(ExchangeRate.currency == "EUR").first()
    
    current_usd = float(usd_rate_obj.rate) if usd_rate_obj else 1.0
    current_eur = float(eur_rate_obj.rate) if eur_rate_obj else 1.0

    return {
        "best_sellers": best_sellers,
        "low_stock": low_stock,
        "financials": {
            "total_revenue_usd": round(rev, 2),
            "total_cost_usd": round(cost, 2),
            "total_expenses_usd": round(total_expenses, 2), # Nuevo dato
            "net_profit_usd": round(net_profit, 2),
            "margin_percentage": round(margin, 2)
        },
        "rates": { # Enviamos ambas tasas
            "USD": current_usd,
            "EUR": current_eur
        },
        "rate_used": current_usd  # Mantenemos este por compatibilidad con tu esquema anterior
    }