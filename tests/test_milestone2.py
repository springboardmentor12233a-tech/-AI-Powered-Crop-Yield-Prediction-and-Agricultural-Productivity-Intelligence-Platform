import os
import pytest
from fastapi.testclient import TestClient

from src.api.main import app
from src.ml.models.registry import (
    get_yield_model,
    get_crop_recommendation_artifact,
    predict_crop_yield,
    predict_crop_recommendation
)
from src.analytics.weather_analytics import get_weather_analytics_summary
from src.analytics.soil_analysis import get_soil_analysis_summary, classify_soil_ph
from src.analytics.agricultural_insights import generate_agricultural_insights
from src.analytics.prediction_report import build_prediction_report

client = TestClient(app)

def test_ml_models_loadable():
    """Verify serialized .joblib model artifacts exist and can be loaded."""
    yield_model = get_yield_model()
    assert yield_model is not None
    assert hasattr(yield_model, "predict")
    
    rec_artifact = get_crop_recommendation_artifact()
    assert rec_artifact is not None
    assert "pipeline" in rec_artifact
    assert "label_encoder" in rec_artifact
    assert len(rec_artifact["classes"]) == 70

def test_yield_model_inference():
    """Verify live inference output for crop yield regression."""
    sample_input = {
        "Crop": "Wheat",
        "Region": "Region_A",
        "Soil_Type": "Loam",
        "Soil_pH": 6.8,
        "Rainfall_mm": 650.0,
        "Temperature_C": 22.0,
        "Humidity_pct": 55.0,
        "Fertilizer_Used_kg": 180.0,
        "Irrigation": "Sprinkler",
        "Pesticides_Used_kg": 20.0,
        "Planting_Density": 15.0,
        "Previous_Crop": "Maize"
    }
    pred_yield = predict_crop_yield(sample_input)
    assert isinstance(pred_yield, float)
    assert 20.0 <= pred_yield <= 250.0

def test_crop_recommendation_inference():
    """Verify multiclass crop recommendation returns top candidates with probabilities."""
    rec_input = {
        "Temperature": 28.0,
        "Humidity": 80.0,
        "pH": 6.5,
        "Rainfall": 1200.0
    }
    candidates = predict_crop_recommendation(rec_input, top_k=3)
    assert len(candidates) == 3
    assert "crop" in candidates[0]
    assert "confidence" in candidates[0]
    assert 0.0 <= candidates[0]["confidence"] <= 1.0

def test_weather_and_soil_analytics():
    """Verify statistical analytics compute properly from datasets."""
    weather = get_weather_analytics_summary()
    assert "crop_climatic_profiles" in weather
    assert "Rice" in weather["crop_climatic_profiles"]
    assert "Maize" in weather["crop_climatic_profiles"]
    
    soil = get_soil_analysis_summary()
    assert "soil_texture_performance" in soil
    assert "Clay" in soil["soil_texture_performance"]
    
    ph_info = classify_soil_ph(5.2)
    assert ph_info["category"] == "Strongly Acidic"

def test_api_root():
    """Verify root health check endpoint."""
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["project"] == "YieldSense AI"
    assert data["status"] == "Online"

def test_api_yield_prediction_endpoint():
    """Verify POST /api/predict/yield live inference endpoint."""
    payload = {
        "Crop": "Rice",
        "Region": "Region_B",
        "Soil_Type": "Clay",
        "Soil_pH": 6.4,
        "Rainfall_mm": 1100.0,
        "Temperature_C": 29.0,
        "Humidity_pct": 82.0,
        "Fertilizer_Used_kg": 220.0,
        "Irrigation": "Flood",
        "Pesticides_Used_kg": 25.0,
        "Planting_Density": 18.0,
        "Previous_Crop": "Wheat"
    }
    res = client.post("/api/predict/yield", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "predicted_yield_ton_per_ha" in data
    assert data["predicted_yield_ton_per_ha"] > 0
    assert "insights" in data

def test_api_yield_invalid_input():
    """Verify validation rejection on invalid category or out-of-bounds input."""
    bad_payload = {
        "Crop": "InvalidCropName",
        "Region": "Region_A",
        "Soil_Type": "Loam",
        "Soil_pH": 6.8,
        "Rainfall_mm": 650.0,
        "Temperature_C": 22.0,
        "Humidity_pct": 55.0,
        "Fertilizer_Used_kg": 180.0,
        "Irrigation": "Sprinkler",
        "Pesticides_Used_kg": 20.0,
        "Planting_Density": 15.0,
        "Previous_Crop": "Maize"
    }
    res = client.post("/api/predict/yield", json=bad_payload)
    assert res.status_code == 400

def test_api_recommendation_endpoint():
    """Verify POST /api/predict/recommendation live endpoint."""
    payload = {
        "Temperature": 24.5,
        "Humidity": 65.0,
        "pH": 6.8,
        "Rainfall": 800.0
    }
    res = client.post("/api/predict/recommendation", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "recommended_crop" in data
    assert len(data["top_candidates"]) > 0

def test_api_analytics_and_report_endpoints():
    """Verify analytics and report endpoints."""
    res_w = client.get("/api/analytics/weather")
    assert res_w.status_code == 200
    
    res_s = client.get("/api/analytics/soil")
    assert res_s.status_code == 200
    
    report_payload = {
        "farm_id": "TEST-FARM-01",
        "plot_label": "Plot 1",
        "Crop": "Wheat",
        "Region": "Region_A",
        "Soil_Type": "Loam",
        "Soil_pH": 6.8,
        "Rainfall_mm": 650.0,
        "Temperature_C": 22.0,
        "Humidity_pct": 55.0,
        "Fertilizer_Used_kg": 180.0,
        "Irrigation": "Sprinkler",
        "Pesticides_Used_kg": 20.0,
        "Planting_Density": 15.0,
        "Previous_Crop": "Maize"
    }
    res_r = client.post("/api/analytics/report", json=report_payload)
    assert res_r.status_code == 200
    data = res_r.json()
    assert "report_id" in data
    assert "formatted_markdown" in data

if __name__ == "__main__":
    pytest.main(["-v", __file__])
