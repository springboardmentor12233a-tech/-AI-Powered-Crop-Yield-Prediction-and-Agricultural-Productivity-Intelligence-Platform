from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from src.api.routers.auth import UserProfile, get_current_user

router = APIRouter(prefix="/api/predict", tags=["Predictions"])

class YieldPredictionRequest(BaseModel):
    Crop: str = Field(..., description="Crop type: Maize, Barley, Rice, Wheat")
    Region: str = Field(..., description="Region: Region_A, Region_B, Region_C, Region_D")
    Soil_Type: str = Field(..., description="Soil: Sandy, Loam, Clay")
    Soil_pH: float = Field(..., ge=0.0, le=14.0, description="Soil pH scale 0-14")
    Rainfall_mm: float = Field(..., ge=0.0, description="Precipitation in mm")
    Temperature_C: float = Field(..., ge=-50.0, le=60.0, description="Temperature in C")
    Humidity_pct: float = Field(..., ge=0.0, le=100.0, description="Humidity percentage 0-100")
    Fertilizer_Used_kg: float = Field(..., ge=0.0, description="Fertilizer applied in kg")
    Irrigation: str = Field(..., description="Sprinkler, Flood, Drip, Unknown")
    Pesticides_Used_kg: float = Field(..., ge=0.0, description="Pesticides applied in kg")
    Planting_Density: float = Field(..., ge=0.0, description="Planting density plants/m2")
    Previous_Crop: str = Field(..., description="Rice, Barley, Wheat, Maize, Unknown")

class YieldPredictionResponse(BaseModel):
    predicted_yield_ton_per_ha: float
    model_version: str
    status: str

# Allowed categories for validation
ALLOWED_CROPS = {"Maize", "Barley", "Rice", "Wheat"}
ALLOWED_REGIONS = {"Region_A", "Region_B", "Region_C", "Region_D"}
ALLOWED_SOILS = {"Sandy", "Loam", "Clay"}
ALLOWED_IRRIGATIONS = {"Sprinkler", "Flood", "Drip", "Unknown"}
ALLOWED_PREV_CROPS = {"Rice", "Barley", "Wheat", "Maize", "Unknown"}

@router.post("/yield", response_model=YieldPredictionResponse)
def predict_yield(req: YieldPredictionRequest, current_user: UserProfile = Depends(get_current_user)):
    # 1. Access Control (All authenticated users can run predictions)
    # Check if category values are correct
    if req.Crop not in ALLOWED_CROPS:
        raise HTTPException(status_code=400, detail=f"Invalid Crop value. Allowed: {list(ALLOWED_CROPS)}")
    if req.Region not in ALLOWED_REGIONS:
        raise HTTPException(status_code=400, detail=f"Invalid Region value. Allowed: {list(ALLOWED_REGIONS)}")
    if req.Soil_Type not in ALLOWED_SOILS:
        raise HTTPException(status_code=400, detail=f"Invalid Soil_Type value. Allowed: {list(ALLOWED_SOILS)}")
    if req.Irrigation not in ALLOWED_IRRIGATIONS:
        raise HTTPException(status_code=400, detail=f"Invalid Irrigation value. Allowed: {list(ALLOWED_IRRIGATIONS)}")
    if req.Previous_Crop not in ALLOWED_PREV_CROPS:
        raise HTTPException(status_code=400, detail=f"Invalid Previous_Crop value. Allowed: {list(ALLOWED_PREV_CROPS)}")

    # 2. Mock model prediction logic (matching typical ranges in Dataset B: 28 to 207 ton/ha)
    # A simple linear logic for the mock output
    base_yield = 80.0
    if req.Crop == "Rice":
        base_yield += 10.0
    elif req.Crop == "Wheat":
        base_yield += 5.0
        
    soil_ph_factor = (req.Soil_pH - 6.5) * 5.0  # optimal around 6.5
    fertilizer_factor = (req.Fertilizer_Used_kg / 300.0) * 40.0
    rainfall_factor = (req.Rainfall_mm / 1500.0) * 20.0
    
    mock_prediction = base_yield + soil_ph_factor + fertilizer_factor + rainfall_factor
    mock_prediction = max(28.45, min(207.21, mock_prediction)) # Bounded to Dataset B ranges

    return YieldPredictionResponse(
        predicted_yield_ton_per_ha=round(mock_prediction, 2),
        model_version="YieldSense_Reg_v1.0.0_mock",
        status="Success"
    )
