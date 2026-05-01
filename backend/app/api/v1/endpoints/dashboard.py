from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.services.currency import CurrencyService
from app.crud import dashboard as crud_dashboard

router = APIRouter()

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@router.post("/refresh-rates")
async def refresh_rates(db: Session = Depends(get_db)):
    try:
        rates = await CurrencyService.sync_rates_db(db)
        return {"status": "success", "rates": rates}
    except:
        return {"status": "error", "message": "BCV no disponible"}

@router.get("/")
async def get_dashboard(db: Session = Depends(get_db)):
    return crud_dashboard.get_dashboard_metrics(db)