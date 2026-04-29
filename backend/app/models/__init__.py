# backend/app/models/__init__.py

# Importamos solo las clases que existen en tu archivo models.py
from .models import (
    Base, 
    User, 
    Product, 
    ProductVariation, 
    ExchangeRate, 
    Sale, 
    SaleItem, 
    FinanceTransaction # <--- Este es el nuevo nombre para la gestión de dinero
)