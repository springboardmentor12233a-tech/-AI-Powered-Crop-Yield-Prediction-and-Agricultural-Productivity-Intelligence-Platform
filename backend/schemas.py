from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Dict, Any

# Prediction Schemas
class PredictionRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    state: str = Field(..., example="Punjab", description="State or region name")
    crop: str = Field(..., example="Wheat", description="Crop type")
    season: str = Field(..., example="Rabi", description="Agricultural season")
    area: float = Field(..., example=50.0, description="Farm area in hectares")
    rainfall: float = Field(..., example=650.0, description="Annual rainfall in mm")
    temperature: float = Field(..., example=22.0, description="Average temperature in Celsius")
    fertilizer: Optional[float] = Field(120.0, description="Fertilizer usage in kg/ha")
    pesticide: Optional[float] = Field(1.5, description="Pesticide usage in kg/ha")
    soil_ph: Optional[float] = Field(6.8, description="Soil pH level")
    soil_moisture: Optional[float] = Field(35.0, description="Soil moisture percentage")
    nitrogen: Optional[float] = Field(1.8, description="Nitrogen content index")
    phosphorus: Optional[float] = Field(1.1, description="Phosphorus content index")
    potassium: Optional[float] = Field(1.3, description="Potassium content index")
    model_choice: Optional[str] = Field("xgboost", description="ML model choice: xgboost, randomforest, gradientboosting")

class PredictionResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    model_used: Optional[str] = "XGBoost Regressor"
    yield_per_hectare: float = Field(..., description="Estimated yield in Tonnes per Hectare")
    total_production: float = Field(..., description="Estimated total production in Tonnes")
    confidence: float = Field(..., description="Prediction confidence score percentage")
    risk_level: str = Field(..., description="Climate and environmental risk level")
    advisory: str = Field(..., description="AI optimization advisory for farming strategy")
    inputs_echo: Optional[Dict[str, Any]] = None

# Auth Schemas
class UserRegisterRequest(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    full_name: str
    password: str = Field(..., min_length=6)
    role: str = Field("Farmer", description="Role-based access: Farmer, Consultant, Admin, Researcher")

class UserLoginRequest(BaseModel):
    email_or_username: str = Field(..., description="Email or Username")
    password: str
    remember_me: Optional[bool] = Field(False, description="Extend JWT token expiry for 7 days if True")

class PasswordResetRequest(BaseModel):
    email_or_username: str = Field(..., description="Email or Username to request password reset")

class PasswordResetConfirm(BaseModel):
    email_or_username: str = Field(..., description="Email or Username")
    reset_code: str = Field(..., description="6-digit verification code")
    new_password: str = Field(..., min_length=6, description="New password")

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    farm_name: Optional[str] = None
    state: Optional[str] = None
    primary_crop: Optional[str] = None
    farm_size_hectares: Optional[float] = None

class FarmerProfileRequest(BaseModel):
    farm_name: Optional[str] = "Green Valley Agriculture"
    region: str = Field(..., example="Punjab", description="Agricultural region or state")
    soil_type: str = Field(..., example="Alluvial / Loamy", description="Soil type classification")
    crop_preferences: str = Field(..., example="Wheat, Rice, Maize", description="Primary crops grown")
    farm_size_hectares: float = Field(50.0, example=50.0, description="Total farm land in hectares")

class ConsultantProfileRequest(BaseModel):
    expertise: str = Field(..., example="Agronomy, Soil Chemistry & Irrigation", description="Consultant expertise areas")
    regions_served: str = Field(..., example="Punjab, Haryana, UP West", description="Regions served")
    organization_name: Optional[str] = Field("AgTech Advisory Corp", description="Firm or organization name")

class RoleUpdateRequest(BaseModel):
    role: str = Field(..., description="Target role: Farmer, Consultant, Researcher, Admin")

class UserResponse(BaseModel):
    id: str
    email: str
    username: Optional[str] = None
    full_name: str
    role: str
    farm_name: Optional[str] = None
    state: Optional[str] = None
    primary_crop: Optional[str] = None
    farm_size_hectares: Optional[float] = None
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user: UserResponse



# Agricultural Data Management Schemas
class AgriculturalRecordCreate(BaseModel):
    farm_name: Optional[str] = "Main Agricultural Field"
    state: str
    crop: str
    season: str
    area: float
    rainfall: float
    temperature: float
    fertilizer: Optional[float] = 100.0
    pesticide: Optional[float] = 1.0
    yield_per_hectare: float
    total_production: float
    risk_level: Optional[str] = "Low"
    notes: Optional[str] = ""

class AgriculturalRecordResponse(BaseModel):
    id: str
    user_id: str
    farm_name: Optional[str]
    state: str
    crop: str
    season: str
    area: float
    rainfall: float
    temperature: float
    fertilizer: Optional[float]
    pesticide: Optional[float]
    yield_per_hectare: float
    total_production: float
    risk_level: Optional[str]
    notes: Optional[str]
    created_at: str

# Soil Analysis Schema
class SoilAnalysisRequest(BaseModel):
    soil_ph: float = Field(..., example=6.8)
    nitrogen_ppm: float = Field(..., example=1.8)
    phosphorus_ppm: float = Field(..., example=1.1)
    potassium_ppm: float = Field(..., example=1.3)
    moisture_percent: float = Field(..., example=32.0)
    organic_matter_percent: Optional[float] = 1.8
    target_crop: Optional[str] = "Wheat"

# Report Request Schema
class YieldReportRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    report_title: Optional[str] = "CropCast Precision Intelligence Report"
    farmer_name: Optional[str] = "Registered Farmer"
    consultant_name: Optional[str] = "Dr. Agronomist (CropCast Lead)"
    state: str = Field("Punjab", example="Punjab")
    crop: str = Field("Wheat", example="Wheat")
    season: str = Field("Rabi", example="Rabi")
    area: float = Field(50.0, example=50.0)
    rainfall: float = Field(650.0, example=650.0)
    temperature: float = Field(22.0, example=22.0)
    fertilizer: Optional[float] = Field(120.0, example=120.0)
    pesticide: Optional[float] = Field(1.5, example=1.5)
    yield_per_hectare: Optional[float] = Field(4.85, example=4.85)
    total_production: Optional[float] = Field(242.5, example=242.5)
    confidence: Optional[float] = Field(94.8, example=94.8)
    risk_level: Optional[str] = Field("Low", example="Low")
    model_used: Optional[str] = Field("XGBoost Regressor v2.4", example="XGBoost Regressor v2.4")
    advisory: Optional[str] = Field("Apply Nitrogen top-dressing at tillering stage and maintain scheduled micro-irrigation.", example="Advisory text")

