from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, Table, JSON
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import enum
from passlib.context import CryptContext

Base = declarative_base()

# --- CAMBIO SEGÚN AI STUDIO ---
# Usamos pbkdf2_sha256 para evitar el error de los 72 bytes en Windows
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

class VersionEnum(enum.Enum):
    FAN = "FAN"
    PLAYER = "PLAYER"
    RETRO = "RETRO"
    NONE = "NONE"

class CurrencySource(enum.Enum):
    BCV = "BCV"
    P2P = "P2P"
    Manual = "Manual"

class ExchangeRate(Base):
    __tablename__ = "exchange_rates"
    id = Column(Integer, primary_key=True, index=True)
    source = Column(Enum(CurrencySource), default=CurrencySource.BCV)
    rate = Column(Float, nullable=False) # Valor en Bs.
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    contact = Column(String)

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String) # Futbol, NBA, etc.
    description = Column(String)
    
    # Costos base en USD
    base_cost_usd = Column(Float, default=0.0) 
    freight_cost_usd = Column(Float, default=0.0) # Costo de envío prorrateado
    
    # Margen deseado (ej: 0.40 para 40%)
    target_margin = Column(Float, default=0.35)
    
    variations = relationship("ProductVariation", back_populates="product", cascade="all, delete")

class ProductVariation(Base):
    __tablename__ = "product_variations"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    size = Column(String, nullable=False) # S, M, L, XL, XXL
    version = Column(Enum(VersionEnum), default=VersionEnum.FAN)
    sku = Column(String, unique=True, index=True)
    stock = Column(Integer, default=0)
    min_stock_alert = Column(Integer, default=3)
    
    product = relationship("Product", back_populates="variations")

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    phone = Column(String)
    email = Column(String, unique=True)

class Sale(Base):
    __tablename__ = "sales"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    total_usd = Column(Float, nullable=False)
    total_bs = Column(Float, nullable=False)
    exchange_rate_used = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    items = relationship("SaleItem", back_populates="sale")

class SaleItem(Base):
    __tablename__ = "sale_items"
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"))
    variation_id = Column(Integer, ForeignKey("product_variations.id"))
    quantity = Column(Integer, nullable=False)
    unit_price_usd = Column(Float, nullable=False)
    unit_cost_at_sale = Column(Float, nullable=False) 

    sale = relationship("Sale", back_populates="items")

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    amount_usd = Column(Float, nullable=False)
    category = Column(String) # Alquiler, publicidad, etc.
    date = Column(DateTime, default=datetime.utcnow)

# --- CLASE USUARIO FINAL ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(String, default="admin") # admin, seller

    @staticmethod
    def get_password_hash(password: str):
        """Genera el hash usando el nuevo algoritmo pbkdf2_sha256"""
        return pwd_context.hash(password)

    def verify_password(self, password: str):
        """Verifica la contraseña contra el hash almacenado"""
        return pwd_context.verify(password, self.hashed_password)