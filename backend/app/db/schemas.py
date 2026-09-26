from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime, date
from typing import Optional, List, Dict, Any

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

# ML Prediction Schemas (Milestone 2)
class YieldPredictionInput(BaseModel):
    State: str = Field(..., example="Karnataka", description="State name")
    Crop: str = Field(..., example="Soybean", description="Crop variety name")
    Soil_Type: str = Field(..., example="Loamy", description="Soil classification")
    Fertilizer: str = Field(..., example="DAP", description="Fertilizer applied")
    N: float = Field(..., ge=0, example=56.0, description="Nitrogen ratio in soil (kg/ha)")
    P: float = Field(..., ge=0, example=41.0, description="Phosphorus ratio in soil (kg/ha)")
    K: float = Field(..., ge=0, example=51.0, description="Potassium ratio in soil (kg/ha)")
    Rainfall_mm: float = Field(..., ge=0, example=120.0, description="Average seasonal rainfall (mm)")
    Temperature_C: float = Field(..., example=31.06, description="Average seasonal temperature (°C)")
    Soil_pH: float = Field(..., ge=0.0, le=14.0, example=6.82, description="Soil pH index (0-14)")
    Year: Optional[int] = Field(default=2026, example=2024, description="Harvest/Cropping calendar year")

class YieldPredictionResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    predicted_yield_kg_per_acre: float
    predicted_yield_tons_per_acre: float
    raw_prediction_kg: Optional[float] = None
    productivity_category: str
    recommendation_summary: str
    model_version: str
    algorithm_used: str
    inputs_received: Dict[str, Any]

class MLModelInfoResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    best_model_name: str
    model_version: str
    dataset_size: int
    train_samples: int
    test_samples: int
    number_of_features: int
    total_transformed_features: int
    mae: float
    rmse: float
    r2: float
    mse: Optional[float] = None
    train_mae: Optional[float] = None
    train_rmse: Optional[float] = None
    train_r2: Optional[float] = None
    features: List[str]
    created_at: Optional[str] = None

# Prediction History Schemas (Milestone 2 Step 8)
class PredictionRecordCreate(BaseModel):
    farm_id: Optional[int] = None
    crop_id: Optional[int] = None
    State: str = Field(..., example="Karnataka")
    Crop: str = Field(..., example="Soybean")
    Soil_Type: str = Field(..., example="Loamy")
    Fertilizer: str = Field(..., example="DAP")
    N: float = Field(..., ge=0, example=56.0)
    P: float = Field(..., ge=0, example=41.0)
    K: float = Field(..., ge=0, example=51.0)
    Rainfall_mm: float = Field(..., ge=0, example=120.0)
    Temperature_C: float = Field(..., example=31.06)
    Soil_pH: float = Field(..., ge=0.0, le=14.0, example=6.82)
    Year: Optional[int] = Field(default=2026, example=2024)

class PredictionRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: int
    user_id: int
    farm_id: Optional[int] = None
    crop_id: Optional[int] = None
    state: str
    crop: str
    soil_type: str
    fertilizer: str
    n: float
    p: float
    k: float
    rainfall_mm: float
    temperature_c: float
    soil_ph: float
    year: int
    predicted_yield_kg: float
    predicted_yield_tons: float
    productivity_category: Optional[str] = None
    recommendation_summary: Optional[str] = None
    model_name: str
    created_at: datetime


# --- Milestone 3: Admin & System Schemas ---
class AdminUserSummaryOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    created_at: datetime
    farms_count: int
    crops_count: int
    predictions_count: int

    class Config:
        from_attributes = True

class AdminActivityItem(BaseModel):
    id: str
    type: str  # "prediction", "user_registered", "farm_created", "crop_created"
    title: str
    description: str
    timestamp: datetime
    user_name: Optional[str] = None
    user_email: Optional[str] = None

class AdminStatsOut(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    total_users: int
    total_farmers: int
    total_administrators: int
    total_farms: int
    total_crops: int
    total_predictions: int
    avg_system_predicted_yield_kg: float
    model_info: Dict[str, Any]
    state_distribution: List[Dict[str, Any]]
    crop_distribution: List[Dict[str, Any]]
    recent_activity: List[AdminActivityItem]


# --- Milestone 3: Agricultural Analytics & Risk Analysis Schemas ---
class CropProductivityStat(BaseModel):
    crop_name: str
    record_count: int
    avg_yield_kg_per_acre: float
    min_yield_kg_per_acre: float
    max_yield_kg_per_acre: float
    productivity_rating: str  # "High", "Moderate", "Low"

class SoilAnalyticsStat(BaseModel):
    soil_type: str
    count: int
    avg_yield_kg_per_acre: float
    avg_ph: float
    avg_nitrogen: float
    avg_phosphorus: float
    avg_potassium: float

class WeatherAnalyticsStat(BaseModel):
    rainfall_category: str  # "Low (<120mm)", "Moderate (120-220mm)", "High (>220mm)"
    avg_yield_kg_per_acre: float
    count: int

class YieldDistributionBucket(BaseModel):
    label: str  # "< 1000", "1000-2000", "2000-3000", "3000-4000", "> 4000"
    count: int
    percentage: float

class AgriculturalAnalyticsOut(BaseModel):
    total_records_analyzed: int
    avg_yield_kg_per_acre: float
    max_yield_kg_per_acre: float
    min_yield_kg_per_acre: float
    productivity_breakdown: Dict[str, int]  # {"High Yield": 50, "Moderate Yield": 30, ...}
    crop_productivity: List[CropProductivityStat]
    soil_analytics: List[SoilAnalyticsStat]
    weather_analytics: List[WeatherAnalyticsStat]
    yield_distribution: List[YieldDistributionBucket]
    key_insights: List[str]
    system_recommendations: List[str]

class FarmerAnalyticsOut(BaseModel):
    farmer_id: int
    total_farms: int
    total_crops: int
    total_predictions: int
    avg_predicted_yield_kg: float
    highest_predicted_yield_kg: float
    lowest_predicted_yield_kg: float
    productivity_summary: Dict[str, int]
    recent_predictions: List[PredictionRecordOut]
    farms_summary: List[FarmOut]
    crops_summary: List[CropOut]
    tailored_insights: List[str]
    tailored_recommendations: List[str]


# --- Milestone 3: Risk & Insight Engine Schemas ---
class RiskAnalysisInput(BaseModel):
    Crop: str
    Soil_Type: str
    Fertilizer: str
    N: float = Field(..., ge=0)
    P: float = Field(..., ge=0)
    K: float = Field(..., ge=0)
    Rainfall_mm: float = Field(..., ge=0)
    Temperature_C: float
    Soil_pH: float = Field(..., ge=0.0, le=14.0)

class RiskFactor(BaseModel):
    category: str  # "Soil pH", "Rainfall", "Temperature", "Nutrient Balance", "Fertilizer"
    severity: str  # "Critical", "Warning", "Optimal"
    title: str
    description: str
    impact_on_yield: str

class RiskAnalysisOut(BaseModel):
    overall_risk_level: str  # "Low Risk", "Moderate Risk", "High Risk"
    risk_score_percent: float  # 0 to 100 (0 = low risk, 100 = critical risk)
    productivity_forecast: str  # "Optimal Productivity", "Moderate Productivity", "Stressed / Low Productivity"
    risk_factors: List[RiskFactor]
    strengths: List[str]
    actionable_recommendations: List[str]
    agronomic_advisory: str


# --- Milestone 3: Agricultural AI Chatbot Schemas ---
class ChatMessageItem(BaseModel):
    role: str  # "user" or "assistant"
    message: str

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    context: Optional[Dict[str, Any]] = None  # e.g., current crop, soil, weather if asked from a prediction page
    history: Optional[List[ChatMessageItem]] = None

class ChatResponse(BaseModel):
    reply: str
    category: str  # "crop_advice", "soil_fertilizer", "weather_irrigation", "yield_prediction", "model_info", "general_farming"
    suggestions: List[str]
    timestamp: datetime

class ChatMessageOut(BaseModel):
    id: int
    role: str
    message: str
    category: Optional[str] = None
    suggestions: Optional[List[str]] = None
    created_at: datetime

    class Config:
        from_attributes = True

