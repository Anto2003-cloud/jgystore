from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import SessionLocal
from app.models.models import FinanceTransaction # Importe preciso
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# Dependencia para la base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ESQUEMAS (Pydantic) ---
class TransactionCreate(BaseModel):
    type: str  # "INVERSION" o "GASTO"
    category: str # "Publicidad", "Flete", "Inversion inicial", "Empaques"
    amount_usd: float
    description: str

# --- RUTAS ---

@router.post("/", status_code=201)
def create_transaction(data: TransactionCreate, db: Session = Depends(get_db)):
    """
    Registra una entrada (Inversión) o salida (Gasto) de dinero.
    Cumple con el requerimiento de gestión financiera de la empresa.
    """
    try:
        new_tx = FinanceTransaction(
            type=data.type.upper(), # Lo guardamos en mayúsculas para consistencia
            category=data.category,
            amount_usd=data.amount_usd,
            description=data.description,
            date=datetime.utcnow()
        )
        db.add(new_tx)
        db.commit()
        db.refresh(new_tx)
        return {"message": "Transacción registrada exitosamente", "id": new_tx.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al registrar: {str(e)}")

@router.get("/")
def get_transactions(db: Session = Depends(get_db), limit: int = 100):
    """
    Obtiene el historial financiero ordenado por fecha (lo más reciente primero).
    """
    transactions = db.query(FinanceTransaction)\
                     .order_by(FinanceTransaction.date.desc())\
                     .limit(limit)\
                     .all()
    return transactions

@router.get("/summary")
def get_finance_summary(db: Session = Depends(get_db)):
    """
    Endpoint extra para tu tesis: Calcula el balance total.
    """
    txs = db.query(FinanceTransaction).all()
    total_inversion = sum(t.amount_usd for t in txs if t.type == "INVERSION")
    total_gastos = sum(t.amount_usd for t in txs if t.type == "GASTO")
    
    return {
        "balance_usd": total_inversion - total_gastos,
        "total_inversion": total_inversion,
        "total_gastos": total_gastos
    }