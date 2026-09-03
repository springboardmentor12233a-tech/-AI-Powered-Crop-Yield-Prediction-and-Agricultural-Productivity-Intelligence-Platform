from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any

from src.ml.models.registry import predict_crop_recommendation
from src.analytics.soil_analysis import classify_soil_ph

router = APIRouter(prefix="/api/predict", tags=["Recommendations"])

class RecommendationRequest(BaseModel):
    Temperature: float = Field(..., ge=-50.0, le=60.0, description="Temperature in °C")
    Humidity: float = Field(..., ge=0.0, le=100.0, description="Humidity percentage 0-100")
    pH: float = Field(..., ge=0.0, le=14.0, description="Soil pH scale 0-14")
    Rainfall: float = Field(..., ge=0.0, le=10000.0, description="Rainfall in mm")

class CropCandidate(BaseModel):
    crop: str
    confidence: float
    confidence_pct: str

class RecommendationResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    recommended_crop: str
    confidence: float
    confidence_pct: str
    top_candidates: List[CropCandidate]
    soil_ph_analysis: Dict[str, Any]
    model_version: str
    algorithm: str
    status: str

@router.post("/recommendation", response_model=RecommendationResponse)
def predict_recommendation(req: RecommendationRequest):
    input_data = req.model_dump()
    
    try:
        candidates = predict_crop_recommendation(input_data, top_k=5)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation model inference failed: {str(e)}")
        
    if not candidates:
        raise HTTPException(status_code=500, detail="Model returned empty candidate list.")
        
    top = candidates[0]
    ph_info = classify_soil_ph(req.pH)
    
    return RecommendationResponse(
        recommended_crop=top["crop"],
        confidence=top["confidence"],
        confidence_pct=top["confidence_pct"],
        top_candidates=[CropCandidate(**c) for c in candidates],
        soil_ph_analysis=ph_info,
        model_version="YieldSense_Clf_v2.0.0",
        algorithm="Random Forest Classifier (Accuracy: 95.86%)",
        status="Success"
    )
