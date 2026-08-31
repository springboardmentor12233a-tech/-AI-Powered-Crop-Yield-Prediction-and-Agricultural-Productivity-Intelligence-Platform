from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, date
from typing import Optional, List

# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "Farmer"  # Default role is Farmer, can be "Administrator"

class UserRegister(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# Farm Schemas
class FarmBase(BaseModel):
    farm_name: str
    location: str
    area: float = Field(..., gt=0)  # area in acres
    soil_type: str

class FarmCreate(FarmBase):
    pass

class FarmOut(FarmBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Crop Schemas
class CropBase(BaseModel):
    crop_name: str
    season: str
    sowing_date: Optional[date] = None
    harvest_date: Optional[date] = None
    historical_yield: Optional[float] = Field(None, ge=0)

class CropCreate(CropBase):
    farm_id: int

class CropOut(CropBase):
    id: int
    farm_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Weather Data Schemas
class WeatherDataBase(BaseModel):
    temperature: float
    rainfall: float
    humidity: float
    date: date

class WeatherDataCreate(WeatherDataBase):
    farm_id: int

class WeatherDataOut(WeatherDataBase):
    id: int
    farm_id: int

    class Config:
        from_attributes = True

# Soil Data Schemas
class SoilDataBase(BaseModel):
    nitrogen: float
    phosphorus: float
    potassium: float
    ph: float

class SoilDataCreate(SoilDataBase):
    farm_id: int

class SoilDataOut(SoilDataBase):
    id: int
    farm_id: int

    class Config:
        from_attributes = True
