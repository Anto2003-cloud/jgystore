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