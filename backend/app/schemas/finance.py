from pydantic import BaseModel
from datetime import datetime

class ExpenseCreate(BaseModel):
    description: str
    amount_usd: float
    category: str

class ExpenseRead(ExpenseCreate):
    id: int
    date: datetime

    class Config:
        from_attributes = True

class CustomerCreate(BaseModel):
    full_name: str
    phone: str
    email: str

class CustomerRead(CustomerCreate):
    id: int

    class Config:
        from_attributes = True