from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, EmailStr, Field


# ============================================================
# AUTHENTICATION SCHEMAS
# ============================================================

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2)
    role: Literal["farmer", "admin"] = "farmer"
    farm_location: Optional[str] = ""


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    farm_location: Optional[str] = ""
    created_at: float


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class AdminUserUpdateRequest(BaseModel):
    role: Optional[Literal["farmer", "admin"]] = None
    account_status: Optional[Literal["active", "pending", "disabled"]] = None


class AnnouncementRequest(BaseModel):
    message: str = Field(..., min_length=3, max_length=500)
    audience: Literal["all", "farmers", "admins"] = "all"


class FeedbackRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=3, max_length=1000)


class DatasetVersionRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    source: str = Field(..., min_length=2, max_length=200)
    notes: str = Field("", max_length=1000)


# ============================================================
# PREDICTION SCHEMAS
# ============================================================

class PredictionRequest(BaseModel):
    Year: int = Field(..., ge=1900, le=2100)

    State_Name: str = Field(..., min_length=1)
    Dist_Name: str = Field(..., min_length=1)
    Crop: str = Field(..., min_length=1)

    Area: float = Field(..., gt=0)

    Previous_Year_Yield: float = Field(..., ge=0)
    Previous_Year_Area: float = Field(..., ge=0)
    Previous_Year_Production: float = Field(..., ge=0)

    ai_provider: Optional[str] = Field("auto", description="'groq', 'gemini', or 'auto'")
    language: Optional[str] = Field("English", description="Response language e.g. Telugu, Hindi, Tamil, Kannada, Malayalam, Marathi, English")


class PredictionResponse(BaseModel):
    success: bool
    id: Optional[str] = None

    Year: int
    State_Name: str
    Dist_Name: str
    Crop: str

    predicted_yield: float
    unit: str = "Kg per ha"

    model: str = "XGBoost"

    ai_analysis: str
    ai_provider_used: str = "Groq"


# ============================================================
# AI CHAT ASSISTANT SCHEMAS
# ============================================================

class ChatMessage(BaseModel):
    sender: str  # 'user' or 'assistant'
    text: str


class AIChatRequest(BaseModel):
    messages: List[ChatMessage]
    provider: Optional[str] = Field("auto", description="'groq', 'gemini', or 'auto'")
    language: Optional[str] = Field("English", description="Response language")


class AIChatResponse(BaseModel):
    success: bool
    reply: str
    provider_used: str


class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1)
    target_language: str = Field(..., description="Target language e.g. Telugu, Hindi, Tamil, Kannada, Malayalam, Marathi, English")
    provider: Optional[str] = Field("auto")


class TranslateResponse(BaseModel):
    success: bool
    translated_text: str
    target_language: str
    provider_used: str



# ============================================================
# NEW ENHANCEMENT SCHEMAS
# ============================================================

class FertilizerRequest(BaseModel):
    Crop: str
    target_yield: float  # Kg per ha
    nitrogen_level: float = 40.0  # kg/ha soil current
    phosphorus_level: float = 20.0
    potassium_level: float = 25.0
    ph_level: float = 6.5
    soil_type: str = "Alluvial"


class FertilizerResponse(BaseModel):
    crop: str
    target_yield: float
    soil_status: str
    urea_kg_per_ha: float
    dap_kg_per_ha: float
    mop_kg_per_ha: float
    n_deficit: float
    p_deficit: float
    k_deficit: float
    organic_recommendations: List[str]
    ai_advice: str


class MultiCropCompareRequest(BaseModel):
    Year: int
    State_Name: str
    Dist_Name: str
    crops: List[str]
    Area: float = 1.0
    Previous_Year_Yield: float = 2000.0
    Previous_Year_Area: float = 1.0
    Previous_Year_Production: float = 2000.0


class CropComparisonItem(BaseModel):
    crop: str
    predicted_yield: float  # Kg per ha
    estimated_production: float  # Kg
    gross_revenue_inr: float
    estimated_cost_inr: float
    net_profit_inr: float
    roi_percentage: float
    risk_level: str


class MultiCropCompareResponse(BaseModel):
    state: str
    district: str
    year: int
    area: float
    best_crop: str
    comparisons: List[CropComparisonItem]
    ai_recommendation: str


class WeatherForecastResponse(BaseModel):
    state: str
    district: str
    current_temp_c: float
    current_humidity_pct: float
    rainfall_mm: float
    solar_radiation_mj: float
    soil_moisture_pct: float
    wind_speed_kmh: Optional[float] = 12.5
    condition: Optional[str] = "Partly Cloudy"
    observation_time: Optional[str] = ""
    forecast_5day: List[dict]
    agro_climate_zone: str
    weather_summary: str
    planting_advice: Optional[Dict[str, Any]] = None


class PestRiskRequest(BaseModel):
    Crop: str
    temperature_c: float
    humidity_pct: float
    rainfall_mm: float


class PestRiskResponse(BaseModel):
    crop: str
    risk_level: str  # Low, Moderate, High, Severe
    primary_pest_diseases: List[str]
    preventive_actions: List[str]
    ai_advisory: str
