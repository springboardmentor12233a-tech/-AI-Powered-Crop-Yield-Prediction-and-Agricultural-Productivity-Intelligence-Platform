"""
YieldSense AI — Milestone 3 Comprehensive Test
Tests all existing (M1/M2) and new (M3) endpoints.
"""
import requests
import json
import sys

BASE = "http://127.0.0.1:8000"
PASS = 0
FAIL = 0

def check(name, r, expected_status=200, key=None):
    global PASS, FAIL
    ok = r.status_code == expected_status
    if ok and key:
        ok = key in r.json()
    status = "PASS" if ok else "FAIL"
    if ok:
        PASS += 1
    else:
        FAIL += 1
    print(f"  [{status}] {name} — HTTP {r.status_code}")
    if not ok:
        try:
            print(f"         Response: {r.json()}")
        except Exception:
            print(f"         Response: {r.text[:200]}")
    return r


print("\n" + "="*60)
print("  YieldSense AI — Complete API Test Suite")
print("="*60)

# ─── Milestone 1 / 2 ──────────────────────────────────────────
print("\n--- Milestone 1 & 2 (Existing Functionality) ---")

r = check("Health Check", requests.get(f"{BASE}/health"), key="status")
r = check("Root Endpoint", requests.get(f"{BASE}/"), key="app")

# Register + Login
import uuid
uid = str(uuid.uuid4())[:8]
reg = requests.post(f"{BASE}/auth/register", json={
    "username": f"testuser_{uid}", "email": f"test_{uid}@farm.com",
    "password": "testpass123", "full_name": "Test User",
    "role": "farmer", "farm_name": "Test Farm", "farm_location": "North"
})
check("Register User", reg, expected_status=201)

login = requests.post(f"{BASE}/auth/login", json={
    "username": f"testuser_{uid}", "password": "testpass123"
})
check("Login", login, key="access_token")

token = login.json().get("access_token", "")
H = {"Authorization": f"Bearer {token}"}

check("Auth /me", requests.get(f"{BASE}/auth/me", headers=H), key="username")

# Prediction
predict_payload = {
    "crop": "Rice", "rainfall_mm": 950, "temperature_c": 28,
    "fertilizer_used": 1, "irrigation_used": 1,
    "weather_condition": "Sunny", "soil_type": "Loamy", "region": "South",
    "nitrogen": 90, "phosphorus": 55, "potassium": 65, "soil_ph": 6.8
}
r = check("/predict", requests.post(f"{BASE}/predict", json=predict_payload, headers=H), key="predicted_yield_kg_per_acre")
if r.status_code == 200:
    yield_val = r.json()["predicted_yield_kg_per_acre"]
    print(f"         Predicted yield: {yield_val} kg/acre")

check("/model-info",        requests.get(f"{BASE}/model-info", headers=H),        key="best_model")
check("/model-comparison",  requests.get(f"{BASE}/model-comparison", headers=H),  key="models")
check("/weather/analysis",  requests.get(f"{BASE}/weather/analysis", headers=H),  key="total_records_analyzed")
check("/soil/analysis",     requests.get(f"{BASE}/soil/analysis", headers=H),     key="top_soil_type_by_yield")

# AI Insights
insights_payload = {**predict_payload, "predicted_yield_kg_per_acre": 3500.0}
check("/ai-insights", requests.post(f"{BASE}/ai-insights", json=insights_payload, headers=H), key="insights")

# ─── Milestone 3 ──────────────────────────────────────────────
print("\n--- Milestone 3 (New Functionality) ---")

# Productivity
r = check("/productivity/analysis", requests.get(f"{BASE}/productivity/analysis", headers=H), key="overall_statistics")
if r.status_code == 200:
    d = r.json()
    print(f"         Highest-yielding crop: {d.get('highest_yielding_crop')}")
    print(f"         Lowest-yielding crop:  {d.get('lowest_yielding_crop')}")
    print(f"         Average yield: {d['overall_statistics']['average_yield']} kg/acre")

# Crop Recommendation
rec_payload = {
    "region": "North", "rainfall_mm": 900, "temperature_c": 27,
    "weather_condition": "Sunny", "soil_type": "Loamy",
    "nitrogen": 80, "phosphorus": 50, "potassium": 60,
    "soil_ph": 6.5, "fertilizer_used": 1, "irrigation_used": 1
}
r = check("/recommendation/crop", requests.post(f"{BASE}/recommendation/crop", json=rec_payload, headers=H), key="recommended_crop")
if r.status_code == 200:
    d = r.json()
    print(f"         Recommended crop: {d['recommended_crop']} ({d['expected_avg_yield_kg_per_acre']} kg/acre)")

# Resource Optimization
res_payload = {
    "crop": "Rice", "soil_type": "Loamy", "nitrogen": 45, "phosphorus": 25,
    "potassium": 35, "soil_ph": 6.0, "rainfall_mm": 900,
    "fertilizer_used": 0, "irrigation_used": 1
}
r = check("/resources/optimize", requests.post(f"{BASE}/resources/optimize", json=res_payload, headers=H), key="optimization_score")
if r.status_code == 200:
    d = r.json()
    print(f"         Optimization score: {d['optimization_score']}/100 ({d['optimization_level']})")

# Risk Assessment
risk_payload = {
    "crop": "Wheat", "rainfall_mm": 250, "temperature_c": 42,
    "weather_condition": "Stormy", "soil_type": "Sandy", "region": "West",
    "nitrogen": 35, "phosphorus": 18, "potassium": 25,
    "soil_ph": 4.8, "fertilizer_used": 0, "irrigation_used": 0
}
r = check("/risk/assess", requests.post(f"{BASE}/risk/assess", json=risk_payload, headers=H), key="overall_risk_level")
if r.status_code == 200:
    d = r.json()
    print(f"         Overall risk: {d['overall_risk_level']} ({d['risk_summary']})")

# Risk Assessment (low-risk scenario)
risk_low = {
    "crop": "Rice", "rainfall_mm": 950, "temperature_c": 28,
    "weather_condition": "Sunny", "soil_type": "Loamy", "region": "North",
    "nitrogen": 90, "phosphorus": 60, "potassium": 70,
    "soil_ph": 6.8, "fertilizer_used": 1, "irrigation_used": 1
}
r = check("/risk/assess (low-risk)", requests.post(f"{BASE}/risk/assess", json=risk_low, headers=H), key="overall_risk_level")
if r.status_code == 200:
    print(f"         Risk level: {r.json()['overall_risk_level']}")

# ─── Summary ──────────────────────────────────────────────────
print("\n" + "="*60)
total = PASS + FAIL
print(f"  RESULTS: {PASS}/{total} passed, {FAIL} failed")
print("="*60 + "\n")

sys.exit(0 if FAIL == 0 else 1)
