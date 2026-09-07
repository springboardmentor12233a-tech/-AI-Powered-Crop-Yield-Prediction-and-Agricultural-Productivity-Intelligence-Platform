from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str

class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    full_name: str

    class Config:
        from_attributes = True

class CropPredictionInput(BaseModel):
    rainfall: float
    temperature: float
    pesticide: float
    area: float
from pydantic import BaseModel

class FieldCreate(BaseModel):
    name: str
    location: str
    area: float
    soil: str

class FieldResponse(FieldCreate):
    id: int
    owner_id: int

    class Config:
        from_attributes = True # (or orm_mode = True if using older Pydantic)