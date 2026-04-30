from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
import threading
import asyncio

from app.services.currency import CurrencyService
from app.db.session import SessionLocal, engine
from app.models.models import Base
from app.api.v1.endpoints import auth, products, sales, dashboard, finance, orders, customers

# Crear tablas al iniciar
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Jgystore API 2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permitimos todo para asegurar conexión inicial
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de rutas
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(sales.router, prefix="/api/v1/sales", tags=["Sales"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(finance.router, prefix="/api/v1/finance", tags=["Finance"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["Customers"])

def update_currency_task():
    """Ejecuta el scraper en un hilo separado para no romper el servidor."""
    db = SessionLocal()
    try:
        print("Iniciando actualizacion de tasas...")
        new_loop = asyncio.new_event_loop()
        asyncio.set_event_loop(new_loop)
        new_loop.run_until_complete(CurrencyService.sync_rates_db(db))
        new_loop.close()
        print("Tasas sincronizadas con exito.")
    except Exception as e:
        print(f"Error en tarea de moneda: {e}")
    finally:
        db.close()

@app.on_event("startup")
def startup_event():
    # 1. Iniciamos el programador de tareas
    scheduler = BackgroundScheduler()
    scheduler.add_job(update_currency_task, 'interval', minutes=30)
    scheduler.start()
    
    # 2. LANZAR EN HILO SEPARADO: 
    # Esto permite que el servidor termine de encender (bind port) 
    # mientras el scraper trabaja en segundo plano.
    thread = threading.Thread(target=update_currency_task)
    thread.start()

@app.get("/")
def read_root():
    return {"message": "Jgystore API Online"}