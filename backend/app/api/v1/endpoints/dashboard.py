from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.schemas.dashboard import DashboardData
from app.crud import dashboard as crud_dashboard

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=DashboardData)
def get_dashboard(db: Session = Depends(get_db)):
    return crud_dashboard.get_dashboard_metrics(db)