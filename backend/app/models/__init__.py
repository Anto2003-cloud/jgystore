# backend/app/models/__init__.py
from .models import (
    Base, 
    User, 
    Product, 
    ProductVariation, 
    ExchangeRate, 
    Sale, 
    SaleItem, 
    FinanceTransaction,
    Order # <--- AGREGAR ESTO
)