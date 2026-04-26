from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from app.services.currency import CurrencyService
from app.db.session import SessionLocal, engine
from app.models import Base
# --- IMPORTACIONES CORREGIDAS ---
from app.api.v1.endpoints import auth, products, sales, dashboard 

# Crear tablas al iniciar
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Jgystore API")

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://jgystore.vercel.app"  # Este es el importante
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REGISTRO DE RUTAS (ORDEN DEL ARQUITECTO) ---
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(sales.router, prefix="/api/v1/sales", tags=["Sales"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])

# --- LÓGICA DE ACTUALIZACIÓN DE MONEDA (BCV) ---
def update_currency_task():
    db = SessionLocal()
    try:
        print("Actualizando tasa BCV...")
        import asyncio
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        if loop.is_running():
            import threading
            def run_in_thread():
                new_loop = asyncio.new_event_loop()
                asyncio.set_event_loop(new_loop)
                rate = new_loop.run_until_complete(CurrencyService.get_bcv_rate_from_web())
                if rate:
                    CurrencyService.update_db_rate(db, rate)
                    print(f"Tasa actualizada: {rate} Bs.")
                new_loop.close()
            threading.Thread(target=run_in_thread).start()
        else:
            rate = loop.run_until_complete(CurrencyService.get_bcv_rate_from_web())
            if rate:
                CurrencyService.update_db_rate(db, rate)
                print(f"Tasa actualizada: {rate} Bs.")
    except Exception as e:
        print(f"Error en la tarea programada: {e}")
    finally:
        db.close()

@app.on_event("startup")
def startup_event():
    scheduler = BackgroundScheduler()
    # Se ejecuta cada hora
    scheduler.add_job(update_currency_task, 'interval', hours=1)
    scheduler.start()
    # Ejecución inicial inmediata
    update_currency_task()

@app.get("/")
def read_root():
    return {"message": "Jgystore API Online"}