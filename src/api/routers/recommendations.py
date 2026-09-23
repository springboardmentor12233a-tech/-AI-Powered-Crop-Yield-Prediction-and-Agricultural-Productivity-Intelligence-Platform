from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional

from src.ml.models.registry import predict_crop_recommendation
from src.analytics.soil_analysis import classify_soil_ph
from src.api.routers.auth import get_current_user_id
from src.db.database import save_user_recommendation, get_user_recommendation_history

router = APIRouter(prefix="/api/predict", tags=["Crop Suitability Recommendations"])

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
def predict_recommendation(req: RecommendationRequest, user_id: Optional[int] = Depends(get_current_user_id)):
    """
    Executes live ML inference to Analyze Crop Suitability matching temperature, humidity, pH, and rainfall.
    Runs fast in-memory classification (<15ms latency) and automatically persists to farmer history when authenticated.
    """
    input_data = req.model_dump()
    
    try:
        candidates = predict_crop_recommendation(input_data, top_k=5)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Crop suitability analysis failed: {str(e)}")
        
    if not candidates:
        raise HTTPException(status_code=500, detail="Model returned no crop candidates.")
        
    top = candidates[0]
    ph_info = classify_soil_ph(req.pH)
    
    # Auto-save to farmer recommendation history
    if user_id:
        try:
            save_user_recommendation(
                user_id=user_id,
                recommended_crop=top["crop"],
                confidence=top["confidence"],
                confidence_pct=top["confidence_pct"],
                temp=req.Temperature,
                humidity=req.Humidity,
                ph=req.pH,
                rainfall=req.Rainfall,
                top_candidates=candidates,
                soil_analysis=ph_info
            )
        except Exception:
            pass
    
    return RecommendationResponse(
        recommended_crop=top["crop"],
        confidence=top["confidence"],
        confidence_pct=top["confidence_pct"],
        top_candidates=[CropCandidate(**c) for c in candidates],
        soil_ph_analysis=ph_info,
        model_version="YieldSense_Clf_v2.0.0",
        algorithm="GridSearch Optimal Classifier",
        status="Success"
    )

@router.get("/recommendations/history")
def get_recommendation_history(user_id: Optional[int] = Depends(get_current_user_id)):
    """Returns past crop suitability evaluations for the authenticated farmer."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required.")
    history = get_user_recommendation_history(user_id)
    return {"history": history, "status": "Success"}
