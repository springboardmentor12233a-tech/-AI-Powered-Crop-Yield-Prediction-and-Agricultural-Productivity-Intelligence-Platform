"""
YieldSense AI — Productivity & Condition-based Analysis (Milestone 3)
GET /productivity/analysis  — Crop productivity comparison, condition-based yield
"""
from fastapi import APIRouter, Depends
import pandas as pd
import numpy as np
import os, sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from auth_utils import get_current_user

router = APIRouter(prefix="/productivity", tags=["Productivity Analysis"])

_df_cache = None

def _load():
    global _df_cache
    if _df_cache is None:
        root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        _df_cache = pd.read_csv(os.path.join(root, "data", "crop_yield.csv"))
    return _df_cache


@router.get("/analysis")
def productivity_analysis(current_user=Depends(get_current_user)):
    """
    Comprehensive productivity analysis derived from the dataset.
    NOTE: Dataset does not contain real seasonal records.
    Analysis is labelled as 'Condition-based' to accurately reflect data origin.
    """
    df = _load()

    # ─── Overall Stats ────────────────────────────────────────────────────────
    overall = {
        "total_records":         int(len(df)),
        "average_yield":         round(float(df["Yield_kg_per_acre"].mean()), 2),
        "median_yield":          round(float(df["Yield_kg_per_acre"].median()), 2),
        "max_yield":             round(float(df["Yield_kg_per_acre"].max()), 2),
        "min_yield":             round(float(df["Yield_kg_per_acre"].min()), 2),
        "yield_std":             round(float(df["Yield_kg_per_acre"].std()), 2),
    }

    # ─── Crop Productivity ────────────────────────────────────────────────────
    crop_stats = (
        df.groupby("Crop")["Yield_kg_per_acre"]
        .agg(["mean", "median", "max", "min", "std", "count"])
        .round(2)
        .reset_index()
        .rename(columns={"mean": "avg_yield", "median": "median_yield",
                          "max": "max_yield", "min": "min_yield",
                          "std": "std_yield", "count": "records"})
    )
    crop_productivity = crop_stats.to_dict(orient="records")
    sorted_crops = sorted(crop_productivity, key=lambda x: x["avg_yield"], reverse=True)

    # ─── Yield by Weather Condition ───────────────────────────────────────────
    yield_by_weather = (
        df.groupby("Weather_Condition")["Yield_kg_per_acre"]
        .agg(["mean", "count"]).round(2).reset_index()
        .rename(columns={"mean": "avg_yield", "count": "records"})
        .to_dict(orient="records")
    )

    # ─── Yield by Soil Type ───────────────────────────────────────────────────
    yield_by_soil = (
        df.groupby("Soil_Type")["Yield_kg_per_acre"]
        .agg(["mean", "count"]).round(2).reset_index()
        .rename(columns={"mean": "avg_yield", "count": "records"})
        .to_dict(orient="records")
    )

    # ─── Yield by Region ─────────────────────────────────────────────────────
    yield_by_region = (
        df.groupby("Region")["Yield_kg_per_acre"]
        .mean().round(2).reset_index()
        .rename(columns={"Yield_kg_per_acre": "avg_yield"})
        .to_dict(orient="records")
    )

    # ─── Input Impact Analysis ────────────────────────────────────────────────
    fert_impact = df.groupby("Fertilizer_Used")["Yield_kg_per_acre"].mean().round(2).to_dict()
    irrig_impact = df.groupby("Irrigation_Used")["Yield_kg_per_acre"].mean().round(2).to_dict()
    fert_gain = round(fert_impact.get(1, 0) - fert_impact.get(0, 0), 2)
    irrig_gain = round(irrig_impact.get(1, 0) - irrig_impact.get(0, 0), 2)

    # ─── Rainfall Bracket Analysis ────────────────────────────────────────────
    df2 = df.copy()
    df2["Rainfall_Bracket"] = pd.cut(
        df2["Rainfall_mm"],
        bins=[0, 400, 700, 1000, 1400, 9999],
        labels=["<400 mm", "400-700 mm", "700-1000 mm", "1000-1400 mm", ">1400 mm"]
    )
    yield_by_rainfall = (
        df2.groupby("Rainfall_Bracket", observed=True)["Yield_kg_per_acre"]
        .mean().round(2).reset_index()
        .rename(columns={"Rainfall_Bracket": "bracket", "Yield_kg_per_acre": "avg_yield"})
        .to_dict(orient="records")
    )

    return {
        "note": (
            "This dataset is programmatically generated. "
            "Analysis is condition-based (not real seasonal records)."
        ),
        "overall_statistics":    overall,
        "highest_yielding_crop": sorted_crops[0]["Crop"] if sorted_crops else "N/A",
        "lowest_yielding_crop":  sorted_crops[-1]["Crop"] if sorted_crops else "N/A",
        "crop_productivity":     sorted_crops,
        "yield_by_weather_condition": yield_by_weather,
        "yield_by_soil_type":    yield_by_soil,
        "yield_by_region":       yield_by_region,
        "agricultural_input_impact": {
            "fertilizer": {
                "with_fertilizer":    fert_impact.get(1),
                "without_fertilizer": fert_impact.get(0),
                "avg_yield_gain_kg_per_acre": fert_gain,
            },
            "irrigation": {
                "with_irrigation":    irrig_impact.get(1),
                "without_irrigation": irrig_impact.get(0),
                "avg_yield_gain_kg_per_acre": irrig_gain,
            },
        },
        "yield_by_rainfall_bracket": yield_by_rainfall,
    }
