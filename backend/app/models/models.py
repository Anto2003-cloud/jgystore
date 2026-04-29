from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, JSON, Boolean
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import enum
from passlib.context import CryptContext

# Usamos la base que ya tenías definida
Base = declarative_base()

# --- SEGURIDAD ---
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# --- ENUMS ---
class VersionEnum(enum.Enum):
    FAN = "FAN"
    PLAYER = "PLAYER"
    RETRO = "RETRO"
    NONE = "NONE"

class CurrencySource(enum.Enum):
    BCV = "BCV"
    P2P = "P2P"
    Manual = "Manual"

# --- MODELOS ---

class ExchangeRate(Base):
    __tablename__ = "exchange_rates"
    id = Column(Integer, primary_key=True, index=True)
    source = Column(Enum(CurrencySource), default=CurrencySource.BCV)
    currency = Column(String, default="USD") # "USD" o "EUR"
    rate = Column(Float, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String) 
    description = Column(String)
    base_cost_usd = Column(Float, default=0.0) 
    freight_cost_usd = Column(Float, default=0.0) 
    target_margin = Column(Float, default=0.35)
    is_active = Column(Boolean, default=True) # FIX BUG ELIMINAR

    variations = relationship("ProductVariation", back_populates="product", cascade="all, delete-orphan")

class ProductVariation(Base):
    __tablename__ = "product_variations"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"))
    size = Column(String, nullable=False)
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
    points = Column(Integer, default=0)
    preferences = Column(JSON)

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

# --- REEMPLAZO DE EXPENSE POR FINANCETRANSACTION ---
class FinanceTransaction(Base):
    __tablename__ = "finance_transactions"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String) # "INVERSION" o "GASTO"
    category = Column(String) # "Publicidad", "Flete", etc.
    amount_usd = Column(Float, nullable=False)
    description = Column(String)
    date = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(String, default="admin")

    @staticmethod
    def get_password_hash(password: str):
        return pwd_context.hash(password)

    def verify_password(self, password: str):
        return pwd_context.verify(password, self.hashed_password)