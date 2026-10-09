"""
YieldSense AI — Full Feature Test Suite (M1 + M2 + M3 + New Features)
Tests all existing endpoints and 3 new feature endpoints.
"""
import requests, json, uuid, sys

BASE = "http://127.0.0.1:8000"
PASS = 0; FAIL = 0

def check(name, r, expected=200, key=None):
    global PASS, FAIL
    ok = r.status_code == expected
    if ok and key:
        ok = key in (r.json() if r.headers.get('content-type','').startswith('application/json') else {})
    status = "PASS" if ok else "FAIL"
    if ok: PASS += 1
    else:  FAIL += 1
    print(f"  [{status}] {name} — HTTP {r.status_code}")
    if not ok:
        try: print(f"         → {r.json()}")
        except: print(f"         → {r.text[:150]}")
    return r

print("\n" + "="*65)
print("  YieldSense AI — Complete Feature Test Suite")
print("="*65)

# ─── Existing M1/M2 ───────────────────────────────────────────────────────────
print("\n--- Existing M1 & M2 ---")
check("GET /health",  requests.get(f"{BASE}/health"), key="status")
check("GET /",        requests.get(f"{BASE}/"), key="app")

uid = str(uuid.uuid4())[:8]
reg = requests.post(f"{BASE}/auth/register", json={
    "username": f"feattest_{uid}", "email": f"feat_{uid}@test.com",
    "password": "testpass123", "full_name": "Feature Tester",
    "role": "farmer", "farm_name": "Test Farm", "farm_location": "North",
})
check("POST /auth/register", reg, expected=201)

login = requests.post(f"{BASE}/auth/login", json={"username": f"feattest_{uid}", "password": "testpass123"})
check("POST /auth/login", login, key="access_token")
token = login.json().get("access_token", "")
H = {"Authorization": f"Bearer {token}"}

check("GET /auth/me",         requests.get(f"{BASE}/auth/me", headers=H), key="username")

PREDICT = {
    "crop": "Rice", "rainfall_mm": 950, "temperature_c": 28,
    "fertilizer_used": 1, "irrigation_used": 1, "weather_condition": "Sunny",
    "soil_type": "Loamy", "region": "South",
    "nitrogen": 90, "phosphorus": 55, "potassium": 65, "soil_ph": 6.8
}
pred_r = check("POST /predict", requests.post(f"{BASE}/predict", json=PREDICT, headers=H), key="predicted_yield_kg_per_acre")
pred_data = pred_r.json()
YIELD = pred_data.get("predicted_yield_kg_per_acre", 3000.0)
MODEL = pred_data.get("model_used", "Linear Regression")
CONF  = pred_data.get("prediction_confidence", "high")
if pred_r.status_code == 200:
    print(f"         Yield: {YIELD:.1f} kg/acre | Model: {MODEL}")

check("GET /model-info",       requests.get(f"{BASE}/model-info", headers=H), key="best_model")
check("GET /model-comparison", requests.get(f"{BASE}/model-comparison", headers=H), key="models")
check("GET /weather/analysis", requests.get(f"{BASE}/weather/analysis", headers=H), key="total_records_analyzed")
check("GET /soil/analysis",    requests.get(f"{BASE}/soil/analysis", headers=H), key="top_soil_type_by_yield")
ins_payload = {**PREDICT, "predicted_yield_kg_per_acre": YIELD}
check("POST /ai-insights",     requests.post(f"{BASE}/ai-insights", json=ins_payload, headers=H), key="insights")

# ─── M3 ──────────────────────────────────────────────────────────────────────
print("\n--- Milestone 3 ---")
check("GET /productivity/analysis", requests.get(f"{BASE}/productivity/analysis", headers=H), key="overall_statistics")
check("POST /recommendation/crop",  requests.post(f"{BASE}/recommendation/crop", json={
    "region":"North","rainfall_mm":900,"temperature_c":27,"weather_condition":"Sunny",
    "soil_type":"Loamy","nitrogen":80,"phosphorus":50,"potassium":60,"soil_ph":6.5,
    "fertilizer_used":1,"irrigation_used":1}, headers=H), key="recommended_crop")
check("POST /resources/optimize",  requests.post(f"{BASE}/resources/optimize", json={
    "crop":"Rice","soil_type":"Loamy","nitrogen":45,"phosphorus":25,"potassium":35,
    "soil_ph":6.0,"rainfall_mm":900,"fertilizer_used":0,"irrigation_used":1}, headers=H), key="optimization_score")
check("POST /risk/assess",         requests.post(f"{BASE}/risk/assess", json={
    "crop":"Wheat","rainfall_mm":250,"temperature_c":42,"weather_condition":"Stormy",
    "soil_type":"Sandy","region":"West","nitrogen":35,"phosphorus":18,"potassium":25,
    "soil_ph":4.8,"fertilizer_used":0,"irrigation_used":0}, headers=H), key="overall_risk_level")

# ─── New Features ─────────────────────────────────────────────────────────────
print("\n--- New Features ---")

# Feature 3: Save prediction to history
save_payload = {**PREDICT, "predicted_yield_kg_per_acre": YIELD, "model_used": MODEL, "prediction_confidence": CONF}
save_r = check("POST /history/save", requests.post(f"{BASE}/history/save", json=save_payload, headers=H), expected=201, key="id")
saved_id = save_r.json().get("id") if save_r.status_code == 201 else None

# History list
hist_r = check("GET /history", requests.get(f"{BASE}/history", headers=H), key="predictions")
if hist_r.status_code == 200:
    print(f"         Total history records: {hist_r.json()['total']}")

# History filter
check("GET /history?crop=Rice", requests.get(f"{BASE}/history?crop=Rice", headers=H), key="predictions")

# Fetch specific record
if saved_id:
    check(f"GET /history/{saved_id}", requests.get(f"{BASE}/history/{saved_id}", headers=H), key="crop")

# Privacy: register second user and try to access first user's history
uid2 = str(uuid.uuid4())[:8]
requests.post(f"{BASE}/auth/register", json={
    "username": f"other_{uid2}", "email": f"other_{uid2}@test.com",
    "password": "pass12345", "role": "farmer"
})
l2 = requests.post(f"{BASE}/auth/login", json={"username": f"other_{uid2}", "password": "pass12345"})
H2 = {"Authorization": f"Bearer {l2.json().get('access_token','')}"}
if saved_id:
    priv_r = requests.get(f"{BASE}/history/{saved_id}", headers=H2)
    ok_priv = priv_r.status_code == 404
    print(f"  [{'PASS' if ok_priv else 'FAIL'}] Privacy check — user 2 cannot read user 1 record — HTTP {priv_r.status_code}")
    if ok_priv: PASS += 1
    else: FAIL += 1

# Feature 1: PDF report from saved ID
if saved_id:
    pdf_r = requests.get(f"{BASE}/report/{saved_id}", headers=H)
    ok_pdf = pdf_r.status_code == 200 and pdf_r.headers.get("content-type","").startswith("application/pdf")
    print(f"  [{'PASS' if ok_pdf else 'FAIL'}] GET /report/{saved_id} — PDF download — HTTP {pdf_r.status_code} ({len(pdf_r.content)} bytes)")
    if ok_pdf: PASS += 1
    else: FAIL += 1; print(f"         Content-Type: {pdf_r.headers.get('content-type')}")

# PDF live generate
pdf_live_r = requests.post(f"{BASE}/report/generate", json={**PREDICT, "predicted_yield_kg_per_acre": YIELD, "model_used": MODEL, "prediction_confidence": CONF}, headers=H)
ok_pdf2 = pdf_live_r.status_code == 200 and "pdf" in pdf_live_r.headers.get("content-type","")
print(f"  [{'PASS' if ok_pdf2 else 'FAIL'}] POST /report/generate — live PDF — HTTP {pdf_live_r.status_code} ({len(pdf_live_r.content)} bytes)")
if ok_pdf2: PASS += 1
else: FAIL += 1

# Feature 2: AI chatbot
chat_r = check("POST /chatbot/ask", requests.post(f"{BASE}/chatbot/ask",
    json={"message": "What is the best soil pH for rice?", "history": []}, headers=H), key="reply")
if chat_r.status_code == 200:
    print(f"         Reply preview: {chat_r.json()['reply'][:80]}...")

# Empty message
chat_empty = requests.post(f"{BASE}/chatbot/ask", json={"message": "", "history": []}, headers=H)
ok_empty = chat_empty.status_code == 400
print(f"  [{'PASS' if ok_empty else 'FAIL'}] POST /chatbot/ask (empty) — blocks empty messages — HTTP {chat_empty.status_code}")
if ok_empty: PASS += 1
else: FAIL += 1

# ─── Summary ─────────────────────────────────────────────────────────────────
print("\n" + "="*65)
total = PASS + FAIL
print(f"  RESULTS: {PASS}/{total} passed  |  {FAIL} failed")
print("="*65 + "\n")
sys.exit(0 if FAIL == 0 else 1)
