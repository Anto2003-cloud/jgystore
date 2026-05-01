from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
import threading
import asyncio

# Importaciones de configuración de Base de Datos
from app.db.session import SessionLocal, engine
from app.models.models import Base

# Importación del Servicio de Moneda (DolarAPI)
from app.services.currency import CurrencyService

# Importación de todos los Endpoints registrados
from app.api.v1.endpoints import (
    auth, 
    products, 
    sales, 
    dashboard, 
    finance, 
    orders, 
    customers
)

# 1. ORQUESTACIÓN DE BASE DE DATOS
# Crea las tablas en Neon (Postgres) o SQLite si no existen al arrancar
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Jgystore API v2.0",
    description="Ecosistema Digital Autónomo con Sincronización BCV en Tiempo Real",
    version="2.0.0"
)

# 2. CONFIGURACIÓN DE SEGURIDAD (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permitir acceso desde Vercel y Local
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. REGISTRO DE RUTAS (API ROUTERS)
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Autenticación"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Inventario"])
app.include_router(sales.router, prefix="/api/v1/sales", tags=["Punto de Venta"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(finance.router, prefix="/api/v1/finance", tags=["Finanzas"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Encargos"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["CRM"])

# 4. LÓGICA DE ACTUALIZACIÓN AUTOMÁTICA
def update_currency_task():
    """
    Tarea que sincroniza las tasas usando DolarAPI (Mirror del BCV).
    Se ejecuta en un hilo separado para no bloquear a FastAPI en Render.
    """
    db = SessionLocal()
    try:
        print(">>> [AUTO-SYNC] Contactando con DolarAPI para tasas reales...")
        
        # Creamos un bucle de eventos nuevo para este hilo
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        # Ejecutamos la sincronización real (USD y EUR)
        loop.run_until_complete(CurrencyService.sync_rates_db(db))
        loop.close()
        
        print(">>> [AUTO-SYNC] Tasas actualizadas exitosamente en Neon.")
    except Exception as e:
        print(f">>> [AUTO-SYNC ERROR] Fallo en la actualización: {e}")
    finally:
        db.close()

# 5. EVENTOS DE ARRANQUE (STARTUP)
@app.on_event("startup")
def startup_event():
    # A. Programamos la tarea para que corra cada 30 minutos mientras el servidor esté encendido
    scheduler = BackgroundScheduler()
    scheduler.add_job(update_currency_task, 'interval', minutes=30)
    scheduler.start()
    
    # B. DISPARO INMEDIATO AL DESPERTAR:
    # Esto asegura que apenas Render 'despierta' el servidor, las tasas 
    # se sincronicen sin esperar los 30 min del scheduler.
    thread = threading.Thread(target=update_currency_task)
    thread.start()

@app.get("/")
def read_root():
    return {"status": "online", "message": "Jgystore API en tiempo real lista."}