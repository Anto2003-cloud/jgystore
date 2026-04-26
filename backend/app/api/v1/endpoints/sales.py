from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.session import SessionLocal
from app.schemas.sale import SaleCreate, SaleRead
from app.crud import sale as crud_sale

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=SaleRead)
def register_sale(sale_in: SaleCreate, db: Session = Depends(get_db)):
    return crud_sale.create_sale(db, sale_in)

@router.get("/", response_model=List[SaleRead])
def read_sales(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_sale.get_sales(db, skip=skip, limit=limit)