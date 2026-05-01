from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.services.currency import CurrencyService
from app.crud import dashboard as crud_dashboard
from pydantic import BaseModel

router = APIRouter()

# Dependencia para conectar con la base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Esquema simple para el ajuste manual (opcional para el futuro)
class ManualRate(BaseModel):
    usd: float
    eur: float

# --- 1. ENDPOINT PARA REFRESCAR TASAS (SOLUCIONA EL ERROR 404) ---
@router.post("/refresh-rates")
async def refresh_rates(db: Session = Depends(get_db)):
    """
    Este endpoint es llamado por el botón del Sidebar.
    Intenta conectar al BCV y devuelve las tasas actualizadas.
    """
    try:
        print(">>> Solicitud manual de actualización de tasas recibida...")
        rates = await CurrencyService.sync_rates_db(db)
        
        if rates:
            return {
                "status": "success",
                "message": "Tasas sincronizadas exitosamente con el BCV",
                "rates": rates
            }
        else:
            # Si el scraper falla, devolvemos los últimos valores guardados
            usd = CurrencyService.get_rate(db, "USD")
            eur = CurrencyService.get_rate(db, "EUR")
            return {
                "status": "warning",
                "message": "El BCV no respondió. Usando última tasa conocida.",
                "rates": {"USD": usd, "EUR": eur}
            }
    except Exception as e:
        print(f"Error en refresh_rates endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- 2. ENDPOINT PARA AJUSTE MANUAL (POR SI EL BCV SE CAE MUCHO) ---
@router.post("/manual-rates")
async def set_manual_rates(data: ManualRate, db: Session = Depends(get_db)):
    """Permite al dueño de la empresa escribir el precio a mano."""
    try:
        from app.models.models import ExchangeRate
        from datetime import datetime
        
        # Limpiamos tasas anteriores
        db.query(ExchangeRate).delete()
        
        # Creamos los nuevos registros manuales
        new_usd = ExchangeRate(currency="USD", rate=data.usd, source="Manual", updated_at=datetime.utcnow())
        new_eur = ExchangeRate(currency="EUR", rate=data.eur, source="Manual", updated_at=datetime.utcnow())
        
        db.add(new_usd)
        db.add(new_eur)
        db.commit()
        
        return {"message": "Tasas ajustadas manualmente", "rates": {"USD": data.usd, "EUR": data.eur}}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# --- 3. ENDPOINT PRINCIPAL DEL DASHBOARD ---
@router.get("/")
def get_dashboard(db: Session = Depends(get_db)):
    """Devuelve todas las métricas financieras y de stock."""
    return crud_dashboard.get_dashboard_metrics(db)