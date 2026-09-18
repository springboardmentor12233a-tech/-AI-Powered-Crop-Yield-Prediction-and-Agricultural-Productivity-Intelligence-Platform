"""
YieldSense AI — Pydantic Schemas
Request/response models for all API endpoints.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ─── Authentication ──────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None
    role: Optional[str] = "farmer"
    farm_name: Optional[str] = None
    farm_location: Optional[str] = None


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    role: str
    farm_name: Optional[str]
    farm_location: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Crop Yield Prediction ────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    crop: str = Field(..., description="Crop type e.g. Rice, Wheat, Maize")
    rainfall_mm: float = Field(..., ge=0, le=5000, description="Annual rainfall in mm")
    temperature_c: float = Field(..., ge=-10, le=60, description="Average temperature in °C")
    fertilizer_used: int = Field(..., ge=0, le=1, description="1 if fertilizer used, 0 otherwise")
    irrigation_used: int = Field(..., ge=0, le=1, description="1 if irrigation used, 0 otherwise")
    weather_condition: str = Field(..., description="Weather condition e.g. Sunny, Rainy")
    soil_type: str = Field(..., description="Soil type e.g. Loamy, Sandy, Clay")
    region: str = Field(..., description="Region e.g. North, South")
    nitrogen: float = Field(..., ge=0, le=200, description="Nitrogen content (kg/ha)")
    phosphorus: float = Field(..., ge=0, le=200, description="Phosphorus content (kg/ha)")
    potassium: float = Field(..., ge=0, le=200, description="Potassium content (kg/ha)")
    soil_ph: float = Field(..., ge=0, le=14, description="Soil pH")


class PredictResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    predicted_yield_kg_per_acre: float
    model_used: str
    input_summary: dict
    prediction_confidence: str



# ─── AI Insights ──────────────────────────────────────────────────────────────

class InsightsRequest(BaseModel):
    crop: str
    rainfall_mm: float
    temperature_c: float
    fertilizer_used: int
    irrigation_used: int
    weather_condition: str
    soil_type: str
    region: str
    nitrogen: float
    phosphorus: float
    potassium: float
    soil_ph: float
    predicted_yield_kg_per_acre: float


class InsightsResponse(BaseModel):
    insights: str
    provider: str
    model: str
    disclaimer: str


# ─── Analysis ─────────────────────────────────────────────────────────────────

class WeatherStats(BaseModel):
    avg_rainfall_mm: float
    avg_temperature_c: float
    min_rainfall_mm: float
    max_rainfall_mm: float
    min_temperature_c: float
    max_temperature_c: float
    rainfall_by_condition: dict
    temperature_by_crop: dict
    yield_by_weather_condition: dict
    rainfall_yield_correlation: float
    temperature_yield_correlation: float


class SoilStats(BaseModel):
    avg_nitrogen: float
    avg_phosphorus: float
    avg_potassium: float
    avg_soil_ph: float
    yield_by_soil_type: dict
    nutrient_yield_correlation: dict
    soil_ph_distribution: dict
    top_soil_type_by_yield: str
