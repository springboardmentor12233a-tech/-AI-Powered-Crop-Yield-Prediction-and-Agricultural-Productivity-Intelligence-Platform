import os
import json
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from backend.app.services.ml_service import ml_service

router = APIRouter(prefix="/api/predict", tags=["Yield Predictions"])

class YieldPredictionRequest(BaseModel):
    crop_type: str = Field(..., json_schema_extra={"example": "Wheat"})
    region: str = Field(..., json_schema_extra={"example": "North India"})
    irrigation_type: str = Field(..., json_schema_extra={"example": "Drip"})
    fertilizer_type: str = Field(..., json_schema_extra={"example": "NPK 14-35-14"})
    crop_disease_status: str = Field(..., json_schema_extra={"example": "None"})
    soil_pH: float = Field(..., ge=3.0, le=10.0, json_schema_extra={"example": 6.5})
    soil_moisture_percent: float = Field(..., alias="soil_moisture_%", ge=0.0, le=100.0, json_schema_extra={"example": 45.0})
    temperature_C: float = Field(..., ge=-10.0, le=60.0, json_schema_extra={"example": 24.5})
    rainfall_mm: float = Field(..., ge=0.0, le=2000.0, json_schema_extra={"example": 185.0})
    humidity_percent: float = Field(..., alias="humidity_%", ge=0.0, le=100.0, json_schema_extra={"example": 62.0})
    sunlight_hours: float = Field(..., ge=0.0, le=24.0, json_schema_extra={"example": 7.5})
    pesticide_usage_ml: float = Field(..., ge=0.0, json_schema_extra={"example": 450.0})
    total_days: int = Field(..., ge=1, le=365, json_schema_extra={"example": 120})
    NDVI_index: float = Field(..., ge=0.0, le=1.0, json_schema_extra={"example": 0.68})

    class Config:
        populate_by_name = True

class YieldPredictionResponse(BaseModel):
    predicted_yield_kg_ha: float
    productivity_rating: str
    risk_rating: str

@router.post("", response_model=YieldPredictionResponse)
def predict_crop_yield(request: YieldPredictionRequest):
    try:
        # Convert Pydantic object to dict with exact feature keys
        payload = {
            "crop_type": request.crop_type,
            "region": request.region,
            "irrigation_type": request.irrigation_type,
            "fertilizer_type": request.fertilizer_type,
            "crop_disease_status": request.crop_disease_status,
            "soil_pH": request.soil_pH,
            "soil_moisture_%": request.soil_moisture_percent,
            "temperature_C": request.temperature_C,
            "rainfall_mm": request.rainfall_mm,
            "humidity_%": request.humidity_percent,
            "sunlight_hours": request.sunlight_hours,
            "pesticide_usage_ml": request.pesticide_usage_ml,
            "total_days": request.total_days,
            "NDVI_index": request.NDVI_index
        }

        result = ml_service.predict_yield(payload)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(re))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Prediction failed: {str(e)}")

@router.get("/models")
def get_model_performance_metrics():
    metrics_path = os.path.join("models", "model_performance_metrics.json")
    if not os.path.exists(metrics_path):
        raise HTTPException(
            status_code=404,
            detail="Model performance metrics JSON not found. Please train models first."
        )

    try:
        with open(metrics_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read metrics: {str(e)}")
