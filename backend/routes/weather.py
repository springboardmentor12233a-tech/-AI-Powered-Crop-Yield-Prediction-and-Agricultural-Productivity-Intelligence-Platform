"""
YieldSense AI — Weather Analysis & Live Weather Router
Endpoints:
- GET /weather/analysis  — Statistical analysis of weather data vs. crop yield
- GET /weather/search    — Geocoding search (Open-Meteo)
- GET /weather/current   — Current weather for lat/lon (Open-Meteo)
- GET /weather/forecast  — 7-day forecast & crop-aware farming recommendations (Open-Meteo)
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
import pandas as pd
import numpy as np
import os, sys, logging
import httpx

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from auth_utils import get_current_user
from config import get_settings
from models.schemas import LocationSearchResult, CurrentWeatherResponse, WeatherForecastResponse

logger = logging.getLogger("yieldsense")
router = APIRouter(prefix="/weather", tags=["Weather"])
settings = get_settings()

_df_cache = None


def _load_data():
    global _df_cache
    if _df_cache is None:
        base_dir  = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        data_path = os.path.join(base_dir, "data", "crop_yield.csv")
        _df_cache = pd.read_csv(data_path)
    return _df_cache


WMO_WEATHER_CODES = {
    0: "Clear Sky",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing Rime Fog",
    51: "Light Drizzle",
    53: "Moderate Drizzle",
    55: "Dense Drizzle",
    61: "Slight Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",
    71: "Slight Snow",
    73: "Moderate Snow",
    75: "Heavy Snow",
    80: "Slight Rain Showers",
    81: "Moderate Rain Showers",
    82: "Violent Rain Showers",
    95: "Thunderstorm",
    96: "Thunderstorm with Hail",
    99: "Thunderstorm with Heavy Hail"
}


def _get_wmo_description(code: int) -> str:
    return WMO_WEATHER_CODES.get(code, "Variable Weather")


def generate_farming_recommendations(
    current_temp: float,
    current_humidity: float,
    current_wind: float,
    daily_forecasts: list,
    crop: Optional[str] = None
) -> list:
    recommendations = []
    crop_name = crop.strip() if crop and crop.strip() else "your crops"

    max_temp_7d = max([d.get("temp_max", current_temp) for d in daily_forecasts], default=current_temp)
    min_temp_7d = min([d.get("temp_min", current_temp) for d in daily_forecasts], default=current_temp)
    total_precip_7d = sum([d.get("precipitation_sum", 0) for d in daily_forecasts])
    max_precip_prob = max([d.get("precip_prob_max", 0) for d in daily_forecasts], default=0)

    # 1. Heavy Rain & Drainage Risk
    if total_precip_7d > 15 or max_precip_prob >= 60:
        recommendations.append({
            "category": "rain",
            "severity": "warning",
            "title": "Rain & Drainage Warning",
            "message": f"Significant rainfall expected ({total_precip_7d:.1f} mm total, up to {max_precip_prob}% chance). Check field drainage to prevent waterlogging around {crop_name}. Postpone fertilizer and pesticide spraying to prevent chemical runoff."
        })

    # 2. Heat Stress Risk
    heat_threshold = 30.0 if crop and crop.lower() in ["wheat", "barley", "potato"] else 34.0
    if max_temp_7d >= heat_threshold:
        recommendations.append({
            "category": "temperature",
            "severity": "warning",
            "title": "Heat Stress Risk",
            "message": f"High temperatures forecasted (up to {max_temp_7d:.1f}°C). Irrigate {crop_name} during early morning or evening to minimize evaporative water loss. Apply mulching to keep root zone cool."
        })

    # 3. High Humidity & Fungal Disease Risk
    if current_humidity >= 75.0 and current_temp >= 20.0:
        recommendations.append({
            "category": "humidity",
            "severity": "warning",
            "title": "Fungal & Pest Risk Alert",
            "message": f"High humidity ({current_humidity:.0f}%) and warm weather create high risk for leaf rust, blight, and fungal outbreaks in {crop_name}. Inspect crop foliage regularly and ensure optimal plant spacing for ventilation."
        })

    # 4. Dry Spell & Irrigation Alert
    if total_precip_7d < 3.0 and max_temp_7d >= 25.0:
        recommendations.append({
            "category": "irrigation",
            "severity": "info",
            "title": "Dry Weather & Irrigation Notice",
            "message": f"Low precipitation expected (< {total_precip_7d:.1f} mm) over the next 7 days. Ensure adequate scheduled irrigation for {crop_name} to maintain soil moisture levels."
        })

    # 5. Wind Hazard
    if current_wind >= 25.0:
        recommendations.append({
            "category": "wind",
            "severity": "warning",
            "title": "Strong Wind Advisory",
            "message": f"Wind speed reaching {current_wind:.1f} km/h. Avoid aerial or broad-spray pesticide application due to drift hazard. Inspect tall crop lodging risks."
        })

    # 6. Cold / Frost Risk
    if min_temp_7d <= 5.0:
        recommendations.append({
            "category": "temperature",
            "severity": "danger",
            "title": "Low Temperature / Frost Warning",
            "message": f"Nighttime temperatures expected to drop to {min_temp_7d:.1f}°C. Sensitive crops like {crop_name} may suffer cold stress. Take protective coverage or light irrigation measures."
        })

    # General Positive Note if zero alerts triggered
    if not recommendations:
        recommendations.append({
            "category": "general",
            "severity": "success",
            "title": "Favorable Farming Conditions",
            "message": f"Current and 7-day forecasted weather conditions are favorable for field operations, planting, and routine growth for {crop_name}."
        })

    return recommendations


@router.get("/analysis")
def weather_analysis(current_user=Depends(get_current_user)):
    """
    Return statistical weather analysis from the crop yield dataset.
    Includes rainfall/temperature stats and their correlation with yield.
    """
    try:
        df = _load_data()

        rain_stats = df["Rainfall_mm"].describe().round(2).to_dict()
        temp_stats = df["Temperature_C"].describe().round(2).to_dict()

        yield_by_condition = (
            df.groupby("Weather_Condition")["Yield_kg_per_acre"]
            .mean()
            .round(2)
            .to_dict()
        )

        rainfall_by_condition = (
            df.groupby("Weather_Condition")["Rainfall_mm"]
            .mean()
            .round(2)
            .to_dict()
        )

        temp_by_crop = (
            df.groupby("Crop")["Temperature_C"]
            .mean()
            .round(2)
            .to_dict()
        )

        yield_by_crop = (
            df.groupby("Crop")["Yield_kg_per_acre"]
            .mean()
            .round(2)
            .to_dict()
        )

        rainfall_corr = round(float(df["Rainfall_mm"].corr(df["Yield_kg_per_acre"])), 4)
        temp_corr     = round(float(df["Temperature_C"].corr(df["Yield_kg_per_acre"])), 4)

        yield_irrigation = (
            df.groupby("Irrigation_Used")["Yield_kg_per_acre"]
            .mean()
            .round(2)
            .to_dict()
        )

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


@router.get("/search")
async def search_location(query: str = Query(..., min_length=2)):
    """
    Search location geocoding using Open-Meteo API.
    """
    try:
        url = f"https://geocoding-api.open-meteo.com/v1/search?name={query}&count=5&language=en&format=json"
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail="Geocoding service unavailable")
            data = resp.json()

        results = []
        raw_results = data.get("results") or []
        for item in raw_results:
            name = item.get("name", "")
            admin1 = item.get("admin1", "")
            country = item.get("country", "")
            disp = ", ".join([f for f in [name, admin1, country] if f])
            results.append(
                LocationSearchResult(
                    name=name,
                    latitude=item.get("latitude"),
                    longitude=item.get("longitude"),
                    country=country,
                    admin1=admin1,
                    display_name=disp
                ).model_dump()
            )
        return results

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Geocoding search failed: {type(e).__name__}: {e}")
        raise HTTPException(status_code=503, detail=f"Location search service unavailable: {str(e)}")


@router.get("/current", response_model=CurrentWeatherResponse)
async def get_current_weather(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    location: Optional[str] = "Selected Location"
):
    """
    Fetch real-time current weather metrics from Open-Meteo.
    """
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={latitude}&longitude={longitude}&"
            f"current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&"
            f"timezone=auto"
        )
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail="Weather service unavailable")
            data = resp.json()

        curr = data.get("current", {})
        code = curr.get("weather_code", 0)

        return CurrentWeatherResponse(
            location=location,
            latitude=latitude,
            longitude=longitude,
            temperature_c=float(curr.get("temperature_2m", 0.0)),
            feels_like_c=float(curr.get("apparent_temperature", 0.0)),
            humidity_percent=float(curr.get("relative_humidity_2m", 0.0)),
            precipitation_mm=float(curr.get("precipitation", 0.0)),
            wind_speed_kmh=float(curr.get("wind_speed_10m", 0.0)),
            weather_condition=_get_wmo_description(code),
            weather_code=code,
            is_day=int(curr.get("is_day", 1)),
            update_time=curr.get("time", "")
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Current weather request failed: {type(e).__name__}: {e}")
        raise HTTPException(status_code=503, detail=f"Current weather service unavailable: {str(e)}")


@router.get("/forecast")
async def get_weather_forecast(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    location: Optional[str] = "Selected Location",
    crop: Optional[str] = None
):
    """
    Fetch 7-day forecast, hourly metrics, and agricultural farming recommendations.
    """
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={latitude}&longitude={longitude}&"
            f"current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&"
            f"hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code&"
            f"daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&"
            f"timezone=auto"
        )
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail="Weather forecast service unavailable")
            data = resp.json()

        curr = data.get("current", {})
        curr_code = curr.get("weather_code", 0)
        current_data = {
            "temperature_c": float(curr.get("temperature_2m", 0.0)),
            "feels_like_c": float(curr.get("apparent_temperature", 0.0)),
            "humidity_percent": float(curr.get("relative_humidity_2m", 0.0)),
            "precipitation_mm": float(curr.get("precipitation", 0.0)),
            "wind_speed_kmh": float(curr.get("wind_speed_10m", 0.0)),
            "weather_condition": _get_wmo_description(curr_code),
            "weather_code": curr_code,
            "is_day": int(curr.get("is_day", 1)),
            "time": curr.get("time", "")
        }

        # Daily forecast
        daily_raw = data.get("daily", {})
        dates = daily_raw.get("time", [])
        w_codes = daily_raw.get("weather_code", [])
        t_max = daily_raw.get("temperature_2m_max", [])
        t_min = daily_raw.get("temperature_2m_min", [])
        p_sum = daily_raw.get("precipitation_sum", [])
        p_prob = daily_raw.get("precipitation_probability_max", [])

        daily_list = []
        for i in range(len(dates)):
            code = w_codes[i] if i < len(w_codes) else 0
            daily_list.append({
                "date": dates[i],
                "weather_code": code,
                "weather_condition": _get_wmo_description(code),
                "temp_max": float(t_max[i]) if i < len(t_max) else 0.0,
                "temp_min": float(t_min[i]) if i < len(t_min) else 0.0,
                "precipitation_sum": float(p_sum[i]) if i < len(p_sum) and p_sum[i] is not None else 0.0,
                "precip_prob_max": int(p_prob[i]) if i < len(p_prob) and p_prob[i] is not None else 0
            })

        # Hourly forecast (first 24 hours)
        hourly_raw = data.get("hourly", {})
        h_times = hourly_raw.get("time", [])
        h_temp = hourly_raw.get("temperature_2m", [])
        h_hum = hourly_raw.get("relative_humidity_2m", [])
        h_prob = hourly_raw.get("precipitation_probability", [])
        h_code = hourly_raw.get("weather_code", [])

        hourly_list = []
        for i in range(min(24, len(h_times))):
            code = h_code[i] if i < len(h_code) else 0
            hourly_list.append({
                "time": h_times[i],
                "temperature_c": float(h_temp[i]) if i < len(h_temp) else 0.0,
                "humidity_percent": float(h_hum[i]) if i < len(h_hum) else 0.0,
                "precip_probability": int(h_prob[i]) if i < len(h_prob) and h_prob[i] is not None else 0,
                "weather_code": code,
                "weather_condition": _get_wmo_description(code)
            })

        # Farming Recommendations
        recommendations = generate_farming_recommendations(
            current_temp=current_data["temperature_c"],
            current_humidity=current_data["humidity_percent"],
            current_wind=current_data["wind_speed_kmh"],
            daily_forecasts=daily_list,
            crop=crop
        )

        return WeatherForecastResponse(
            location=location,
            latitude=latitude,
            longitude=longitude,
            current=current_data,
            hourly=hourly_list,
            daily=daily_list,
            farming_recommendations=recommendations
        ).model_dump()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Forecast request failed: {type(e).__name__}: {e}")
        raise HTTPException(status_code=503, detail=f"Forecast service unavailable: {str(e)}")

