from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError # Importante para detectar duplicados
from app.db.session import SessionLocal
from app.models.models import Customer
from pydantic import BaseModel

router = APIRouter()

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

class CustomerCreate(BaseModel):
    full_name: str
    phone: str
    email: str = None

@router.post("/")
def create_customer(obj_in: CustomerCreate, db: Session = Depends(get_db)):
    try:
        # Convertimos todo a mayúsculas para mantener consistencia
        new_cust = Customer(
            full_name=obj_in.full_name.upper(),
            phone=obj_in.phone,
            email=obj_in.email.lower() if obj_in.email else None
        )
        db.add(new_cust)
        db.commit()
        db.refresh(new_cust)
        return new_cust
    except IntegrityError:
        db.rollback()
        # Este es el error que te está saliendo
        raise HTTPException(status_code=400, detail="Este correo electrónico ya está registrado en el sistema.")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.get("/")
def get_customers(db: Session = Depends(get_db)):
    # Traemos los clientes ordenados por nombre
    return db.query(Customer).order_by(Customer.full_name.asc()).all()