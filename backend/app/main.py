from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
import asyncio
import threading

from app.services.currency import CurrencyService
from app.db.session import SessionLocal, engine
from app.models.models import Base # Aseguramos la ruta a tus modelos

# --- IMPORTACIONES DE ENDPOINTS (INCLUYENDO FINANCE) ---
from app.api.v1.endpoints import auth, products, sales, dashboard, finance, orders, customers # <-- 

# Crear tablas al iniciar (Neon o SQLite)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Jgystore API - Gestión de Inventario y Finanzas")

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://jgystore.vercel.app" 
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REGISTRO DE RUTAS ---
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(sales.router, prefix="/api/v1/sales", tags=["Sales"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
# NUEVA RUTA DE FINANZAS REGISTRADA
app.include_router(finance.router, prefix="/api/v1/finance", tags=["Finance"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["Customers"]) # 
# --- LÓGICA DE ACTUALIZACIÓN DE MONEDA (BCV) ---
def update_currency_task():
    """Tarea programada para sincronizar USD y EUR cada hora."""
    db = SessionLocal()
    try:
        print("--- Iniciando sincronización de tasas BCV ---")
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        if loop.is_running():
            def run_in_thread():
                new_loop = asyncio.new_event_loop()
                asyncio.set_event_loop(new_loop)
                # Usamos el nuevo método que trae USD y EUR
                new_loop.run_until_complete(CurrencyService.sync_rates_db(db))
                new_loop.close()
            threading.Thread(target=run_in_thread).start()
        else:
            # Usamos el nuevo método que trae USD y EUR
            loop.run_until_complete(CurrencyService.sync_rates_db(db))
            
    except Exception as e:
        print(f"Error en la tarea programada: {e}")
    finally:
        db.close()

# Dentro de backend/app/main.py

@app.on_event("startup")
def startup_event():
    # Iniciamos el reloj de fondo
    scheduler = BackgroundScheduler()
    # Intentará actualizar cada 30 minutos mientras el servidor esté despierto
    scheduler.add_job(update_currency_task, 'interval', minutes=30)
    scheduler.start()
    
    # EJECUCIÓN INMEDIATA: 
    # Esto asegura que apenas Render "despierta" el servidor, 
    # las tasas se actualicen sin esperar al cron.
    print("Servidor despertando... Actualizando tasas inmediatamente.")
    update_currency_task()

@app.get("/")
def read_root():
    return {
        "message": "Jgystore API 2.0 Online",
        "status": "Ready",
        "features": ["Multi-currency", "Finance Management", "Soft Delete"]
    }