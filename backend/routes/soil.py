"""
YieldSense AI — Soil Analysis Route
GET /soil/analysis — Statistical analysis of soil properties vs. crop yield
"""
from fastapi import APIRouter, HTTPException, Depends
import pandas as pd
import numpy as np
import os, sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from auth_utils import get_current_user

router = APIRouter(prefix="/soil", tags=["Soil Analysis"])

_df_cache = None


def _load_data():
    global _df_cache
    if _df_cache is None:
        base_dir  = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        data_path = os.path.join(base_dir, "data", "crop_yield.csv")
        _df_cache = pd.read_csv(data_path)
    return _df_cache


@router.get("/analysis")
def soil_analysis(current_user=Depends(get_current_user)):
    """
    Return statistical soil analysis from the crop yield dataset.
    Includes NPK stats, pH distribution, and their correlation with yield.
    """
    try:
        df = _load_data()

        # Nutrient statistics
        nitrogen_stats   = df["Nitrogen"].describe().round(2).to_dict()
        phosphorus_stats = df["Phosphorus"].describe().round(2).to_dict()
        potassium_stats  = df["Potassium"].describe().round(2).to_dict()
        ph_stats         = df["Soil_pH"].describe().round(2).to_dict()

        # Average yield by soil type
        yield_by_soil = (
            df.groupby("Soil_Type")["Yield_kg_per_acre"]
            .mean()
            .round(2)
            .to_dict()
        )

        # Best performing soil type
        top_soil = max(yield_by_soil, key=yield_by_soil.get)

        # NPK correlations with yield
        n_corr = round(float(df["Nitrogen"].corr(df["Yield_kg_per_acre"])), 4)
        p_corr = round(float(df["Phosphorus"].corr(df["Yield_kg_per_acre"])), 4)
        k_corr = round(float(df["Potassium"].corr(df["Yield_kg_per_acre"])), 4)
        ph_corr = round(float(df["Soil_pH"].corr(df["Yield_kg_per_acre"])), 4)

        # Average NPK by soil type
        npk_by_soil = (
            df.groupby("Soil_Type")[["Nitrogen", "Phosphorus", "Potassium"]]
            .mean()
            .round(2)
            .to_dict()
        )

        # Soil pH bins
        df["pH_Category"] = pd.cut(
            df["Soil_pH"],
            bins=[0, 5.5, 6.5, 7.5, 14],
            labels=["Acidic (<5.5)", "Slightly Acidic (5.5-6.5)",
                    "Neutral (6.5-7.5)", "Alkaline (>7.5)"],
        )
        yield_by_ph_cat = (
            df.groupby("pH_Category", observed=True)["Yield_kg_per_acre"]
            .mean()
            .round(2)
            .to_dict()
        )

        # Average yield by fertilizer use
        yield_by_fertilizer = (
            df.groupby("Fertilizer_Used")["Yield_kg_per_acre"]
            .mean()
            .round(2)
            .to_dict()
        )

        # Average NPK for high-yield vs low-yield crops
        median_yield = df["Yield_kg_per_acre"].median()
        high_yield_npk = (
            df[df["Yield_kg_per_acre"] >= median_yield][["Nitrogen", "Phosphorus", "Potassium"]]
            .mean()
            .round(2)
            .to_dict()
        )
        low_yield_npk = (
            df[df["Yield_kg_per_acre"] < median_yield][["Nitrogen", "Phosphorus", "Potassium"]]
            .mean()
            .round(2)
            .to_dict()
        )

        return {
            "nitrogen_statistics": nitrogen_stats,
            "phosphorus_statistics": phosphorus_stats,
            "potassium_statistics": potassium_stats,
            "soil_ph_statistics": ph_stats,
            "yield_by_soil_type": yield_by_soil,
            "top_soil_type_by_yield": top_soil,
            "yield_by_ph_category": yield_by_ph_cat,
            "yield_by_fertilizer_used": yield_by_fertilizer,
            "npk_by_soil_type": npk_by_soil,
            "nutrient_yield_correlation": {
                "nitrogen_vs_yield": n_corr,
                "phosphorus_vs_yield": p_corr,
                "potassium_vs_yield": k_corr,
                "soil_ph_vs_yield": ph_corr,
            },
            "high_yield_avg_npk": high_yield_npk,
            "low_yield_avg_npk": low_yield_npk,
            "interpretation": {
                "nitrogen": f"Nitrogen correlation with yield: {n_corr}. Higher N availability generally supports vegetative growth.",
                "phosphorus": f"Phosphorus correlation with yield: {p_corr}. P supports root development and flowering.",
                "potassium": f"Potassium correlation with yield: {k_corr}. K improves drought resistance and fruit quality.",
                "soil_ph": f"Soil pH correlation with yield: {ph_corr}. Most crops prefer slightly acidic to neutral pH (6.0–7.0).",
                "best_soil_type": f"{top_soil} soil shows the highest average yield of {yield_by_soil[top_soil]:.1f} kg/acre.",
            },
            "total_records_analyzed": len(df),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Soil analysis error: {str(e)}")
