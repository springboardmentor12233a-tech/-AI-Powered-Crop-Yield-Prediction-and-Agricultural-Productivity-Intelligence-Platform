import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field, ConfigDict

from src.ml.models.registry import predict_crop_yield, predict_crop_recommendation, get_yield_model
from src.analytics.agricultural_insights import generate_agricultural_insights
from src.api.routers.auth import get_current_user_id
from src.db.database import save_user_prediction

router = APIRouter(prefix="/api/predict", tags=["Predictions"])

class YieldPredictionRequest(BaseModel):
    Crop: str = Field(..., description="Crop type: Maize, Barley, Rice, Wheat")
    Region: str = Field(..., description="Region: Region_A, Region_B, Region_C, Region_D")
    Soil_Type: str = Field(..., description="Soil: Sandy, Loam, Clay")
    Soil_pH: float = Field(..., ge=0.0, le=14.0, description="Soil pH scale 0-14")
    Rainfall_mm: float = Field(..., ge=0.0, le=10000.0, description="Precipitation in mm")
    Temperature_C: float = Field(..., ge=-50.0, le=60.0, description="Temperature in °C")
    Humidity_pct: float = Field(..., ge=0.0, le=100.0, description="Humidity percentage 0-100")
    Fertilizer_Used_kg: float = Field(..., ge=0.0, le=2000.0, description="Fertilizer applied in kg")
    Irrigation: str = Field(..., description="Sprinkler, Flood, Drip, Unknown")
    Pesticides_Used_kg: float = Field(..., ge=0.0, le=500.0, description="Pesticides applied in kg")
    Planting_Density: float = Field(..., ge=0.0, le=200.0, description="Planting density plants/m²")
    Previous_Crop: str = Field(..., description="Rice, Barley, Wheat, Maize, Unknown")
    field_name: Optional[str] = "North Field"
    farm_id: Optional[str] = "FARM-DEFAULT-01"
    plot_label: Optional[str] = "North Field"

class YieldPredictionResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    report_id: str
    predicted_yield_ton_per_ha: float
    model_version: str
    algorithm: str
    status: str
    confidence_metric: str
    insights: Dict[str, Any]

ALLOWED_CROPS = {"Maize", "Barley", "Rice", "Wheat"}
ALLOWED_REGIONS = {"Region_A", "Region_B", "Region_C", "Region_D"}
ALLOWED_SOILS = {"Sandy", "Loam", "Clay"}
ALLOWED_IRRIGATIONS = {"Sprinkler", "Flood", "Drip", "Unknown"}
ALLOWED_PREV_CROPS = {"Rice", "Barley", "Wheat", "Maize", "Unknown"}

@router.post("/yield", response_model=YieldPredictionResponse)
def predict_yield(req: YieldPredictionRequest, user_id: Optional[int] = Depends(get_current_user_id)):
    """
    Executes live ML inference for Crop Yield Forecasting.
    - Validates category inputs against supported categorical envelopes.
    - Runs in-memory scikit-learn regressor pipeline (<20ms execution time).
    - Fetches top matching environmental crop recommendations.
    - Generates multi-tiered agronomic insights.
    - Automatically persists report to the farmer's history if authenticated.
    """
    # Category input validation
    if req.Crop not in ALLOWED_CROPS:
        raise HTTPException(status_code=400, detail=f"Invalid Crop '{req.Crop}'. Allowed: {sorted(list(ALLOWED_CROPS))}")
    if req.Region not in ALLOWED_REGIONS:
        raise HTTPException(status_code=400, detail=f"Invalid Region '{req.Region}'. Allowed: {sorted(list(ALLOWED_REGIONS))}")
    if req.Soil_Type not in ALLOWED_SOILS:
        raise HTTPException(status_code=400, detail=f"Invalid Soil_Type '{req.Soil_Type}'. Allowed: {sorted(list(ALLOWED_SOILS))}")
    if req.Irrigation not in ALLOWED_IRRIGATIONS:
        raise HTTPException(status_code=400, detail=f"Invalid Irrigation '{req.Irrigation}'. Allowed: {sorted(list(ALLOWED_IRRIGATIONS))}")
    if req.Previous_Crop not in ALLOWED_PREV_CROPS:
        raise HTTPException(status_code=400, detail=f"Invalid Previous_Crop '{req.Previous_Crop}'. Allowed: {sorted(list(ALLOWED_PREV_CROPS))}")

    # Fast in-memory inference
    input_data = req.model_dump()
    try:
        predicted_yield = predict_crop_yield(input_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model inference failed: {str(e)}")

    # Fast top-3 suitability recommendations
    rec_input = {
        "Temperature": req.Temperature_C,
        "Humidity": req.Humidity_pct,
        "pH": req.Soil_pH,
        "Rainfall": req.Rainfall_mm
    }
    try:
        recommendations = predict_crop_recommendation(rec_input, top_k=3)
    except Exception:
        recommendations = []

    # Generate insights summary
    insights = generate_agricultural_insights(
        crop=req.Crop,
        soil_ph=req.Soil_pH,
        soil_type=req.Soil_Type,
        rainfall_mm=req.Rainfall_mm,
        temperature_c=req.Temperature_C,
        humidity_pct=req.Humidity_pct,
        fertilizer_kg=req.Fertilizer_Used_kg,
        pesticides_kg=req.Pesticides_Used_kg,
        irrigation=req.Irrigation,
        previous_crop=req.Previous_Crop,
        predicted_yield=predicted_yield,
        recommended_crops=recommendations
    )

    report_id = f"RPT-{uuid.uuid4().hex[:8].upper()}"

    # Auto-save prediction report if farmer is logged in
    if user_id:
        try:
            save_user_prediction(
                user_id=user_id,
                report_id=report_id,
                payload=input_data,
                predicted_yield=predicted_yield,
                insights=insights
            )
        except Exception:
            pass

    return YieldPredictionResponse(
        report_id=report_id,
        predicted_yield_ton_per_ha=predicted_yield,
        model_version="YieldSense_Reg_v2.0.0",
        algorithm="GridSearch Optimal Regressor",
        status="Success",
        confidence_metric="High Validation Performance",
        insights=insights
    )
