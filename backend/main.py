from pathlib import Path

import numpy as np
import pandas as pd
from catboost import CatBoostRegressor
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, ValidationError

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


MODEL_PATH = Path(__file__).resolve().parent / "models" / "yieldsense_final_catboost.cbm"
MODEL_FEATURES = [
    "Year",
    "State",
    "Crop",
    "Season",
    "Area",
    "Annual_Rainfall",
    "Fertilizer",
    "Pesticide",
]
MODEL_ENGINEERED_FEATURES = [
    "Fertilizer_per_Area",
    "Pesticide_per_Area",
    "Crop_Season",
    "Crop_State",
]


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    Year: float = Field(..., finite=True)
    State: str
    District: str | None = None
    Crop: str
    Season: str
    Area: float = Field(..., finite=True)
    Annual_Rainfall: float = Field(..., finite=True)
    Fertilizer: float = Field(..., finite=True)
    Pesticide: float = Field(..., finite=True)


model = CatBoostRegressor()
try:
    model.load_model(str(MODEL_PATH))
except Exception as error:
    model = None
    MODEL_LOAD_ERROR = error
else:
    MODEL_LOAD_ERROR = None


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=400, content={"detail": "Invalid prediction input."})


@app.get("/")
def home():
    return {"message": "YieldSense AI Backend is working!"}


@app.get("/api/test")
def test_api():
    return {"message": "Frontend and Backend are connected!"}


@app.post("/api/predict")
def predict(request: PredictionRequest):
    if MODEL_LOAD_ERROR is not None or model is None:
        raise HTTPException(status_code=500, detail="Prediction model is unavailable.")

    try:
        values = request.model_dump()
        area = values["Area"]
        features = pd.DataFrame([values], columns=MODEL_FEATURES)
        features["Fertilizer_per_Area"] = values["Fertilizer"] / area if area else np.nan
        features["Pesticide_per_Area"] = values["Pesticide"] / area if area else np.nan
        features["Crop_Season"] = f'{values["Crop"]}_{values["Season"]}'
        features["Crop_State"] = f'{values["Crop"]}_{values["State"]}'
        features = features[MODEL_FEATURES + MODEL_ENGINEERED_FEATURES]
        features = features.replace([np.inf, -np.inf], np.nan)
        if features.isna().any().any():
            raise ValueError("Area must be non-zero.")
        prediction = float(model.predict(features)[0])
    except (ValidationError, ValueError, TypeError) as error:
        raise HTTPException(status_code=400, detail=f"Invalid prediction input: {error}") from error
    except Exception as error:
        raise HTTPException(status_code=500, detail="Unable to generate prediction.") from error

    return {
        "predicted_yield": max(0.0, prediction),
        "unit": "metric tons/hectare",
    }