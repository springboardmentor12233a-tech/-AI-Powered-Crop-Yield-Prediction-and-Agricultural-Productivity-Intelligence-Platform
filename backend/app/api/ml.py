from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
import logging
import logging

from backend.prediction import predict_yield
from backend.weather_analysis import assess_weather, load_historical_weather_analysis
from backend.soil_analysis import assess_soil_suitability, load_historical_soil_analysis
from backend.agricultural_report import generate_agricultural_report
from backend.llm_insights import generate_llm_insights
from backend.app.api.auth import get_current_user
from backend.app.database.connection import get_db
from sqlalchemy.orm import Session
from backend.app.models.prediction_history import PredictionHistory

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

# ==========================================
# SCHEMAS
# ==========================================

class PredictionRequest(BaseModel):
    region: str = Field(..., description="Geographical region (e.g., 'Central USA')")
    crop_type: str = Field(..., description="Type of crop (e.g., 'Maize')")
    irrigation_type: str = Field("Unknown", description="Type of irrigation used")
    fertilizer_type: str = Field(..., description="Type of fertilizer used")
    crop_disease_status: str = Field("Unknown", description="Current disease status of the crop")
    soil_moisture_percent: float = Field(..., alias="soil_moisture_%", description="Soil moisture percentage")
    soil_pH: float = Field(..., description="Soil pH level")
    temperature_C: float = Field(..., description="Average temperature in Celsius")
    rainfall_mm: float = Field(..., description="Total rainfall in mm")
    humidity_percent: float = Field(..., alias="humidity_%", description="Humidity percentage")
    sunlight_hours: float = Field(..., description="Average sunlight hours per day")
    pesticide_usage_ml: float = Field(..., description="Pesticide usage in ml")
    total_days: int = Field(..., description="Total days for the crop cycle")
    latitude: float = Field(..., description="Latitude of the location")
    longitude: float = Field(..., description="Longitude of the location")
    NDVI_index: float = Field(..., description="Normalized Difference Vegetation Index")
    sowing_date: str = Field(..., description="Date of sowing (YYYY-MM-DD)")
    observation_date: str = Field(..., description="Date of observation (YYYY-MM-DD)")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "region": "Central USA",
                "crop_type": "Maize",
                "irrigation_type": "Drip",
                "fertilizer_type": "Inorganic",
                "crop_disease_status": "Mild",
                "soil_moisture_%": 35.5,
                "soil_pH": 6.8,
                "temperature_C": 24.5,
                "rainfall_mm": 120.0,
                "humidity_%": 65.0,
                "sunlight_hours": 8.5,
                "pesticide_usage_ml": 250.0,
                "total_days": 120,
                "latitude": 40.7,
                "longitude": -95.0,
                "NDVI_index": 0.65,
                "sowing_date": "2024-04-15",
                "observation_date": "2024-06-15"
            }
        }

class WeatherAnalysisRequest(BaseModel):
    crop_type: str = Field(..., description="Type of crop (e.g., 'Maize')")
    region: str = Field(..., description="Geographical region (e.g., 'Central USA')")
    temperature_C: float = Field(..., description="Average temperature in Celsius")
    rainfall_mm: float = Field(..., description="Total rainfall in mm")
    humidity_percent: float = Field(..., alias="humidity_%", description="Humidity percentage")
    sunlight_hours: float = Field(..., description="Average sunlight hours per day")
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "crop_type": "Maize",
                "region": "Central USA",
                "temperature_C": 24.5,
                "rainfall_mm": 120.0,
                "humidity_%": 65.0,
                "sunlight_hours": 8.5
            }
        }

class SoilAnalysisRequest(BaseModel):
    crop_type: str = Field(..., description="Type of crop (e.g., 'Maize')")
    region: str = Field(..., description="Geographical region (e.g., 'Central USA')")
    soil_moisture_percent: float = Field(..., alias="soil_moisture_%", description="Soil moisture percentage")
    soil_pH: float = Field(..., description="Soil pH level")
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "crop_type": "Maize",
                "region": "Central USA",
                "soil_moisture_%": 26.5,
                "soil_pH": 6.5
            }
        }

class AgriculturalReportRequest(PredictionRequest):
    pass

class ChatRequest(BaseModel):
    message: str = Field(..., description="User message")
    context: Optional[dict] = Field(None, description="Agricultural context for the LLM")

# ==========================================
# ENDPOINTS
# ==========================================

@router.post("/predict", summary="Predict Crop Yield")
def predict(request: PredictionRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        if hasattr(request, "model_dump"):
            input_dict = request.model_dump(by_alias=True)
        else:
            input_dict = request.dict(by_alias=True)
            
        predicted_yield = float(predict_yield(input_dict))
        
        # Save to database
        history_record = PredictionHistory(
            user_id=current_user.id,
            region=input_dict.get("region", "Unknown"),
            crop_type=input_dict.get("crop_type", "Unknown"),
            input_data=input_dict,
            predicted_yield=predicted_yield
        )
        db.add(history_record)
        db.commit()
        
        return {
            "predicted_yield_kg_per_hectare": round(predicted_yield, 2),
            "unit": "kg/hectare"
        }
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/weather-analysis", summary="Historical Weather Impact Assessment")
def weather_analysis(request: WeatherAnalysisRequest, current_user=Depends(get_current_user)):
    try:
        if hasattr(request, "model_dump"):
            input_dict = request.model_dump(by_alias=True)
        else:
            input_dict = request.dict(by_alias=True)
            
        analysis_data = load_historical_weather_analysis()
        result = assess_weather(request.crop_type, request.region, input_dict, analysis_data)
        return result
    except Exception as e:
        logger.error(f"Weather analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/soil-analysis", summary="Historical Soil Suitability Assessment")
def soil_analysis(request: SoilAnalysisRequest, current_user=Depends(get_current_user)):
    try:
        if hasattr(request, "model_dump"):
            input_dict = request.model_dump(by_alias=True)
        else:
            input_dict = request.dict(by_alias=True)
            
        analysis_data = load_historical_soil_analysis()
        result = assess_soil_suitability(request.crop_type, request.region, input_dict, analysis_data)
        return result
    except Exception as e:
        logger.error(f"Soil analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/agricultural-report", summary="Structured Agricultural Forecast Report")
def agricultural_report(request: AgriculturalReportRequest, current_user=Depends(get_current_user)):
    try:
        if hasattr(request, "model_dump"):
            input_dict = request.model_dump(by_alias=True)
        else:
            input_dict = request.dict(by_alias=True)
            
        report = generate_agricultural_report(input_dict)
        return report
    except Exception as e:
        logger.error(f"Agricultural report error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/llm-insights", summary="LLM-Powered Agricultural Insights")
def llm_insights(request: AgriculturalReportRequest, current_user=Depends(get_current_user)):
    try:
        if hasattr(request, "model_dump"):
            input_dict = request.model_dump(by_alias=True)
        else:
            input_dict = request.dict(by_alias=True)
            
        base_report = generate_agricultural_report(input_dict)
        insights = generate_llm_insights(base_report)
        return insights
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"LLM insights error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history", summary="Get User Prediction History")
def get_prediction_history(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        history = db.query(PredictionHistory).filter(PredictionHistory.user_id == current_user.id).order_by(PredictionHistory.created_at.desc()).all()
        return [
            {
                "id": record.id,
                "region": record.region,
                "crop_type": record.crop_type,
                "predicted_yield": record.predicted_yield,
                "created_at": record.created_at,
                "input_data": record.input_data
            }
            for record in history
        ]
    except Exception as e:
        logger.error(f"Error fetching history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat", summary="AI Agricultural Assistant")
def chat_with_assistant(request: ChatRequest, current_user=Depends(get_current_user)):
    try:
        # Instead of generic response, we integrate with LLM using the provided context
        from backend.llm_insights import chat_with_llm
        
        system_prompt = (
            "You are an expert Agricultural AI Assistant for YieldSense AI. "
            "Answer the farmer's question clearly and accurately using the provided context. "
            "Do NOT fabricate any metrics, accuracies (e.g. 92%), or project statistics. "
        )
        if request.context:
            system_prompt += (
                f"\n\nContext based on their latest data:\n{request.context}\n\n"
                "If the user asks about their prediction, provide a structured response approximately like this (use markdown):\n"
                "### Prediction Summary\n"
                "- Crop: [Crop]\n"
                "- Region: [Region]\n"
                "- Predicted Yield: [Yield] kg/ha\n\n"
                "### Weather\n"
                "- Temperature: [Temp]°C\n"
                "- Rainfall: [Rainfall] mm\n"
                "- Humidity: [Humidity]%\n"
                "- Sunlight: [Sunlight] hours/day\n\n"
                "### Soil\n"
                "- Moisture: [Moisture]%\n"
                "- pH: [pH]\n"
                "- NDVI: [NDVI]\n\n"
                "### Interpretation\n"
                "[Short interpretation of the yield based on conditions]\n\n"
                "### Recommendations\n"
                "- [Recommendation 1]\n"
                "- [Recommendation 2]"
            )
        else:
            system_prompt += (
                "\n\nNo prediction data is currently available for this user. "
                "If they ask about their prediction, weather, soil, or recommendations, "
                "you MUST respond EXACTLY with: 'No prediction context exists yet. Please run a Yield Prediction first.'"
            )
            
        prompt = f"{system_prompt}\n\nFarmer: {request.message}\nAssistant:"
        
        reply = chat_with_llm(prompt)
        
        return {"reply": reply}
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get AI response")
