"""
YieldSense AI — Yield Prediction Route
POST /predict  — Predict crop yield using the trained ML model
GET  /model-info — Return info about the best trained model
GET  /model-comparison — Return all model comparison results
"""
from fastapi import APIRouter, HTTPException, Depends
import sys, os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.schemas import PredictRequest, PredictResponse
from ml.predictor import predict_yield, get_model_info, get_comparison_table
from auth_utils import get_current_user

router = APIRouter(prefix="", tags=["Prediction"])


@router.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest, current_user=Depends(get_current_user)):
    """
    Predict crop yield (kg/acre) given agricultural parameters.
    Requires authentication.
    """
    try:
        input_data = {
            "crop": payload.crop,
            "rainfall_mm": payload.rainfall_mm,
            "temperature_c": payload.temperature_c,
            "fertilizer_used": payload.fertilizer_used,
            "irrigation_used": payload.irrigation_used,
            "weather_condition": payload.weather_condition,
            "soil_type": payload.soil_type,
            "region": payload.region,
            "nitrogen": payload.nitrogen,
            "phosphorus": payload.phosphorus,
            "potassium": payload.potassium,
            "soil_ph": payload.soil_ph,
        }
        result = predict_yield(input_data)
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@router.get("/model-info")
def model_info(current_user=Depends(get_current_user)):
    """Return metadata about the best trained model."""
    try:
        return get_model_info()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/model-comparison")
def model_comparison(current_user=Depends(get_current_user)):
    """Return the full model comparison table with all evaluation metrics."""
    try:
        results = get_comparison_table()
        return {"models": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
