"""
YieldSense AI — Weather Analysis Route
GET /weather/analysis — Statistical analysis of weather data vs. crop yield
"""
from fastapi import APIRouter, HTTPException, Depends
import pandas as pd
import numpy as np
import os, sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from auth_utils import get_current_user
from config import get_settings

router = APIRouter(prefix="/weather", tags=["Weather Analysis"])
settings = get_settings()

_df_cache = None


def _load_data():
    global _df_cache
    if _df_cache is None:
        base_dir  = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        data_path = os.path.join(base_dir, "data", "crop_yield.csv")
        _df_cache = pd.read_csv(data_path)
    return _df_cache


@router.get("/analysis")
def weather_analysis(current_user=Depends(get_current_user)):
    """
    Return statistical weather analysis from the crop yield dataset.
    Includes rainfall/temperature stats and their correlation with yield.
    """
    try:
        df = _load_data()

        # Basic weather statistics
        rain_stats = df["Rainfall_mm"].describe().round(2).to_dict()
        temp_stats = df["Temperature_C"].describe().round(2).to_dict()

        # Average yield by weather condition
        yield_by_condition = (
            df.groupby("Weather_Condition")["Yield_kg_per_acre"]
            .mean()
            .round(2)
            .to_dict()
        )

        # Average rainfall by weather condition
        rainfall_by_condition = (
            df.groupby("Weather_Condition")["Rainfall_mm"]
            .mean()
            .round(2)
            .to_dict()
        )

        # Average temperature by crop
        temp_by_crop = (
            df.groupby("Crop")["Temperature_C"]
            .mean()
            .round(2)
            .to_dict()
        )

        # Average yield by crop
        yield_by_crop = (
            df.groupby("Crop")["Yield_kg_per_acre"]
            .mean()
            .round(2)
            .to_dict()
        )

        # Correlations
        rainfall_corr = round(float(df["Rainfall_mm"].corr(df["Yield_kg_per_acre"])), 4)
        temp_corr     = round(float(df["Temperature_C"].corr(df["Yield_kg_per_acre"])), 4)

        # Average yield by irrigation
        yield_irrigation = (
            df.groupby("Irrigation_Used")["Yield_kg_per_acre"]
            .mean()
            .round(2)
            .to_dict()
        )

        # Rainfall bins
        df["Rainfall_Category"] = pd.cut(
            df["Rainfall_mm"],
            bins=[0, 400, 800, 1200, 1600, 5000],
            labels=["Very Low (<400)", "Low (400-800)", "Medium (800-1200)",
                    "High (1200-1600)", "Very High (>1600)"],
        )
        yield_by_rainfall_cat = (
            df.groupby("Rainfall_Category", observed=True)["Yield_kg_per_acre"]
            .mean()
            .round(2)
            .to_dict()
        )

        return {
            "rainfall_statistics": rain_stats,
            "temperature_statistics": temp_stats,
            "yield_by_weather_condition": yield_by_condition,
            "rainfall_by_condition": rainfall_by_condition,
            "temperature_by_crop": temp_by_crop,
            "yield_by_crop": yield_by_crop,
            "yield_by_rainfall_category": yield_by_rainfall_cat,
            "yield_by_irrigation": yield_irrigation,
            "correlations": {
                "rainfall_vs_yield": rainfall_corr,
                "temperature_vs_yield": temp_corr,
            },
            "interpretation": {
                "rainfall": (
                    "Rainfall shows a positive correlation with yield. "
                    f"Correlation coefficient: {rainfall_corr}. "
                    "Higher rainfall generally supports better crop growth."
                ),
                "temperature": (
                    "Temperature shows moderate correlation with yield. "
                    f"Correlation coefficient: {temp_corr}. "
                    "Optimal temperatures vary by crop type."
                ),
            },
            "total_records_analyzed": len(df),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Weather analysis error: {str(e)}")
