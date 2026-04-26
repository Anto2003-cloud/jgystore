# backend/app/models/__init__.py

# Importamos todo de tu archivo models.py para que sea accesible fácilmente
from .models import (
    Base, 
    User, 
    Product, 
    ProductVariation, 
    ExchangeRate, 
    Sale, 
    SaleItem, 
    Expense, 
    Customer,
    VersionEnum,
    CurrencySource
)