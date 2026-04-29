from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
from app.db.session import SessionLocal
from app.schemas.product import ProductCreate, ProductRead
from app.crud import product as crud_product
from app.services.pricing import PricingService
from app.services.currency import CurrencyService

# Respetando tu estructura de modelos
from app.models.models import Product, ProductVariation

router = APIRouter()

# Dependencia para obtener la DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=ProductRead)
def create_new_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    try:
        return crud_product.create_product(db, product_in)
    except Exception as e:
        # Esto hará que el error ya no sea "desconocido"
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
    
    # 2. Obtener la tasa de forma segura
    current_rate_obj = CurrencyService.get_latest_rate(db)
    
    if hasattr(current_rate_obj, 'rate'):
        rate_value = current_rate_obj.rate
    else:
        rate_value = current_rate_obj if isinstance(current_rate_obj, float) else 48.0 # Tasa base fallback 2026
    
    # 3. Calcular precios
    pricing = PricingService.calculate_prices(
        new_product.base_cost_usd, 
        new_product.freight_cost_usd, 
        new_product.target_margin, 
        rate_value
    )
    
    new_product.price_usd = pricing["price_usd"]
    new_product.price_bs = pricing["price_bs"]
    new_product.profit_usd = pricing["profit_usd"]
    
    return new_product

@router.get("/", response_model=List[ProductRead])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # --- CAMBIO SEGÚN EMPRESA: Solo productos activos ---
    products = db.query(Product).filter(Product.is_active == True).offset(skip).limit(limit).all()
    
    current_rate = CurrencyService.get_latest_rate(db)
    rate_value = current_rate.rate if hasattr(current_rate, 'rate') else current_rate

    for p in products:
        pricing = PricingService.calculate_prices(
            p.base_cost_usd, 
            p.freight_cost_usd, 
            p.target_margin, 
            rate_value
        )
        p.price_usd = pricing["price_usd"]
        p.price_bs = pricing["price_bs"]
        p.profit_usd = pricing["profit_usd"]
        
    return products

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # --- FIX BUG: BORRADO LÓGICO ---
    # En lugar de eliminar, desactivamos para mantener integridad con ventas pasadas
    db_product.is_active = False
    db.commit()
    return {"message": "Producto desactivado correctamente (Borrado Lógico)"}

@router.put("/{product_id}", response_model=ProductRead)
def update_product(product_id: int, product_in: ProductCreate, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    try:
        # 1. Actualizar campos base
        db_product.name = product_in.name
        db_product.category = product_in.category
        db_product.description = product_in.description
        db_product.base_cost_usd = product_in.base_cost_usd
        db_product.freight_cost_usd = product_in.freight_cost_usd
        db_product.target_margin = product_in.target_margin

        # 2. Reemplazo de variaciones
        db.query(ProductVariation).filter(ProductVariation.product_id == product_id).delete()

        for var in product_in.variations:
            generated_sku = f"{product_in.name[:3].upper()}-{var.size}-{var.version.value[:1]}-{str(uuid.uuid4())[:4]}"
            
            new_var = ProductVariation(
                product_id=product_id,
                size=var.size,
                version=var.version,
                stock=var.stock,
                min_stock_alert=var.min_stock_alert,
                sku=generated_sku
            )
            db.add(new_var)

        db.commit()
        db.refresh(db_product)

        # 3. Inyectar precios para el frontend
        current_rate = CurrencyService.get_latest_rate(db)
        rate_value = current_rate.rate if hasattr(current_rate, 'rate') else current_rate

        pricing = PricingService.calculate_prices(
            db_product.base_cost_usd, 
            db_product.freight_cost_usd, 
            db_product.target_margin, 
            rate_value
        )
        
        db_product.price_usd = pricing["price_usd"]
        db_product.price_bs = pricing["price_bs"]
        db_product.profit_usd = pricing["profit_usd"]

        return db_product

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar: {str(e)}")