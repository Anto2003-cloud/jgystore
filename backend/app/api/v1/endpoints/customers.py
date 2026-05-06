from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.db.session import SessionLocal
from app.models.models import Customer
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

class CustomerCreate(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None

@router.post("/")
def create_customer(obj_in: CustomerCreate, db: Session = Depends(get_db)):
    try:
        # Si el email es una cadena vacía o solo espacios, lo convertimos en None
        clean_email = obj_in.email.strip().lower() if obj_in.email and obj_in.email.strip() else None
        
        new_cust = Customer(
            full_name=obj_in.full_name.strip(),
            phone=obj_in.phone.strip(),
            email=clean_email
        )
        db.add(new_cust)
        db.commit()
        db.refresh(new_cust)
        return new_cust
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="El correo o el teléfono ya están registrados.")

@router.get("/")
def get_customers(db: Session = Depends(get_db)):
    return db.query(Customer).all()

@router.delete("/{id}")
def delete_customer(id: int, db: Session = Depends(get_db)):
    db_cust = db.query(Customer).filter(Customer.id == id).first()
    if not db_cust:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    try:
        db.delete(db_cust)
        db.commit()
        return {"message": "Eliminado"}
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="No se puede eliminar: Este cliente tiene ventas o encargos asociados.")

@router.put("/{id}")
def update_customer(id: int, data: CustomerCreate, db: Session = Depends(get_db)):
    db_cust = db.query(Customer).filter(Customer.id == id).first()
    if not db_cust: raise HTTPException(status_code=404)
    
    # Actualización segura de campos
    db_cust.full_name = data.full_name
    db_cust.phone = data.phone
    db_cust.email = data.email.strip().lower() if data.email and data.email.strip() else None
    
    db.commit()
    return db_cust