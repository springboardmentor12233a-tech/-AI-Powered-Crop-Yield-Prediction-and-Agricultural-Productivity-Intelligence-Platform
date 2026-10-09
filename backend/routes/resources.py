"""
YieldSense AI — Resource Optimization (Milestone 3)
POST /resources/optimize  — Data-driven fertilizer, irrigation, and NPK recommendations
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
import pandas as pd
import numpy as np
import os, sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from auth_utils import get_current_user

router = APIRouter(prefix="/resources", tags=["Resource Optimization"])

_df_cache = None

def _load():
    global _df_cache
    if _df_cache is None:
        root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        _df_cache = pd.read_csv(os.path.join(root, "data", "crop_yield.csv"))
    return _df_cache


class ResourceRequest(BaseModel):
    crop:            str
    soil_type:       str
    nitrogen:        float
    phosphorus:      float
    potassium:       float
    soil_ph:         float
    rainfall_mm:     float
    fertilizer_used: int   # 0 or 1
    irrigation_used: int   # 0 or 1


def _flag(val, low, high, name, unit):
    """Return a recommendation dict for a numeric value."""
    if val < low:
        return {
            "nutrient": name,
            "current_value": val,
            "unit": unit,
            "status": "Low",
            "optimal_range": f"{low}–{high} {unit}",
            "recommendation": f"{name} is below the typical range. Consider supplementation.",
        }
    elif val > high:
        return {
            "nutrient": name,
            "current_value": val,
            "unit": unit,
            "status": "High",
            "optimal_range": f"{low}–{high} {unit}",
            "recommendation": f"{name} is above the typical range. Monitor for toxicity or runoff.",
        }
    else:
        return {
            "nutrient": name,
            "current_value": val,
            "unit": unit,
            "status": "Optimal",
            "optimal_range": f"{low}–{high} {unit}",
            "recommendation": f"{name} is within the optimal range.",
        }


@router.post("/optimize")
def resource_optimization(req: ResourceRequest, current_user=Depends(get_current_user)):
    """
    Provide data-driven resource optimization recommendations.
    Based on dataset-observed ranges and fertilizer/irrigation impact analysis.
    """
    df = _load()

    # ─── Crop-specific averages ───────────────────────────────────────────────
    crop_df = df[df["Crop"] == req.crop] if req.crop in df["Crop"].values else df

    crop_avg_n  = round(float(crop_df["Nitrogen"].mean()), 1)
    crop_avg_p  = round(float(crop_df["Phosphorus"].mean()), 1)
    crop_avg_k  = round(float(crop_df["Potassium"].mean()), 1)
    crop_avg_ph = round(float(crop_df["Soil_pH"].mean()), 2)

    # ─── Fertilizer impact from dataset ──────────────────────────────────────
    fert_impact = df.groupby("Fertilizer_Used")["Yield_kg_per_acre"].mean().to_dict()
    fert_gain   = round(fert_impact.get(1, 0) - fert_impact.get(0, 0), 2)

    irrig_impact = df.groupby("Irrigation_Used")["Yield_kg_per_acre"].mean().to_dict()
    irrig_gain   = round(irrig_impact.get(1, 0) - irrig_impact.get(0, 0), 2)

    # ─── NPK + pH flags ──────────────────────────────────────────────────────
    nutrient_flags = [
        _flag(req.nitrogen,    60,  120, "Nitrogen",   "kg/ha"),
        _flag(req.phosphorus,  30,   80, "Phosphorus", "kg/ha"),
        _flag(req.potassium,   40,  100, "Potassium",  "kg/ha"),
        _flag(req.soil_ph,     5.5,  7.5, "Soil pH",   ""),
    ]

    # ─── Fertilizer recommendation ────────────────────────────────────────────
    if req.fertilizer_used == 0:
        fert_rec = {
            "current_status": "Not using fertilizer",
            "dataset_finding": f"Fertilizer use is associated with +{fert_gain} kg/acre higher yield on average in the dataset.",
            "recommendation": "Consider applying fertilizer to potentially improve yield." if fert_gain > 0 else "Fertilizer impact is minimal in the dataset.",
        }
    else:
        fert_rec = {
            "current_status": "Using fertilizer",
            "dataset_finding": f"Fertilizer use is associated with +{fert_gain} kg/acre higher yield in the dataset.",
            "recommendation": "Continue fertilizer application. Ensure correct NPK ratio for your crop.",
        }

    # ─── Irrigation recommendation ────────────────────────────────────────────
    if req.irrigation_used == 0:
        irrig_rec = {
            "current_status": "Not using irrigation",
            "dataset_finding": f"Irrigation use is associated with +{irrig_gain} kg/acre higher yield on average.",
            "recommendation": (
                "Consider irrigation especially if rainfall is below 700 mm."
                if req.rainfall_mm < 700 else
                "Irrigation may not be critical given adequate rainfall, but can add stability."
            ),
        }
    else:
        irrig_rec = {
            "current_status": "Using irrigation",
            "dataset_finding": f"Irrigation use is associated with +{irrig_gain} kg/acre higher yield in the dataset.",
            "recommendation": "Continue irrigation management. Monitor soil moisture to avoid overwatering.",
        }

    # ─── Overall optimization score ───────────────────────────────────────────
    issues = [f for f in nutrient_flags if f["status"] != "Optimal"]
    optimization_score = max(0, 100 - len(issues) * 15 - (10 if req.fertilizer_used == 0 else 0) - (10 if req.irrigation_used == 0 else 0))

    return {
        "crop":                     req.crop,
        "optimization_score":       optimization_score,
        "optimization_level":       "Good" if optimization_score >= 70 else "Fair" if optimization_score >= 45 else "Needs Improvement",
        "fertilizer_recommendation":  fert_rec,
        "irrigation_recommendation":  irrig_rec,
        "nutrient_recommendations":   nutrient_flags,
        "crop_typical_npk": {
            "crop":        req.crop,
            "avg_nitrogen":   crop_avg_n,
            "avg_phosphorus": crop_avg_p,
            "avg_potassium":  crop_avg_k,
            "avg_soil_ph":    crop_avg_ph,
            "note":        f"Average NPK and pH values for {req.crop} records in the dataset.",
        },
        "disclaimer": (
            "These recommendations are data-driven observations from the dataset. "
            "They are not guaranteed agricultural advice. Consult a local agronomist."
        ),
    }
