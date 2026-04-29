from sqlalchemy.orm import Session
from app.models import Product, ProductVariation
from app.schemas.product import ProductCreate
import uuid
def create_product(db: Session, product_in: ProductCreate):
    db_product = Product(
        name=product_in.name,
        category=product_in.category,
        description=product_in.description,
        base_cost_usd=product_in.base_cost_usd,
        freight_cost_usd=product_in.freight_cost_usd,
        target_margin=product_in.target_margin,
        is_active=True # Forzamos que sea True al crear
    )
    db.add(db_product)
    db.flush()
    # ... resto de la lógica de variaciones ...
    db.commit()
    db.refresh(db_product)
    return db_product

    # 2. Crear las variaciones (tallas/versiones)
    for var in product_in.variations:
        # Generamos un SKU simple automáticamente si no viene uno
        generated_sku = f"{product_in.name[:3].upper()}-{var.size}-{var.version.value[:1]}-{str(uuid.uuid4())[:4]}"
        
        db_variation = ProductVariation(
            product_id=db_product.id,
            size=var.size,
            version=var.version,
            stock=var.stock,
            min_stock_alert=var.min_stock_alert,
            sku=generated_sku
        )
        db.add(db_variation)
    
    db.commit()
    db.refresh(db_product)
    return db_product

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Product).offset(skip).limit(limit).all()

def get_product_by_id(db: Session, product_id: int):
    return db.query(Product).filter(Product.id == product_id).first()