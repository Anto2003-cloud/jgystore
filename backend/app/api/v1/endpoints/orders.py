from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import SessionLocal
from app.models.models import Order
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# Esquema para validar lo que viene del Frontend
class OrderCreate(BaseModel):
    customer_name: str
    product_details: str
    amount_usd: float
    deposit_usd: float

@router.post("/")
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    new_order = Order(
        customer_name=order_in.customer_name,
        product_details=order_in.product_details,
        amount_usd=order_in.amount_usd,
        deposit_usd=order_in.deposit_usd,
        status="PEDIDO"
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order

@router.get("/")
def get_orders(db: Session = Depends(get_db)):
    return db.query(Order).order_by(Order.created_at.desc()).all()

@router.put("/{order_id}/status")
def update_order_status(order_id: int, status: str, db: Session = Depends(get_db)):
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    db_order.status = status
    db.commit()
    return db_order