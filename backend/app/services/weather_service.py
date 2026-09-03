import os
import json
from typing import Optional

WEATHER_JSON_PATH = os.path.join("datasets", "processed", "weather_analytics.json")

class WeatherService:
    def get_weather_analytics(self, region: Optional[str] = None) -> dict:
        if not os.path.exists(WEATHER_JSON_PATH):
            raise FileNotFoundError("Weather analytics data not found. Please run scripts/weather_analytics.py first.")

        with open(WEATHER_JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        if not region:
            return data

        regional_breakdown = data.get("regional_breakdown", {})
        matched_region = None
        for reg_key in regional_breakdown.keys():
            if reg_key.lower() == region.strip().lower():
                matched_region = reg_key
                break

        if not matched_region:
            valid_regions = list(regional_breakdown.keys())
            raise ValueError(f"Region '{region}' not found. Valid regions are: {valid_regions}")

        return {
            "status_claim": data.get("status_claim", "Dataset-based Weather Analytics"),
            "data_source": data.get("data_source"),
            "region": matched_region,
            "analytics": regional_breakdown[matched_region],
            "available_regions": data.get("available_regions", [])
        }

weather_service = WeatherService()
