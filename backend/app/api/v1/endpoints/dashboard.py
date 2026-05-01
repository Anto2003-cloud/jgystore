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

# --- 1. ENDPOINT DE RESCATE (AUTOMÁTICO) ---
@router.post("/refresh-rates")
async def refresh_rates(db: Session = Depends(get_db)):
    """
    Este es el comando de 'Fuerza Bruta'. 
    Si el Frontend ve que las tasas están en 0, llama aquí.
    El Backend probará las 3 fuentes (Amazon, GitHub, Global) hasta obtener la real.
    """
    try:
        print(">>> [RESCATE] Iniciando búsqueda de tasas en fuentes redundantes...")
        rates = await CurrencyService.sync_rates_db(db)
        
        if rates:
            return {
                "status": "success",
                "message": "Tasas actualizadas desde fuentes en tiempo real",
                "rates": rates
            }
        else:
            raise HTTPException(
                status_code=503, 
                detail="No se pudo conectar con ninguna fuente oficial en este momento."
            )
    except Exception as e:
        print(f"Error en refresh_rates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- 2. ENDPOINT PRINCIPAL (EL QUE USA EL INITIALIZER) ---
@router.get("/")
async def get_dashboard(db: Session = Depends(get_db)):
    """
    Devuelve el Dashboard completo. 
    Incluye el objeto 'rates' con los valores REALES de la base de datos.
    """
    # Llamamos al CRUD que ya configuramos para que no use valores manuales
    return crud_dashboard.get_dashboard_metrics(db)

# --- 3. CONSULTA RÁPIDA DE TASAS ---
@router.get("/rates")
def get_only_rates(db: Session = Depends(get_db)):
    """Devuelve solo las tasas actuales de la DB."""
    usd = CurrencyService.get_rate(db, "USD")
    eur = CurrencyService.get_rate(db, "EUR")
    return {
        "USD": usd,
        "EUR": eur,
        "last_sync": "Real-time"
    }