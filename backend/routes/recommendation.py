"""
YieldSense AI — Crop Recommendation (Milestone 3)
POST /recommendation/crop  — Recommend the best crop for given conditions
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
import pandas as pd
import numpy as np
import os, sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from auth_utils import get_current_user

router = APIRouter(prefix="/recommendation", tags=["Crop Recommendation"])

_df_cache = None

def _load():
    global _df_cache
    if _df_cache is None:
        root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        _df_cache = pd.read_csv(os.path.join(root, "data", "crop_yield.csv"))
    return _df_cache


class RecommendRequest(BaseModel):
    region:            str
    rainfall_mm:       float
    temperature_c:     float
    weather_condition: str
    soil_type:         str
    nitrogen:          float
    phosphorus:        float
    potassium:         float
    soil_ph:           float
    fertilizer_used:   int   # 0 or 1
    irrigation_used:   int   # 0 or 1


def _score_crop(df, crop, req) -> dict:
    """
    Score a crop for given conditions using dataset similarity.
    Uses weighted similarity across soil_type, weather_condition, region,
    fertilizer/irrigation match, and rainfall/temperature proximity.
    """
    sub = df[df["Crop"] == crop].copy()
    if sub.empty:
        return {"score": 0, "avg_yield": 0, "records": 0}

    # Filter by exact categorical matches (optional — keeps all if none match)
    soil_match   = sub[sub["Soil_Type"] == req.soil_type]
    weather_match = sub[sub["Weather_Condition"] == req.weather_condition]
    region_match  = sub[sub["Region"] == req.region]
    fert_match    = sub[sub["Fertilizer_Used"] == req.fertilizer_used]
    irrig_match   = sub[sub["Irrigation_Used"] == req.irrigation_used]

    # Narrow to matching conditions; fall back to all records for this crop
    best_match = soil_match[
        (soil_match["Weather_Condition"] == req.weather_condition) &
        (soil_match["Region"] == req.region) &
        (soil_match["Fertilizer_Used"] == req.fertilizer_used) &
        (soil_match["Irrigation_Used"] == req.irrigation_used)
    ]
    if len(best_match) < 3:
        # Relax to soil + weather
        best_match = sub[
            (sub["Soil_Type"] == req.soil_type) &
            (sub["Weather_Condition"] == req.weather_condition)
        ]
    if len(best_match) < 3:
        best_match = sub  # fall back to all records for this crop

    avg_yield = round(float(best_match["Yield_kg_per_acre"].mean()), 2)

    # Rainfall proximity penalty: normalise deviation
    rain_dev = abs(best_match["Rainfall_mm"].mean() - req.rainfall_mm)
    temp_dev  = abs(best_match["Temperature_C"].mean() - req.temperature_c)

    # Combined score: high avg yield, low deviation
    score = avg_yield - (rain_dev * 0.1) - (temp_dev * 10)

    # Bonus for matching categorical features
    if not soil_match.empty:   score += 100
    if not weather_match.empty: score += 80
    if not region_match.empty:  score += 60
    if not fert_match.empty:    score += 40
    if not irrig_match.empty:   score += 40

    return {
        "score": round(score, 2),
        "avg_yield": avg_yield,
        "records_matched": int(len(best_match)),
        "total_records": int(len(sub)),
    }


@router.post("/crop")
def recommend_crop(req: RecommendRequest, current_user=Depends(get_current_user)):
    """
    Recommend the most suitable crop for the given agricultural conditions.
    Scoring is based on historical yield data from the dataset — not random.
    """
    df = _load()
    crops = df["Crop"].unique().tolist()

    scores = []
    for crop in crops:
        s = _score_crop(df, crop, req)
        scores.append({
            "crop": crop,
            "score": s["score"],
            "expected_avg_yield_kg_per_acre": s["avg_yield"],
            "records_matched": s["records_matched"],
            "total_crop_records": s["total_records"],
        })

    scores.sort(key=lambda x: x["score"], reverse=True)

    top3 = scores[:3]
    best = top3[0]

    # Build reason string
    reasons = []
    if req.soil_type:
        reasons.append(f"{best['crop']} has historically performed well on {req.soil_type} soil")
    if req.weather_condition:
        reasons.append(f"under {req.weather_condition} weather conditions")
    if req.fertilizer_used:
        reasons.append("with fertilizer application")
    if req.irrigation_used:
        reasons.append("with irrigation support")
    reasons.append(
        f"yielding an average of {best['expected_avg_yield_kg_per_acre']} kg/acre "
        f"across {best['records_matched']} similar records in the dataset"
    )

    return {
        "recommended_crop":                best["crop"],
        "expected_avg_yield_kg_per_acre":  best["expected_avg_yield_kg_per_acre"],
        "recommendation_basis":            ". ".join(reasons) + ".",
        "top_3_recommendations":           top3,
        "all_crop_scores":                 scores,
        "note": (
            "Recommendations are based on historical yield patterns "
            "from the programmatically generated dataset. "
            "Always verify with local agricultural experts."
        ),
    }
