# backend/app/crud/dashboard.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import Sale, SaleItem, Product, ProductVariation, ExchangeRate, FinanceTransaction

def get_dashboard_metrics(db: Session):
    try:
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
            {"product_name": row[0], "total_sold": row[1], "revenue_usd": float(row[2] or 0)} 
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
                "version": str(v.version), # QUITAMOS EL .value PORQUE AHORA ES STRING
                "current_stock": v.stock,
                "min_alert": v.min_stock_alert
            }
            for v in low_stock_raw
        ]

        # 3. Resumen Financiero (Utilidad Real)
        financials_raw = (
            db.query(
                func.sum(SaleItem.quantity * SaleItem.unit_price_usd),
                func.sum(SaleItem.quantity * SaleItem.unit_cost_at_sale)
            ).first()
        )
        
        rev = float(financials_raw[0] or 0.0)
        cost = float(financials_raw[1] or 0.0)
        gross_profit = rev - cost

        # Sumar GASTOS (Fletes, etc.)
        total_expenses = db.query(func.sum(FinanceTransaction.amount_usd)).filter(
            FinanceTransaction.type == "GASTO"
        ).scalar() or 0.0
        total_expenses = float(total_expenses)

        net_profit = gross_profit - total_expenses
        margin = (net_profit / rev * 100) if rev > 0 else 0.0

        # 4. Tasas (USD y EUR)
        usd_rate_obj = db.query(ExchangeRate).filter(ExchangeRate.currency == "USD").first()
        eur_rate_obj = db.query(ExchangeRate).filter(ExchangeRate.currency == "EUR").first()
        
        current_usd = float(usd_rate_obj.rate) if usd_rate_obj else 484.74 # Fallback
        current_eur = float(eur_rate_obj.rate) if eur_rate_obj else 520.00 # Fallback

        return {
            "best_sellers": best_sellers,
            "low_stock": low_stock,
            "financials": {
                "total_revenue_usd": round(rev, 2),
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
        print(f"ERROR EN DASHBOARD: {str(e)}")
        # Si falla, devolvemos un objeto mínimo para que el Front no se quede cargando
        return {
            "error": str(e),
            "best_sellers": [],
            "low_stock": [],
            "financials": {"total_revenue_usd": 0, "total_expenses_usd": 0, "net_profit_usd": 0, "margin_percentage": 0},
            "rate_used": 1.0
        }