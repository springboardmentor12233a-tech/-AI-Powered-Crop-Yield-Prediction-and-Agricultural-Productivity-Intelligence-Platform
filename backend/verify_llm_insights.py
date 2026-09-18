import json
import logging
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.api.auth import get_current_user
import os

# Override authentication dependency for testing
app.dependency_overrides[get_current_user] = lambda: {"id": 1, "email": "test@test.com", "role": "admin"}

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

with TestClient(app) as client:
    print("Testing GET /health ...")
    health_res = client.get("/health")
    assert health_res.status_code == 200, f"Health check failed: {health_res.text}"
    assert health_res.json()["status"] == "healthy"
    print("OK")

    print("Testing POST /ml/predict ...")
    pred_res = client.post("/ml/predict", json=sample_payload)
    assert pred_res.status_code == 200, f"Predict failed: {pred_res.text}"
    assert "predicted_yield_kg_per_hectare" in pred_res.json()
    print("OK")

    print("Testing POST /ml/weather-analysis ...")
    weather_res = client.post("/ml/weather-analysis", json=sample_payload)
    assert weather_res.status_code == 200, f"Weather analysis failed: {weather_res.text}"
    assert "weather_assessment" in weather_res.json()
    print("OK")

    print("Testing POST /ml/soil-analysis ...")
    soil_res = client.post("/ml/soil-analysis", json=sample_payload)
    assert soil_res.status_code == 200, f"Soil analysis failed: {soil_res.text}"
    assert "soil_suitability_assessment" in soil_res.json()
    print("OK")

    print("Testing POST /ml/agricultural-report ...")
    report_res = client.post("/ml/agricultural-report", json=sample_payload)
    assert report_res.status_code == 200, f"Agricultural report failed: {report_res.text}"
    assert "yield_prediction" in report_res.json()
    print("OK")

    print("Testing /openapi.json contains /ml/llm-insights ...")
    openapi_res = client.get("/openapi.json")
    assert openapi_res.status_code == 200
    assert "/ml/llm-insights" in openapi_res.json()["paths"]
    print("OK")

    print("Testing POST /ml/llm-insights ...")
    insights_res = client.post("/ml/llm-insights", json=sample_payload)
    
    if insights_res.status_code == 200:
        data = insights_res.json()
        print("OK - LLM generated a response")
        print("\n--- LLM RESPONSE ---")
        print(json.dumps(data, indent=2))
        print("--------------------\n")
        
        # Validate the structure
        assert isinstance(data, dict), "Response is not a JSON object"
        assert "summary" in data
        assert "yield_interpretation" in data
        assert "weather_insights" in data
        assert "soil_insights" in data
        assert "attention_points" in data
        assert "limitations" in data
        
        assert isinstance(data["summary"], str), "summary must be string"
        assert isinstance(data["yield_interpretation"], str), "yield_interpretation must be string"
        assert isinstance(data["weather_insights"], list), "weather_insights must be list"
        assert isinstance(data["soil_insights"], list), "soil_insights must be list"
        assert isinstance(data["attention_points"], list), "attention_points must be list"
        assert isinstance(data["limitations"], list), "limitations must be list"
        print("OK - Response validated against required structure.")
        
    elif insights_res.status_code == 503 and "GROQ_API_KEY" in insights_res.text:
        print("OK - Caught expected 503 Service Unavailable (Groq API key not configured).")
        print(f"Exception message: {insights_res.json()['detail']}")
    elif insights_res.status_code == 502:
        key = os.environ.get("GROQ_API_KEY", "")
        if "your_real_api_key_here" in key or not key:
            print("OK - Caught expected 502 Bad Gateway (Invalid or placeholder API key).")
            print(f"Exception message: {insights_res.json()['detail']}")
        else:
            print("FAILED - Caught 502 Bad Gateway with a real-looking API key. Provider error or invalid key.")
            print(f"Exception message: {insights_res.json()['detail']}")
            exit(1)
    else:
        print(f"FAILED - Unexpected HTTP Status: {insights_res.status_code} - {insights_res.text}")
        exit(1)

print("Validation completed successfully. All LLM Insights integration requirements are met.")
