from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models import Sale, SaleItem, ProductVariation, Product
from app.schemas.sale import SaleCreate
from app.services.currency import CurrencyService
from app.services.pricing import PricingService

def create_sale(db: Session, sale_in: SaleCreate):
    # 1. Obtener la tasa actual para el registro histórico
    current_rate = CurrencyService.get_latest_rate(db)
    
    total_usd = 0.0
    total_bs = 0.0
    sale_items_to_create = []

    # 2. Procesar cada item de la venta
    for item in sale_in.items:
        # Buscar la variación y su producto asociado
        variation = db.query(ProductVariation).filter(ProductVariation.id == item.variation_id).first()
        if not variation:
            raise HTTPException(status_code=404, detail=f"Variación ID {item.variation_id} no encontrada")
        
        # Validar Stock
        if variation.stock < item.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Stock insuficiente para {variation.product.name} ({variation.size}). Disponible: {variation.stock}"
            )
        
        # Obtener precios y costos actuales del producto
        product = variation.product
        pricing = PricingService.calculate_prices(
            product.base_cost_usd,
            product.freight_cost_usd,
            product.target_margin,
            current_rate
        )

        # 3. Preparar el SaleItem (Snapshot de la utilidad real en ese momento)
        new_item = SaleItem(
            variation_id=variation.id,
            quantity=item.quantity,
            unit_price_usd=pricing["price_usd"],
            unit_cost_at_sale=pricing["cost_usd"] # Base + Flete
        )
        
        # Descontar Stock
        variation.stock -= item.quantity
        
        # Acumular totales
        total_usd += pricing["price_usd"] * item.quantity
        total_bs += pricing["price_bs"] * item.quantity
        sale_items_to_create.append(new_item)

    # 4. Crear la cabecera de la Venta
    db_sale = Sale(
        customer_id=sale_in.customer_id,
        total_usd=total_usd,
        total_bs=total_bs,
        exchange_rate_used=current_rate,
    )
    
    db.add(db_sale)
    db.flush() # Para obtener el ID de la venta

    # 5. Asociar items a la venta y guardar
    for item in sale_items_to_create:
        item.sale_id = db_sale.id
        db.add(item)

    try:
        db.commit()
        db.refresh(db_sale)
        return db_sale
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al procesar la venta: {str(e)}")

def get_sales(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Sale).order_by(Sale.created_at.desc()).offset(skip).limit(limit).all()