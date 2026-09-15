from pydantic import BaseModel, Field
from typing import Optional

class PredictionRequest(BaseModel):
    state: str = Field(..., example="Punjab", description="State or region name")
    crop: str = Field(..., example="Wheat", description="Crop type")
    season: str = Field(..., example="Rabi", description="Agricultural season")
    area: float = Field(..., example=50.0, description="Farm area in hectares")
    rainfall: float = Field(..., example=650.0, description="Annual rainfall in mm")
    temperature: float = Field(..., example=22.0, description="Average temperature in Celsius")
    fertilizer: Optional[float] = Field(120.0, description="Fertilizer usage in kg/ha")
    pesticide: Optional[float] = Field(1.5, description="Pesticide usage in kg/ha")

class PredictionResponse(BaseModel):
    yield_per_hectare: float = Field(..., description="Estimated yield in Tonnes per Hectare")
    total_production: float = Field(..., description="Estimated total production in Tonnes")
    confidence: float = Field(..., description="Prediction confidence score percentage")
    risk_level: str = Field(..., description="Climate and environmental risk level")
    advisory: str = Field(..., description="AI optimization advisory for farming strategy")
