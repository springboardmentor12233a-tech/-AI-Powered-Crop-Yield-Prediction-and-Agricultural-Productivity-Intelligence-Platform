"""
YieldSense AI — Backend API Test Suite
Tests all endpoints end-to-end.
"""
import urllib.request
import urllib.error
import json
import sys
import time

BASE = "http://127.0.0.1:8000"
PASS = []
FAIL = []

def post(path, data, token=None):
    body = json.dumps(data).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(BASE + path, data=body, headers=headers)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read()), r.status
    except urllib.error.HTTPError as e:
        body = e.read()
        try:
            return json.loads(body), e.code
        except Exception:
            return {"raw": body.decode("utf-8", errors="replace")}, e.code

def get(path, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(BASE + path, headers=headers)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read()), r.status
    except urllib.error.HTTPError as e:
        body = e.read()
        try:
            return json.loads(body), e.code
        except Exception:
            return {"raw": body.decode("utf-8", errors="replace")}, e.code

def ok(name, cond, info=""):
    if cond:
        PASS.append(name)
        print(f"  [PASS] {name}" + (f" — {info}" if info else ""))
    else:
        FAIL.append(name)
        print(f"  [FAIL] {name}" + (f" — {info}" if info else ""))

# ─── 1. Health ────────────────────────────────────────────────────────────────
print("\n=== 1. HEALTH CHECK ===")
h, s = get("/health")
ok("GET /health", s == 200, h.get("status"))

# ─── 2. Register ─────────────────────────────────────────────────────────────
print("\n=== 2. REGISTER ===")
ts = str(int(time.time()))
reg, s = post("/auth/register", {
    "username": f"farmer{ts}", "email": f"farmer{ts}@test.com",
    "password": "testpass123", "role": "farmer", "farm_name": "Test Farm"
})
ok("POST /auth/register", s == 201, f"username={reg.get('username','ERR')} status={s}")
username = f"farmer{ts}"

# ─── 3. Login ────────────────────────────────────────────────────────────────
print("\n=== 3. LOGIN ===")
login, s = post("/auth/login", {"username": username, "password": "testpass123"})
token = login.get("access_token", "")
ok("POST /auth/login", s == 200 and bool(token), f"token={'OK' if token else 'MISSING'} status={s}")

# ─── 4. Get /me ───────────────────────────────────────────────────────────────
print("\n=== 4. AUTH /me ===")
me, s = get("/auth/me", token)
ok("GET /auth/me", s == 200 and me.get("username") == username, f"username={me.get('username')} status={s}")

# ─── 5. Predict ──────────────────────────────────────────────────────────────
print("\n=== 5. YIELD PREDICTION ===")
pred_data = {
    "crop": "Rice", "rainfall_mm": 900.0, "temperature_c": 27.0,
    "fertilizer_used": 1, "irrigation_used": 1,
    "weather_condition": "Sunny", "soil_type": "Loamy",
    "region": "North", "nitrogen": 80.0, "phosphorus": 50.0,
    "potassium": 60.0, "soil_ph": 6.5
}
pred, s = post("/predict", pred_data, token)
yield_val = pred.get("predicted_yield_kg_per_acre")
model_name = pred.get("model_used")
ok("POST /predict", s == 200 and yield_val is not None,
   f"yield={yield_val} kg/acre  model={model_name}  status={s}")

# ─── 6. Model Info ───────────────────────────────────────────────────────────
print("\n=== 6. MODEL INFO ===")
minfo, s = get("/model-info", token)
ok("GET /model-info", s == 200 and minfo.get("best_model"),
   f"best={minfo.get('best_model')}  R2={minfo.get('r2_score')}  status={s}")

# ─── 7. Model Comparison ─────────────────────────────────────────────────────
print("\n=== 7. MODEL COMPARISON ===")
mc, s = get("/model-comparison", token)
models = mc.get("models", [])
ok("GET /model-comparison", s == 200 and len(models) > 0, f"{len(models)} models  status={s}")
for m in sorted(models, key=lambda x: x["r2_score"], reverse=True):
    print(f"    {m['model_name']:<25} R2={m['r2_score']:.4f}  MAE={m['mae']:.2f}  RMSE={m['rmse']:.2f}")

# ─── 8. Weather Analysis ─────────────────────────────────────────────────────
print("\n=== 8. WEATHER ANALYSIS ===")
w, s = get("/weather/analysis", token)
ok("GET /weather/analysis", s == 200 and "correlations" in w,
   f"records={w.get('total_records_analyzed')}  rain_corr={w.get('correlations',{}).get('rainfall_vs_yield')}  status={s}")

# ─── 9. Soil Analysis ────────────────────────────────────────────────────────
print("\n=== 9. SOIL ANALYSIS ===")
sl, s = get("/soil/analysis", token)
ok("GET /soil/analysis", s == 200 and "nutrient_yield_correlation" in sl,
   f"top_soil={sl.get('top_soil_type_by_yield')}  n_corr={sl.get('nutrient_yield_correlation',{}).get('nitrogen_vs_yield')}  status={s}")

# ─── 10. AI Insights (no key — graceful fallback) ────────────────────────────
print("\n=== 10. AI INSIGHTS (fallback test) ===")
insights_data = {**pred_data, "predicted_yield_kg_per_acre": yield_val or 3000.0}
ins, s = post("/ai-insights", insights_data, token)
ok("POST /ai-insights", s == 200 and "insights" in ins,
   f"provider={ins.get('provider')}  status={s}")

# ─── Summary ─────────────────────────────────────────────────────────────────
print(f"\n{'='*50}")
print(f"RESULTS: {len(PASS)} passed, {len(FAIL)} failed")
if FAIL:
    print(f"FAILED: {', '.join(FAIL)}")
    sys.exit(1)
else:
    print("ALL TESTS PASSED")
    sys.exit(0)
