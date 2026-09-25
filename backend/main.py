from pathlib import Path
from datetime import date
from uuid import UUID, uuid4
import json

import numpy as np
import pandas as pd
from catboost import CatBoostRegressor
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, ValidationError
from fastapi.responses import JSONResponse, Response

from analytics import grouped_average, serialize_rows, summarize
from database import (
    ensure_schema,
    fetch_prediction,
    fetch_predictions,
    insert_prediction,
    fetch_analytics_options,
)
from recommendations import generate_recommendations
from risk import calculate_risk

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


class RecommendationRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    crop: str
    state: str
    district: str | None = None
    season: str
    predictedYield: float | str | None = None
    prediction_id: str | None = None
    weather: dict | str | None = None
    soil: dict | str | None = None
    weatherAnalysis: dict | None = None
    soilAnalysis: dict | None = None
    detectedRisks: list[str] = []


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


def _safe_context(request):
    values = request.model_dump()
    return values


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

    predicted_yield = max(0.0, prediction)
    prediction_id = str(uuid4())
    record = {
        "prediction_id": prediction_id,
        "crop": values["Crop"],
        "state": values["State"],
        "district": values.get("District"),
        "season": values["Season"],
        "year": int(values["Year"]),
        "predicted_yield": predicted_yield,
        "context": values,
    }
    persistence_error = None
    try:
        ensure_schema()
        insert_prediction(record)
    except Exception as error:
        print("PERSISTENCE ERROR:", error)
        persistence_error = str(error)

    response = {
        "predicted_yield": predicted_yield,
        "unit": "metric tons/hectare",
        "prediction_id": str(prediction_id),
    }
    if persistence_error:
        response["persistence_warning"] = "Prediction generated but could not be persisted."
    return response


def _filters(crop=None, state=None, season=None, year=None):
    return {key: value for key, value in {"crop": crop, "state": state, "season": season, "year": year}.items() if value not in (None, "")}


@app.get("/api/analytics/summary")
def analytics_summary(crop: str | None = None, state: str | None = None, season: str | None = None, year: int | None = None):
    try:
        return summarize(fetch_predictions(_filters(crop, state, season, year)))
    except Exception as error:
        raise HTTPException(status_code=503, detail="Analytics data is unavailable.") from error


@app.get("/api/analytics/history")
def analytics_history(crop: str | None = None, state: str | None = None, season: str | None = None, year: int | None = None):
    try:
        return {"items": serialize_rows(fetch_predictions(_filters(crop, state, season, year)))}
    except Exception as error:
        raise HTTPException(status_code=503, detail="Prediction history is unavailable.") from error


@app.get("/api/analytics/crops")
def analytics_crops(crop: str | None = None, state: str | None = None, season: str | None = None, year: int | None = None):
    try:
        return {"items": grouped_average(fetch_predictions(_filters(crop, state, season, year)), "crop")}
    except Exception as error:
        raise HTTPException(status_code=503, detail="Crop analytics are unavailable.") from error


@app.get("/api/analytics/seasons")
def analytics_seasons(crop: str | None = None, state: str | None = None, season: str | None = None, year: int | None = None):
    try:
        return {"items": grouped_average(fetch_predictions(_filters(crop, state, season, year)), "season")}
    except Exception as error:
        raise HTTPException(status_code=503, detail="Season analytics are unavailable.") from error

@app.get("/api/analytics/options")
def analytics_options():
    try:
        return fetch_analytics_options()
    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail="Analytics options are unavailable."
        ) from error
    
@app.post("/api/recommendations")
def recommendations(request: RecommendationRequest):
    try:
        return generate_recommendations(_safe_context(request))
    except Exception as error:
        print("RECOMMENDATION ERROR:", error)
        raise HTTPException(status_code=502, detail="Unable to generate recommendations.") from error


@app.get("/api/reports/summary")
def report_summary(crop: str | None = None, state: str | None = None, season: str | None = None, year: int | None = None):
    try:
        rows = fetch_predictions(_filters(crop, state, season, year))
        summary = summarize(rows)
        return {"generated_at": date.today().isoformat(), "summary": summary, "crops": grouped_average(rows, "crop"), "seasons": grouped_average(rows, "season"), "history": serialize_rows(rows)}
    except Exception as error:
        raise HTTPException(status_code=503, detail="Report data is unavailable.") from error


@app.get("/api/reports/pdf")
def report_pdf(
    crop: str | None = None,
    state: str | None = None,
    season: str | None = None,
    year: int | None = None
):
    try:
        report = report_summary(crop, state, season, year)

        lines = [
            "YieldSense AI - Milestone 3 Report",
            f"Report date: {report['generated_at']}",
            "",
            "SUMMARY",
            f"Average yield: {report['summary']['average_yield']:.2f} t/ha",
            f"Highest yield: {report['summary']['highest_yield']:.2f} t/ha",
            f"Lowest yield: {report['summary']['lowest_yield']:.2f} t/ha",
            "",
            "CROP PRODUCTIVITY",
            *[
                f"{item['name']}: {item['average_yield']:.2f} t/ha"
                for item in report["crops"]
            ],
            "",
            "SEASONAL PRODUCTIVITY",
            *[
                f"{item['name']}: {item['average_yield']:.2f} t/ha"
                for item in report["seasons"]
            ],
        ]

        # Escape PDF special characters
        def escape_pdf_text(text):
            return (
                str(text)
                .replace("\\", "\\\\")
                .replace("(", "\\(")
                .replace(")", "\\)")
            )

        # Create one PDF text command per line
        content_lines = [
            "BT",
            "/F1 12 Tf",
            "50 750 Td",
        ]

        for index, line in enumerate(lines):
            if line:
                content_lines.append(f"({escape_pdf_text(line)}) Tj")

            if index < len(lines) - 1:
                content_lines.append("0 -18 Td")

        content_lines.append("ET")

        stream = "\n".join(content_lines).encode("latin-1", "replace")

        objects = [
            b"<< /Type /Catalog /Pages 2 0 R >>",

            b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",

            b"<< /Type /Page /Parent 2 0 R "
            b"/MediaBox [0 0 612 792] "
            b"/Resources << /Font << /F1 4 0 R >> >> "
            b"/Contents 5 0 R >>",

            b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",

            f"<< /Length {len(stream)} >>\nstream\n".encode()
            + stream
            + b"\nendstream",
        ]

        pdf = b"%PDF-1.4\n"
        offsets = []

        for index, obj in enumerate(objects, 1):
            offsets.append(len(pdf))
            pdf += f"{index} 0 obj\n".encode()
            pdf += obj
            pdf += b"\nendobj\n"

        xref = len(pdf)

        pdf += (
            f"xref\n0 {len(objects) + 1}\n"
            "0000000000 65535 f \n"
        ).encode()

        pdf += b"".join(
            f"{offset:010d} 00000 n \n".encode()
            for offset in offsets
        )

        pdf += (
            f"trailer\n"
            f"<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
            f"startxref\n{xref}\n"
            f"%%EOF"
        ).encode()

        return Response(
            content=pdf,
            media_type="application/pdf",
            headers={
                "Content-Disposition":
                    "attachment; filename=yieldsense-report.pdf"
            },
        )

    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail="PDF report is unavailable."
        ) from error