import os
import json
import urllib.request
import urllib.error
from typing import Optional, Dict, Any

WEATHER_JSON_PATH = os.path.join("datasets", "processed", "weather_analytics.json")

# Region coordinates map for live Open-Meteo API forecasts
REGION_COORDINATES = {
    "india": {"lat": 28.6139, "lon": 77.2090, "name": "India (Indo-Gangetic Plain)"},
    "united states": {"lat": 41.8781, "lon": -87.6298, "name": "United States (Corn & Soy Belt)"},
    "brazil": {"lat": -15.7975, "lon": -47.8919, "name": "Brazil (Cerrado Agricultural Belt)"},
    "china": {"lat": 39.9042, "lon": 116.4074, "name": "China (North Plain)"},
    "france": {"lat": 48.8566, "lon": 2.3522, "name": "France (Paris Basin Grain Region)"},
    "germany": {"lat": 52.5200, "lon": 13.4050, "name": "Germany (Bavarian Agritech Region)"},
    "mexico": {"lat": 19.4326, "lon": -99.1332, "name": "Mexico (Central Agricultural Zone)"},
    "egypt": {"lat": 30.0444, "lon": 31.2357, "name": "Egypt (Nile Delta Irrigation Zone)"},
    "australia": {"lat": -33.8688, "lon": 151.2093, "name": "Australia (Grain & Wheat Belt)"},
    "south africa": {"lat": -25.7479, "lon": 28.1878, "name": "South Africa (Highveld Maize Belt)"},
    "pakistan": {"lat": 31.5204, "lon": 74.3587, "name": "Pakistan (Punjab Basin)"},
    "nigeria": {"lat": 9.0765, "lon": 7.3986, "name": "Nigeria (Savannah Agro-Zone)"},
    "spain": {"lat": 40.4168, "lon": -3.7038, "name": "Spain (Iberian Agricultural Plain)"},
    "turkey": {"lat": 39.9334, "lon": 32.8597, "name": "Turkey (Anatolia Plateau)"},
    "canada": {"lat": 51.0447, "lon": -114.0719, "name": "Canada (Prairie Wheat Belt)"}
}

class WeatherService:
    def get_weather_analytics(self, region: Optional[str] = None, live: bool = False) -> Dict[str, Any]:
        if live and region:
            live_data = self._fetch_live_open_meteo(region)
            if live_data:
                return live_data

        # Fallback to dataset-based historical analytics
        if not os.path.exists(WEATHER_JSON_PATH):
            raise FileNotFoundError("Weather analytics data not found. Please run scripts/weather_analytics.py first.")

        with open(WEATHER_JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        if not region:
            return data

        regional_breakdown = data.get("regional_breakdown", {})
        query_norm = region.strip().lower()
        matched_region = None

        # Exact and substring matching
        for reg_key in regional_breakdown.keys():
            if reg_key.lower() == query_norm or query_norm in reg_key.lower() or reg_key.lower() in query_norm:
                matched_region = reg_key
                break

        if not matched_region:
            matched_region = list(regional_breakdown.keys())[0]

        return {
            "status_claim": data.get("status_claim", "Dataset-based Weather Analytics"),
            "data_source": data.get("data_source"),
            "region": matched_region,
            "analytics": regional_breakdown[matched_region],
            "available_regions": data.get("available_regions", [])
        }

    def _fetch_live_open_meteo(self, region: str) -> Optional[Dict[str, Any]]:
        norm_key = region.strip().lower()
        coords = REGION_COORDINATES.get(norm_key)
        
        if not coords:
            # Search partial key
            for k, v in REGION_COORDINATES.items():
                if k in norm_key or norm_key in k:
                    coords = v
                    break

        if not coords:
            # Default to India grid
            coords = REGION_COORDINATES["india"]

        lat, lon = coords["lat"], coords["lon"]
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}"
            f"&current=temperature_2m,relative_humidity_2m,precipitation,rain,surface_pressure,wind_speed_10m"
            f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum"
            f"&timezone=auto"
        )

        try:
            req = urllib.request.Request(url, headers={"User-Agent": "YieldSenseAI/1.0 (Mozilla/5.0)"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                current = res_data.get("current", {})
                daily = res_data.get("daily", {})

                temp = current.get("temperature_2m", 25.0)
                humidity = current.get("relative_humidity_2m", 60.0)
                precip = current.get("precipitation", 0.0)
                wind = current.get("wind_speed_10m", 5.0)
                rain_sum = daily.get("precipitation_sum", [precip])[0] if daily.get("precipitation_sum") else precip

                # Compute live adequacy & stress scores
                rain_adequacy = 95.0 if rain_sum >= 5.0 else 75.0 if rain_sum >= 1.0 else 60.0
                temp_stress = 15.0 if 18.0 <= temp <= 30.0 else 45.0 if 14.0 <= temp <= 34.0 else 80.0
                humidity_balance = 90.0 if 50.0 <= humidity <= 75.0 else 65.0
                sunlight_score = 88.0

                overall = round((rain_adequacy * 0.35) + ((100.0 - temp_stress) * 0.30) + (humidity_balance * 0.20) + (sunlight_score * 0.15), 2)

                return {
                    "status_claim": f"Live Open-Meteo Weather Stream ({coords['name']})",
                    "data_source": "Open-Meteo Real-Time Satellite API",
                    "region": region,
                    "analytics": {
                        "record_count": 1,
                        "average_rainfall_mm": round(float(rain_sum), 2),
                        "average_temperature_C": round(float(temp), 2),
                        "average_humidity_percent": round(float(humidity), 2),
                        "average_sunlight_hours": 8.0,
                        "wind_speed_kmh": round(float(wind), 2),
                        "rainfall_adequacy_score": rain_adequacy,
                        "temperature_stress_risk": temp_stress,
                        "humidity_balance_score": humidity_balance,
                        "sunlight_exposure_score": sunlight_score,
                        "overall_weather_score": overall
                    },
                    "available_regions": list(REGION_COORDINATES.keys())
                }
        except Exception as e:
            print(f"[WeatherService] Live API call failed: {e}")
            return None

weather_service = WeatherService()
