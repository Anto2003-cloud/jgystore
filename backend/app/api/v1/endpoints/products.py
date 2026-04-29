from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
import random
from app.db.session import SessionLocal
from app.schemas.product import ProductCreate, ProductRead
from app.crud import product as crud_product
from app.services.pricing import PricingService
from app.services.currency import CurrencyService
from app.models.models import Product, ProductVariation

router = APIRouter()

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def inject_prices(product, db: Session):
    """Función auxiliar para inyectar precios dinámicos antes de responder al front."""
    try:
        current_rate = CurrencyService.get_rate(db, "USD")
        rate_value = float(current_rate) if current_rate else 486.20
    except:
        rate_value = 486.20

    total_cost = product.base_cost_usd + product.freight_cost_usd
    margin_div = (1 - product.target_margin) if product.target_margin < 1 else 0.65
    
    product.price_usd = round(total_cost / margin_div, 2)
    product.price_bs = round(product.price_usd * rate_value, 2)
    product.profit_usd = round(product.price_usd - total_cost, 2)
    return product

@router.post("/", response_model=ProductRead)
def create_new_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    try:
        # 1. Crear en DB
        new_product = crud_product.create_product(db, product_in)
        # 2. Inyectar cálculos necesarios para ProductRead
        return inject_prices(new_product, db)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear: {str(e)}")

@router.get("/", response_model=List[ProductRead])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Solo productos activos
    products = db.query(Product).filter(Product.is_active == True).offset(skip).limit(limit).all()
    # Inyectar precios a cada uno
    for p in products:
        inject_prices(p, db)
    return products

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    db_product.is_active = False
    db.commit()
    return {"message": "Producto desactivado correctamente"}

@router.put("/{product_id}", response_model=ProductRead)
def update_product(product_id: int, product_in: ProductCreate, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    try:
        db_product.name = product_in.name
        db_product.category = product_in.category
        db_product.description = product_in.description
        db_product.base_cost_usd = product_in.base_cost_usd
        db_product.freight_cost_usd = product_in.freight_cost_usd
        db_product.target_margin = product_in.target_margin

        # Borrar y recrear variaciones
        db.query(ProductVariation).filter(ProductVariation.product_id == product_id).delete()

        for var in product_in.variations:
            random_suffix = random.randint(1000, 9999)
            generated_sku = f"{product_in.name[:3].upper()}-{var.size}-{random_suffix}"
            
            new_var = ProductVariation(
                product_id=product_id,
                size=var.size,
                version=str(var.version).upper(), # Manejo robusto de strings/enums
                stock=var.stock,
                min_stock_alert=var.min_stock_alert,
                sku=generated_sku
            )
            db.add(new_var)

        db.commit()
        db.refresh(db_product)
        return inject_prices(db_product, db)

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar: {str(e)}")