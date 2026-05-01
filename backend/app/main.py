from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
import threading
import asyncio
from app.db.session import SessionLocal, engine
from app.models.models import Base
from app.services.currency import CurrencyService
from app.api.v1.endpoints import auth, products, sales, dashboard, finance, orders, customers

Base.metadata.create_all(bind=engine)
app = FastAPI(title="Jgystore ERP")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Inventory"])
app.include_router(sales.router, prefix="/api/v1/sales", tags=["Sales"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(finance.router, prefix="/api/v1/finance", tags=["Finance"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["CRM"])

def update_currency_task():
    db = SessionLocal()
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(CurrencyService.sync_rates_db(db))
        loop.close()
    except: pass
    finally: db.close()

@app.on_event("startup")
def startup_event():
    scheduler = BackgroundScheduler()
    scheduler.add_job(update_currency_task, 'interval', minutes=30)
    scheduler.start()
    # Ejecución inmediata en hilo separado
    threading.Thread(target=update_currency_task).start()

@app.get("/")
def read_root(): return {"status": "online"}