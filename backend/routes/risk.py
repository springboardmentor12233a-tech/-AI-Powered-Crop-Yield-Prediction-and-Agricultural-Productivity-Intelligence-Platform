"""
YieldSense AI — Agricultural Risk Assessment (Milestone 3)
POST /risk/assess  — Analyze farm inputs and return risk level + factors
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
import pandas as pd
import os, sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from auth_utils import get_current_user

router = APIRouter(prefix="/risk", tags=["Risk Assessment"])

_df_cache = None

def _load():
    global _df_cache
    if _df_cache is None:
        root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        _df_cache = pd.read_csv(os.path.join(root, "data", "crop_yield.csv"))
    return _df_cache


class RiskRequest(BaseModel):
    crop:              str
    rainfall_mm:       float
    temperature_c:     float
    weather_condition: str
    soil_type:         str
    nitrogen:          float
    phosphorus:        float
    potassium:         float
    soil_ph:           float
    fertilizer_used:   int
    irrigation_used:   int


def _risk_item(factor: str, level: str, description: str) -> dict:
    return {"factor": factor, "risk_level": level, "description": description}


@router.post("/assess")
def risk_assessment(req: RiskRequest, current_user=Depends(get_current_user)):
    """
    Assess agricultural risk based on user-provided farm conditions.
    Rules are derived from dataset-observed ranges and standard agronomic thresholds.
    """
    df = _load()
    risks: List[dict] = []
    high_count = 0
    medium_count = 0

    # ─── Rainfall ─────────────────────────────────────────────────────────────
    if req.rainfall_mm < 300:
        risks.append(_risk_item("Rainfall", "High",
            f"Very low rainfall ({req.rainfall_mm} mm) is critically below the dataset average (~896 mm). "
            "Severe drought stress expected. Irrigation is strongly recommended."))
        high_count += 1
    elif req.rainfall_mm < 600:
        risks.append(_risk_item("Rainfall", "Medium",
            f"Low rainfall ({req.rainfall_mm} mm). Below the dataset average (~896 mm). "
            "Supplemental irrigation is advisable."))
        medium_count += 1
    elif req.rainfall_mm > 1800:
        risks.append(_risk_item("Rainfall", "Medium",
            f"Very high rainfall ({req.rainfall_mm} mm). Risk of waterlogging, root rot, and disease."))
        medium_count += 1
    else:
        risks.append(_risk_item("Rainfall", "Low",
            f"Rainfall ({req.rainfall_mm} mm) is within a reasonable range."))

    # ─── Temperature ──────────────────────────────────────────────────────────
    if req.temperature_c > 40:
        risks.append(_risk_item("Temperature", "High",
            f"Extreme heat ({req.temperature_c}°C). Most crops experience heat stress above 38°C. "
            "Significant yield reduction is likely."))
        high_count += 1
    elif req.temperature_c > 35:
        risks.append(_risk_item("Temperature", "Medium",
            f"High temperature ({req.temperature_c}°C). May reduce yield for heat-sensitive crops."))
        medium_count += 1
    elif req.temperature_c < 12:
        risks.append(_risk_item("Temperature", "High",
            f"Very low temperature ({req.temperature_c}°C). Cold stress can damage most crops."))
        high_count += 1
    else:
        risks.append(_risk_item("Temperature", "Low",
            f"Temperature ({req.temperature_c}°C) is within the acceptable range."))

    # ─── Weather Condition ────────────────────────────────────────────────────
    if req.weather_condition == "Stormy":
        risks.append(_risk_item("Weather Condition", "High",
            "Stormy conditions significantly reduce yield (-300 kg/acre on average in the dataset). "
            "Physical crop damage, waterlogging, and harvest difficulties are possible."))
        high_count += 1
    elif req.weather_condition == "Windy":
        risks.append(_risk_item("Weather Condition", "Medium",
            "Windy conditions reduce yield (~-120 kg/acre in the dataset). Soil erosion and crop lodging are possible."))
        medium_count += 1
    else:
        risks.append(_risk_item("Weather Condition", "Low",
            f"{req.weather_condition} conditions are generally favorable or neutral."))

    # ─── Soil pH ──────────────────────────────────────────────────────────────
    if req.soil_ph < 5.0:
        risks.append(_risk_item("Soil pH", "High",
            f"Very acidic soil (pH {req.soil_ph}). Severe nutrient unavailability and aluminum toxicity risk."))
        high_count += 1
    elif req.soil_ph < 5.5:
        risks.append(_risk_item("Soil pH", "Medium",
            f"Acidic soil (pH {req.soil_ph}). Nutrient availability may be reduced. Liming may help."))
        medium_count += 1
    elif req.soil_ph > 8.0:
        risks.append(_risk_item("Soil pH", "High",
            f"Highly alkaline soil (pH {req.soil_ph}). Iron, manganese, and zinc deficiency risk."))
        high_count += 1
    elif req.soil_ph > 7.5:
        risks.append(_risk_item("Soil pH", "Medium",
            f"Slightly alkaline soil (pH {req.soil_ph}). Monitor micronutrient availability."))
        medium_count += 1
    else:
        risks.append(_risk_item("Soil pH", "Low",
            f"Soil pH ({req.soil_ph}) is near optimal (5.5–7.5) for most crops."))

    # ─── Nitrogen ─────────────────────────────────────────────────────────────
    if req.nitrogen < 40:
        risks.append(_risk_item("Nitrogen", "High",
            f"Very low nitrogen ({req.nitrogen} kg/ha). Severe vegetative growth limitation expected."))
        high_count += 1
    elif req.nitrogen < 60:
        risks.append(_risk_item("Nitrogen", "Medium",
            f"Low nitrogen ({req.nitrogen} kg/ha). Below the dataset average (~90 kg/ha). Yield may be suboptimal."))
        medium_count += 1
    else:
        risks.append(_risk_item("Nitrogen", "Low",
            f"Nitrogen ({req.nitrogen} kg/ha) is adequate."))

    # ─── Phosphorus ───────────────────────────────────────────────────────────
    if req.phosphorus < 20:
        risks.append(_risk_item("Phosphorus", "High",
            f"Very low phosphorus ({req.phosphorus} kg/ha). Root development and flowering may be impaired."))
        high_count += 1
    elif req.phosphorus < 35:
        risks.append(_risk_item("Phosphorus", "Medium",
            f"Low phosphorus ({req.phosphorus} kg/ha). May limit root and reproductive growth."))
        medium_count += 1
    else:
        risks.append(_risk_item("Phosphorus", "Low",
            f"Phosphorus ({req.phosphorus} kg/ha) is adequate."))

    # ─── Potassium ────────────────────────────────────────────────────────────
    if req.potassium < 30:
        risks.append(_risk_item("Potassium", "High",
            f"Very low potassium ({req.potassium} kg/ha). Drought resistance and grain quality may suffer."))
        high_count += 1
    elif req.potassium < 45:
        risks.append(_risk_item("Potassium", "Medium",
            f"Low potassium ({req.potassium} kg/ha). Below typical levels in the dataset."))
        medium_count += 1
    else:
        risks.append(_risk_item("Potassium", "Low",
            f"Potassium ({req.potassium} kg/ha) is adequate."))

    # ─── Fertilizer ───────────────────────────────────────────────────────────
    if req.fertilizer_used == 0:
        fert_impact = df.groupby("Fertilizer_Used")["Yield_kg_per_acre"].mean().to_dict()
        gain = round(fert_impact.get(1, 0) - fert_impact.get(0, 0), 1)
        risks.append(_risk_item("Fertilizer", "Medium",
            f"No fertilizer used. Dataset shows fertilizer application is associated with "
            f"+{gain} kg/acre higher yield on average."))
        medium_count += 1
    else:
        risks.append(_risk_item("Fertilizer", "Low", "Fertilizer is being used."))

    # ─── Irrigation ───────────────────────────────────────────────────────────
    if req.irrigation_used == 0 and req.rainfall_mm < 700:
        irrig_impact = df.groupby("Irrigation_Used")["Yield_kg_per_acre"].mean().to_dict()
        gain = round(irrig_impact.get(1, 0) - irrig_impact.get(0, 0), 1)
        risks.append(_risk_item("Irrigation", "High",
            f"No irrigation with low rainfall ({req.rainfall_mm} mm). "
            f"Irrigation is associated with +{gain} kg/acre in the dataset. High drought risk."))
        high_count += 1
    elif req.irrigation_used == 0:
        risks.append(_risk_item("Irrigation", "Low",
            f"No irrigation, but rainfall ({req.rainfall_mm} mm) may be sufficient."))
    else:
        risks.append(_risk_item("Irrigation", "Low", "Irrigation is being used."))

    # ─── Soil Type ────────────────────────────────────────────────────────────
    soil_yield = df.groupby("Soil_Type")["Yield_kg_per_acre"].mean().to_dict()
    if req.soil_type in soil_yield:
        avg_soil = round(soil_yield[req.soil_type], 1)
        best_soil = max(soil_yield, key=soil_yield.get)
        if avg_soil < df["Yield_kg_per_acre"].mean() * 0.90:
            risks.append(_risk_item("Soil Type", "Medium",
                f"{req.soil_type} soil averages {avg_soil} kg/acre in the dataset, "
                f"below the overall average ({round(df['Yield_kg_per_acre'].mean(), 1)} kg/acre). "
                f"{best_soil} soil shows the highest average yield."))
            medium_count += 1
        else:
            risks.append(_risk_item("Soil Type", "Low",
                f"{req.soil_type} soil averages {avg_soil} kg/acre in the dataset."))

    # ─── Overall Risk Level ───────────────────────────────────────────────────
    if high_count >= 3:
        overall_risk = "High"
    elif high_count >= 1 or medium_count >= 3:
        overall_risk = "Medium"
    else:
        overall_risk = "Low"

    high_risks   = [r for r in risks if r["risk_level"] == "High"]
    medium_risks = [r for r in risks if r["risk_level"] == "Medium"]
    low_risks    = [r for r in risks if r["risk_level"] == "Low"]

    return {
        "crop":              req.crop,
        "overall_risk_level": overall_risk,
        "high_risk_count":   high_count,
        "medium_risk_count": medium_count,
        "risk_summary":      f"{high_count} High, {medium_count} Medium, {len(low_risks)} Low risk factors identified.",
        "high_risks":        high_risks,
        "medium_risks":      medium_risks,
        "low_risks":         low_risks,
        "all_risk_factors":  risks,
        "disclaimer":        (
            "Risk assessment is based on agronomic thresholds and dataset patterns. "
            "This is not financial, medical, or legal advice. "
            "Consult local agricultural experts for farm-specific guidance."
        ),
    }
