from sqlalchemy.orm import Session
from app.models.models import Product, ProductVariation
import random

def create_product(db: Session, product_in):
    try:
        # 1. Crear el producto base
        db_product = Product(
            name=product_in.name,
            category=product_in.category,
            description=product_in.description or "",
            base_cost_usd=float(product_in.base_cost_usd),
            freight_cost_usd=float(product_in.freight_cost_usd),
            target_margin=float(product_in.target_margin),
            is_active=True
        )
        db.add(db_product)
        db.flush() # Obtener el ID

        # 2. Crear variaciones
        for var in product_in.variations:
            # Generar SKU ultra-seguro (Nombre + Talla + Aleatorio)
            random_code = random.randint(1000, 9999)
            safe_sku = f"{product_in.name[:3].upper()}-{var.size}-{random_code}"
            
            db_var = ProductVariation(
                product_id=db_product.id,
                size=var.size,
                version=var.version,
                stock=int(var.stock),
                min_stock_alert=int(var.min_stock_alert or 2),
                sku=safe_sku
            )
            db.add(db_var)

        db.commit()
        db.refresh(db_product)
        return db_product
    except Exception as e:
        db.rollback()
        print(f"Error real en el CRUD: {str(e)}")
        raise e