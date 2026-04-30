from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
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
    email: str

@router.post("/")
def create_customer(obj_in: CustomerCreate, db: Session = Depends(get_db)):
    new_cust = Customer(full_name=obj_in.full_name, phone=obj_in.phone, email=obj_in.email)
    db.add(new_cust)
    db.commit()
    db.refresh(new_cust)
    return new_cust

@router.get("/")
def get_customers(db: Session = Depends(get_db)):
    return db.query(Customer).all()

@router.delete("/{id}")
def delete_customer(id: int, db: Session = Depends(get_db)):
    db_cust = db.query(Customer).filter(Customer.id == id).first()
    if not db_cust: raise HTTPException(status_code=404, detail="No encontrado")
    db.delete(db_cust)
    db.commit()
    return {"message": "Cliente eliminado"}

@router.put("/{id}")
def update_customer(id: int, customer_in: CustomerCreate, db: Session = Depends(get_db)):
    db_cust = db.query(Customer).filter(Customer.id == id).first()
    if not db_cust: raise HTTPException(status_code=404, detail="No encontrado")
    db_cust.full_name = customer_in.full_name
    db_cust.phone = customer_in.phone
    db_cust.email = customer_in.email
    db.commit()
    return db_cust