from pydantic import BaseModel
from typing import Optional

class CustomerBase(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerRead(CustomerBase):
    id: int
    points: int = 0
    
    class Config:
        from_attributes = True