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
    description="Ecosistema Digital para Gestión de Inventario y Finanzas Reales",
    version="2.0.0"
)

# 2. CONFIGURACIÓN DE SEGURIDAD (CORS)
# Permite que el Frontend en Vercel se comunique con el Backend en Render
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://jgystore.vercel.app" # Reemplaza con tu URL real si cambia
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. REGISTRO DE RUTAS (API ROUTERS)
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Autenticación"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Inventario"])
app.include_router(sales.router, prefix="/api/v1/sales", tags=["Punto de Venta"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Métricas y Dashboard"])
app.include_router(finance.router, prefix="/api/v1/finance", tags=["Gestión Financiera"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Módulo de Encargos"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["CRM Clientes"])

# 4. LÓGICA DE AUTOMATIZACIÓN DE TASAS (BCV)
def update_currency_task():
    """
    Tarea que sincroniza las tasas de Dólar y Euro usando DolarAPI.
    Se ejecuta en un hilo separado para no interferir con FastAPI.
    """
    db = SessionLocal()
    try:
        print(">>> [AUTOMATIZACIÓN] Iniciando sincronización con DolarAPI...")
        
        # Creamos un nuevo bucle de eventos para este hilo específico
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        # Ejecutamos la sincronización real
        loop.run_until_complete(CurrencyService.sync_rates_db(db))
        loop.close()
        
        print(">>> [AUTOMATIZACIÓN] Sincronización completada exitosamente.")
    except Exception as e:
        print(f">>> [ERROR] Fallo en la actualización automática de tasas: {e}")
    finally:
        db.close()

# 5. EVENTOS DE ARRANQUE DEL SERVIDOR (STARTUP)
@app.on_event("startup")
def startup_event():
    # A. Configuramos el Programador de Tareas (Scheduler)
    scheduler = BackgroundScheduler()
    # Se ejecutará cada 30 minutos automáticamente mientras el servidor esté vivo
    scheduler.add_job(update_currency_task, 'interval', minutes=30)
    scheduler.start()
    
    # B. EJECUCIÓN INMEDIATA (Keep-Alive Trigger)
    # Lanzamos la primera actualización en un hilo al encender el servidor.
    # Esto evita el 'Cold Start' y asegura tasas frescas desde el segundo 1.
    thread = threading.Thread(target=update_currency_task)
    thread.start()

# 6. ENDPOINT DE SALUD (HEALTH CHECK)
@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "Jgystore ERP",
        "environment": "Production",
        "message": "Bienvenido a la API de Jgystore. Los servicios están operativos."
    }

# 7. DOCUMENTACIÓN PERSONALIZADA
# Puedes acceder a /docs para ver el Swagger interactivo