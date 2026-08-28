from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from src.api.routers.auth import UserProfile, get_current_user

router = APIRouter(prefix="/api/predict", tags=["Recommendations"])

class RecommendationRequest(BaseModel):
    Temperature: float = Field(..., ge=-50.0, le=60.0, description="Temperature in °C")
    Humidity: float = Field(..., ge=0.0, le=100.0, description="Humidity percentage 0-100")
    pH: float = Field(..., ge=0.0, le=14.0, description="Soil pH scale 0-14")
    Rainfall: float = Field(..., ge=0.0, description="Rainfall in mm")

class RecommendationResponse(BaseModel):
    recommended_crop: str
    confidence: float
    model_version: str
    status: str

@router.post("/recommendation", response_model=RecommendationResponse)
def predict_recommendation(req: RecommendationRequest, current_user: UserProfile = Depends(get_current_user)):
    # Mock recommendation logic mapping environment inputs to crop types from the 70 crops in Dataset A
    temp = req.Temperature
    hum = req.Humidity
    ph = req.pH
    rain = req.Rainfall
    
    # Simple decision trees simulation
    if rain > 2000.0:
        recommended = "Rice" if ph > 6.0 else "Jute"
    elif ph < 5.5:
        recommended = "Tea"
    elif temp > 35.0:
        recommended = "Aleovera" if hum < 40.0 else "Papaya"
    elif rain < 100.0:
        recommended = "Mustard" if temp < 20.0 else "Bajra"
    else:
        # Default choices
        if ph > 7.5:
            recommended = "French Beans"
        else:
            recommended = "Maize" if rain < 500.0 else "Coffee"
            
    return RecommendationResponse(
        recommended_crop=recommended,
        confidence=0.87,
        model_version="YieldSense_Clf_v1.0.0_mock",
        status="Success"
    )
