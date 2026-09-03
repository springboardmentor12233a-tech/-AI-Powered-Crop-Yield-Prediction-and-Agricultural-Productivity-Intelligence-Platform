from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from src.analytics.weather_analytics import get_weather_analytics_summary
from src.analytics.soil_analysis import get_soil_analysis_summary, classify_soil_ph
from src.analytics.prediction_report import build_prediction_report, format_markdown_report
from src.ml.models.registry import predict_crop_yield, predict_crop_recommendation

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Insights"])

class ReportRequest(BaseModel):
    farm_id: Optional[str] = "FARM-DEFAULT-01"
    plot_label: Optional[str] = "Plot 1"
    Crop: str = Field(..., description="Crop name: Maize, Barley, Rice, Wheat")
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

@router.get("/weather")
def get_weather_analytics():
    """Returns weather distributions, historical climate ranges, and optimal crop climate envelopes."""
    try:
        return get_weather_analytics_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate weather analytics: {str(e)}")

@router.get("/soil")
def get_soil_analytics():
    """Returns soil pH distribution, soil texture performance benchmarks, and crop-soil interactions."""
    try:
        return get_soil_analysis_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate soil analytics: {str(e)}")

@router.post("/report")
def generate_farm_prediction_report(req: ReportRequest):
    """Generates a complete, structured agricultural prediction and intelligence report."""
    input_data = req.model_dump()
    
    # 1. Run live yield model
    try:
        predicted_yield = predict_crop_yield(input_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Yield prediction failed: {str(e)}")
        
    # 2. Run crop recommendation matching
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
        
    # 3. Build comprehensive report
    report_dict = build_prediction_report(
        farm_id=req.farm_id,
        plot_label=req.plot_label,
        crop=req.Crop,
        region=req.Region,
        soil_type=req.Soil_Type,
        soil_ph=req.Soil_pH,
        rainfall_mm=req.Rainfall_mm,
        temperature_c=req.Temperature_C,
        humidity_pct=req.Humidity_pct,
        fertilizer_kg=req.Fertilizer_Used_kg,
        pesticides_kg=req.Pesticides_Used_kg,
        planting_density=req.Planting_Density,
        irrigation=req.Irrigation,
        previous_crop=req.Previous_Crop,
        predicted_yield=predicted_yield,
        recommended_crops=recommendations
    )
    
    report_dict["formatted_markdown"] = format_markdown_report(report_dict)
    return report_dict
