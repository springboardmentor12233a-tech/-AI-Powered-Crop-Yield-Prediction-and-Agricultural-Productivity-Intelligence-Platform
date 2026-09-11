from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import logging
import uvicorn
from contextlib import asynccontextmanager

# Import prediction functions
from .prediction import predict_yield, load_pipeline
from .weather_analysis import load_historical_weather_analysis, assess_weather
from .soil_analysis import load_historical_soil_analysis, assess_soil_suitability

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lifespan context manager for startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load the ML pipeline
    logger.info("Loading ML pipeline...")
    load_pipeline()
    logger.info("ML pipeline loaded successfully.")
    
    # Startup: Load the historical weather analysis
    logger.info("Loading historical weather analysis...")
    load_historical_weather_analysis()
    logger.info("Historical weather analysis loaded successfully.")
    
    # Startup: Load the historical soil analysis
    logger.info("Loading historical soil analysis...")
    load_historical_soil_analysis()
    logger.info("Historical soil analysis loaded successfully.")
    
    yield
    # Shutdown logic (if any) can go here
    logger.info("Shutting down API...")

# Initialize FastAPI app
app = FastAPI(
    title="YieldSenseAI API",
    description="Backend API for predicting crop yields based on agricultural data.",
    version="1.0.0",
    lifespan=lifespan
)

# Define Pydantic request model
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

@app.get("/health", summary="Health Check")
def health_check():
    """
    Check if the API is running and healthy.
    """
    return {"status": "healthy"}

@app.post("/predict", summary="Predict Crop Yield")
def predict(request: PredictionRequest):
    """
    Predict crop yield based on provided agricultural data.
    """
    try:
        # Convert request to dictionary, using aliases (e.g., 'soil_moisture_%')
        # We use dict(by_alias=True) or model_dump(by_alias=True) depending on pydantic version.
        if hasattr(request, "model_dump"):
            input_dict = request.model_dump(by_alias=True)
        else:
            input_dict = request.dict(by_alias=True)
        
        # Call the existing prediction pipeline
        predicted_yield = predict_yield(input_dict)
        
        return {
            "predicted_yield_kg_per_hectare": round(float(predicted_yield), 2),
            "unit": "kg/hectare"
        }
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/weather-analysis", summary="Historical Weather Impact Assessment")
def weather_analysis(request: WeatherAnalysisRequest):
    """
    Assess current weather conditions against historical training-data patterns.
    """
    try:
        if hasattr(request, "model_dump"):
            input_dict = request.model_dump(by_alias=True)
        else:
            input_dict = request.dict(by_alias=True)
            
        # Ensure analysis is loaded (should be instant if already cached by lifespan)
        analysis_data = load_historical_weather_analysis()
        
        # Assess
        result = assess_weather(request.crop_type, request.region, input_dict, analysis_data)
        return result
    except Exception as e:
        logger.error(f"Weather analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/soil-analysis", summary="Historical Soil Suitability Assessment")
def soil_analysis(request: SoilAnalysisRequest):
    """
    Assess current soil conditions against historical training-data patterns.
    """
    try:
        if hasattr(request, "model_dump"):
            input_dict = request.model_dump(by_alias=True)
        else:
            input_dict = request.dict(by_alias=True)
            
        # Ensure analysis is loaded (should be instant if already cached by lifespan)
        analysis_data = load_historical_soil_analysis()
        
        # Assess
        result = assess_soil_suitability(request.crop_type, request.region, input_dict, analysis_data)
        return result
    except Exception as e:
        logger.error(f"Soil analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
