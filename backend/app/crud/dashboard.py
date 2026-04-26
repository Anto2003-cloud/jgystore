from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Sale, SaleItem, Product, ProductVariation, ExchangeRate # Asegúrate de importar ExchangeRate
from app.services.currency import CurrencyService

def get_dashboard_metrics(db: Session):
    # 1. Ranking de más vendidos
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

    # 2. Alertas de Stock Bajo
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

    # 3. Resumen Financiero
    financials_raw = (
        db.query(
            func.sum(SaleItem.quantity * SaleItem.unit_price_usd),
            func.sum(SaleItem.quantity * SaleItem.unit_cost_at_sale)
        ).first()
    )
    
    rev = financials_raw[0] or 0.0
    cost = financials_raw[1] or 0.0
    profit = rev - cost
    margin = (profit / rev * 100) if rev > 0 else 0.0

    # --- EL CAMBIO DEL ARQUITECTO AQUÍ ---
    # Buscamos la tasa directamente para asegurar que sea un número flotante
    # Buscamos la última tasa (last_rate_obj)
    last_rate_obj = db.query(ExchangeRate).order_by(ExchangeRate.updated_at.desc()).first()
    
    # Extraemos solo el número. Si no hay nada, ponemos 1.0 de respaldo
    current_rate = float(last_rate_obj.rate) if last_rate_obj else 1.0

    return {
        "best_sellers": best_sellers,
        "low_stock": low_stock,
        "financials": {
            "total_revenue_usd": round(rev, 2),
            "total_cost_usd": round(cost, 2),
            "net_profit_usd": round(profit, 2),
            "margin_percentage": round(margin, 2)
        },
        "rate_used": current_rate  # <--- Este nombre debe ser igual al del Esquema
    }