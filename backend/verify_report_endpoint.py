import json
import logging
from backend.main import (
    app, load_pipeline, load_historical_weather_analysis, load_historical_soil_analysis,
    health_check, predict, weather_analysis, soil_analysis, agricultural_report,
    PredictionRequest, WeatherAnalysisRequest, SoilAnalysisRequest, AgriculturalReportRequest
)

# Initialize globals
load_pipeline()
load_historical_weather_analysis()
load_historical_soil_analysis()

sample_payload = {
    "region": "Central USA",
    "crop_type": "Maize",
    "irrigation_type": "Drip",
    "fertilizer_type": "Inorganic",
    "crop_disease_status": "Mild",
    "soil_moisture_%": 35.5,
    "soil_pH": 6.8,
    "temperature_C": 24.5,
    "rainfall_mm": 120.0,
    "humidity_%": 65.0,
    "sunlight_hours": 8.5,
    "pesticide_usage_ml": 250.0,
    "total_days": 120,
    "latitude": 40.7,
    "longitude": -95.0,
    "NDVI_index": 0.65,
    "sowing_date": "2024-04-15",
    "observation_date": "2024-06-15"
}

print("Testing health_check ...")
health_res = health_check()
assert health_res["status"] == "healthy"
print("OK")

print("Testing predict ...")
pred_req = PredictionRequest(**sample_payload)
pred_res = predict(pred_req)
assert "predicted_yield_kg_per_hectare" in pred_res
print("OK")

print("Testing weather_analysis ...")
weather_req = WeatherAnalysisRequest(**sample_payload)
weather_res = weather_analysis(weather_req)
assert "weather_assessment" in weather_res
print("OK")

print("Testing soil_analysis ...")
soil_req = SoilAnalysisRequest(**sample_payload)
soil_res = soil_analysis(soil_req)
assert "soil_suitability_assessment" in soil_res
print("OK")

print("Testing agricultural_report ...")
report_req = AgriculturalReportRequest(**sample_payload)
report_res = agricultural_report(report_req)
assert "yield_prediction" in report_res
print("OK")

print("\n--- SAMPLE REPORT OUTPUT ---")
print(json.dumps(report_res, indent=2))
print("----------------------------\n")

# Verify constraints
report_str = json.dumps(report_res).lower()
forbidden_phrases = [
    "optimal",
    "causes higher yield",
    "guaranteed yield",
    "best soil",
    "ideal weather",
    "this crop prefers this condition"
]

print("Checking for forbidden causal language...")
for phrase in forbidden_phrases:
    if phrase in report_str:
        print(f"FAILED: Found forbidden phrase '{phrase}' in report output.")
        exit(1)
        
required_keys = [
    "yield_prediction",
    "historical_weather_context",
    "historical_soil_context",
    "overall_agricultural_forecasting_summary"
]
for key in required_keys:
    if key not in report_res:
        print(f"FAILED: Required key '{key}' not found in report output.")
        exit(1)

required_phrases = [
    "predicted yield",
    "does not establish causation"
]
for phrase in required_phrases:
    if phrase not in report_str:
        print(f"WARNING: Required phrase '{phrase}' not found in report output.")

print("Validation completed successfully. All functions work.")
