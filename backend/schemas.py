from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    Year: int = Field(..., ge=1900, le=2100)

    State_Name: str = Field(..., min_length=1)
    Dist_Name: str = Field(..., min_length=1)
    Crop: str = Field(..., min_length=1)

    Area: float = Field(..., gt=0)

    Previous_Year_Yield: float = Field(..., ge=0)
    Previous_Year_Area: float = Field(..., ge=0)
    Previous_Year_Production: float = Field(..., ge=0)


class PredictionResponse(BaseModel):
    success: bool

    Year: int
    State_Name: str
    Dist_Name: str
    Crop: str

    predicted_yield: float
    unit: str = "Kg per ha"

    model: str

    ai_analysis: str