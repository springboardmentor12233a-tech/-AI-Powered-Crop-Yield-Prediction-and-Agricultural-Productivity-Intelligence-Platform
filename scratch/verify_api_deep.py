import os
import sys
sys.path.insert(0, os.path.abspath("."))

from fastapi.testclient import TestClient
from src.api.main import app

def run_deep_api_verification():
    print("=" * 70)
    print("DEEP VERIFICATION: FASTAPI BACKEND & SECURITY/INPUT VALIDATION")
    print("=" * 70)
    
    client = TestClient(app)
    
    # 1. Root & Documentation
    print("\n[API 1] Testing Root & OpenAPI Documentation...")
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "Online"
    print("[OK] GET / -> HTTP 200 (Online)")
    
    res_docs = client.get("/docs")
    assert res_docs.status_code == 200
    print("[OK] GET /docs -> HTTP 200 (Swagger UI accessible)")
    
    res_openapi = client.get("/openapi.json")
    assert res_openapi.status_code == 200
    schema = res_openapi.json()
    assert "paths" in schema
    print(f"[OK] GET /openapi.json -> HTTP 200 (Schema defines {len(schema['paths'])} endpoints)")

    # 2. Yield Prediction Valid & Edge Cases
    print("\n[API 2] Testing POST /api/predict/yield...")
    valid_yield_payload = {
        "Crop": "Wheat",
        "Region": "Region_B",
        "Soil_Type": "Loam",
        "Soil_pH": 6.8,
        "Rainfall_mm": 650.0,
        "Temperature_C": 21.5,
        "Humidity_pct": 55.0,
        "Fertilizer_Used_kg": 180.0,
        "Irrigation": "Sprinkler",
        "Pesticides_Used_kg": 15.0,
        "Planting_Density": 14.0,
        "Previous_Crop": "Maize"
    }
    res = client.post("/api/predict/yield", json=valid_yield_payload)
    assert res.status_code == 200
    data = res.json()
    print(f"[OK] Valid Yield Request -> HTTP 200 (Predicted Yield: {data['predicted_yield_ton_per_ha']} ton/ha)")
    assert data["predicted_yield_ton_per_ha"] > 0
    assert "insights" in data
    
    # Test Invalid Categorical Values
    invalid_categories = [
        ({"Crop": "InvalidCrop"}, "Invalid Crop"),
        ({"Region": "Region_Z"}, "Invalid Region"),
        ({"Soil_Type": "Gravel"}, "Invalid Soil_Type"),
        ({"Irrigation": "Canal"}, "Invalid Irrigation"),
        ({"Previous_Crop": "Sugarcane"}, "Invalid Previous_Crop")
    ]
    for override, err_msg in invalid_categories:
        bad_payload = valid_yield_payload.copy()
        bad_payload.update(override)
        res = client.post("/api/predict/yield", json=bad_payload)
        assert res.status_code == 400, f"Expected 400 for {override}, got {res.status_code}"
        assert err_msg in res.json()["detail"]
    print("[OK] Verified HTTP 400 rejection for all invalid categorical parameters.")
    
    # Test Out-of-bounds Numeric Values (Pydantic validation -> HTTP 422)
    invalid_numerics = [
        {"Soil_pH": -1.0},
        {"Soil_pH": 15.0},
        {"Humidity_pct": 105.0},
        {"Rainfall_mm": -100.0},
        {"Fertilizer_Used_kg": -10.0}
    ]
    for override in invalid_numerics:
        bad_payload = valid_yield_payload.copy()
        bad_payload.update(override)
        res = client.post("/api/predict/yield", json=bad_payload)
        assert res.status_code == 422, f"Expected 422 for {override}, got {res.status_code}"
    print("[OK] Verified HTTP 422 rejection for out-of-bounds numerical parameters.")

    # 3. Crop Recommendation Valid & Edge Cases
    print("\n[API 3] Testing POST /api/predict/recommendation...")
    valid_rec_payload = {
        "Temperature": 26.0,
        "Humidity": 75.0,
        "pH": 6.4,
        "Rainfall": 950.0
    }
    res = client.post("/api/predict/recommendation", json=valid_rec_payload)
    assert res.status_code == 200
    data = res.json()
    print(f"[OK] Valid Recommendation -> HTTP 200 (Crop: {data['recommended_crop']}, Confidence: {data['confidence_pct']})")
    assert len(data["top_candidates"]) == 5
    assert data["soil_ph_analysis"]["category"] in ["Neutral", "Moderately Acidic"]
    
    # Test Out of bounds numerical values (Pydantic validation -> HTTP 422)
    bad_rec = {"Temperature": 95.0, "Humidity": 50.0, "pH": 7.0, "Rainfall": 500.0}
    res = client.post("/api/predict/recommendation", json=bad_rec)
    assert res.status_code == 422
    print("[OK] Verified HTTP 422 rejection for out-of-bounds temperature (>60°C).")

    # 4. Analytics Endpoints
    print("\n[API 4] Testing Analytics & Report Endpoints...")
    res_w = client.get("/api/analytics/weather")
    assert res_w.status_code == 200
    w_data = res_w.json()
    assert "crop_climatic_profiles" in w_data
    print(f"[OK] GET /api/analytics/weather -> HTTP 200 ({len(w_data['crop_climatic_profiles'])} crop profiles)")
    
    res_s = client.get("/api/analytics/soil")
    assert res_s.status_code == 200
    s_data = res_s.json()
    assert "soil_texture_performance" in s_data
    print(f"[OK] GET /api/analytics/soil -> HTTP 200 (Clay, Loam, Sandy benchmarks)")
    
    report_req = {
        "farm_id": "FARM-VERIFY-99",
        "plot_label": "Plot 9",
        "Crop": "Barley",
        "Region": "Region_D",
        "Soil_Type": "Loam",
        "Soil_pH": 7.2,
        "Rainfall_mm": 450.0,
        "Temperature_C": 18.5,
        "Humidity_pct": 48.0,
        "Fertilizer_Used_kg": 120.0,
        "Irrigation": "Sprinkler",
        "Pesticides_Used_kg": 10.0,
        "Planting_Density": 12.0,
        "Previous_Crop": "Rice"
    }
    res_rep = client.post("/api/analytics/report", json=report_req)
    assert res_rep.status_code == 200
    rep_data = res_rep.json()
    assert rep_data["farm_details"]["farm_id"] == "FARM-VERIFY-99"
    assert "formatted_markdown" in rep_data
    print(f"[OK] POST /api/analytics/report -> HTTP 200 (Generated Report ID: {rep_data['report_id']})")

    # 5. Auth Endpoints
    print("\n[API 5] Testing Authentication Endpoints...")
    login_res = client.post("/api/auth/login", json={"username": "farmer_user", "password": "farmer_pass"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    print(f"[OK] POST /api/auth/login -> HTTP 200 (Token issued for farmer_user)")
    
    profile_res = client.get("/api/auth/profile", headers={"Authorization": f"Bearer {token}"})
    assert profile_res.status_code == 200
    assert profile_res.json()["username"] == "farmer_user"
    print(f"[OK] GET /api/auth/profile -> HTTP 200 (Authenticated as {profile_res.json()['username']}, role: {profile_res.json()['role']})")

    print("\n" + "=" * 70)
    print("ALL FASTAPI BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_deep_api_verification()
