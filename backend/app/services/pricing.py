from sqlalchemy.orm import Session
from app.services.currency import CurrencyService

class PricingService:
    @staticmethod
    def calculate_prices(base_cost: float, freight: float, margin: float, current_rate: float):
        """
        Calcula el precio de venta protegiendo el margen.
        Fórmula: Precio = (Costo Total) / (1 - Margen)
        """
        total_cost_usd = base_cost + freight
        
        # Evitar división por cero
        if margin >= 1: margin = 0.99
            
        price_usd = total_cost_usd / (1 - margin)
        price_bs = price_usd * current_rate
        
        return {
            "cost_usd": round(total_cost_usd, 2),
            "price_usd": round(price_usd, 2),
            "price_bs": round(price_bs, 2),
            "profit_usd": round(price_usd - total_cost_usd, 2)
        }

    @staticmethod
    def get_product_price_summary(db: Session, product):
        """
        Calcula el resumen de precios actual para un producto basado en la tasa actual.
        """
        current_rate = CurrencyService.get_latest_rate(db)
        
        return PricingService.calculate_prices(
            base_cost=product.base_cost_usd,
            freight=product.freight_cost_usd,
            margin=product.target_margin,
            current_rate=current_rate
        )