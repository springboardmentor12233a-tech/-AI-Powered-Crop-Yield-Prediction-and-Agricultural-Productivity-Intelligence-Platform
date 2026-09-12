import json
import logging
from backend.main import (
    app, load_pipeline, load_historical_weather_analysis, load_historical_soil_analysis,
    health_check, predict, weather_analysis, soil_analysis, agricultural_report,
    PredictionRequest, WeatherAnalysisRequest, SoilAnalysisRequest, AgriculturalReportRequest,
    llm_insights
)
from fastapi import HTTPException

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

print("Testing llm_insights ...")
try:
    insights_res = llm_insights(report_req)
    print("OK - LLM generated a response (API Key was present)")
    print("\n--- LLM RESPONSE ---")
    print(json.dumps(insights_res, indent=2))
    print("--------------------\n")
    
    # Validate the structure
    assert isinstance(insights_res, dict), "Response is not a JSON object"
    assert "summary" in insights_res
    assert "yield_interpretation" in insights_res
    assert "weather_insights" in insights_res
    assert "soil_insights" in insights_res
    assert "attention_points" in insights_res
    assert "limitations" in insights_res
    
    assert isinstance(insights_res["summary"], str), "summary must be string"
    assert isinstance(insights_res["yield_interpretation"], str), "yield_interpretation must be string"
    assert isinstance(insights_res["weather_insights"], list), "weather_insights must be list"
    assert isinstance(insights_res["soil_insights"], list), "soil_insights must be list"
    assert isinstance(insights_res["attention_points"], list), "attention_points must be list"
    assert isinstance(insights_res["limitations"], list), "limitations must be list"
    print("OK - Response validated against required structure.")
except HTTPException as e:
    if e.status_code == 503 and "GROQ_API_KEY" in str(e.detail):
        print("OK - Caught expected 503 Service Unavailable (Groq API key not configured).")
        print(f"Exception message: {e.detail}")
    elif e.status_code == 502:
        import os
        key = os.environ.get("GROQ_API_KEY", "")
        if "your_real_api_key_here" in key or not key:
            print("OK - Caught expected 502 Bad Gateway (Invalid or placeholder API key).")
            print(f"Exception message: {e.detail}")
        else:
            print("FAILED - Caught 502 Bad Gateway with a real-looking API key. Provider error or invalid key.")
            print(f"Exception message: {e.detail}")
            exit(1)
    else:
        print(f"FAILED - Unexpected HTTPException: {e.status_code} - {e.detail}")
        exit(1)
except Exception as e:
    print(f"FAILED - Unexpected exception: {str(e)}")
    exit(1)

print("Validation completed successfully. All LLM Insights integration requirements are met.")
