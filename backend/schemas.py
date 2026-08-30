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