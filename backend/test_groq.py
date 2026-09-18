"""
YieldSense AI — Groq AI Insights Live Test
Tests the /ai-insights endpoint with the real Groq API key.
"""
import urllib.request
import urllib.error
import json
import time

BASE = "http://127.0.0.1:8000"

def post(path, data, token=None):
    body = json.dumps(data).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(BASE + path, data=body, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read()), r.status
    except urllib.error.HTTPError as e:
        try:
            return json.loads(e.read()), e.code
        except Exception:
            return {"error": str(e)}, e.code

def get(path, token=None):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    req = urllib.request.Request(BASE + path, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read()), r.status
    except urllib.error.HTTPError as e:
        try:
            return json.loads(e.read()), e.code
        except Exception:
            return {"error": str(e)}, e.code

# ── Step 1: Register + Login ──────────────────────────────────────────────────
ts = str(int(time.time()))
username = f"groqtest{ts}"

reg, _ = post("/auth/register", {
    "username": username, "email": f"{username}@test.com",
    "password": "testpass123", "role": "farmer"
})

login, s = post("/auth/login", {"username": username, "password": "testpass123"})
token = login.get("access_token", "")
print(f"Auth: {'OK' if token else 'FAILED'} (status={s})")

# ── Step 2: Get a prediction first ────────────────────────────────────────────
pred_input = {
    "crop": "Rice", "rainfall_mm": 950.0, "temperature_c": 28.0,
    "fertilizer_used": 1, "irrigation_used": 1,
    "weather_condition": "Sunny", "soil_type": "Loamy",
    "region": "South", "nitrogen": 90.0, "phosphorus": 55.0,
    "potassium": 65.0, "soil_ph": 6.8
}
pred, s = post("/predict", pred_input, token)
predicted_yield = pred.get("predicted_yield_kg_per_acre", 3500.0)
print(f"ML Prediction: {predicted_yield} kg/acre (status={s})")

# ── Step 3: Test AI Insights ──────────────────────────────────────────────────
print("\nCalling POST /ai-insights with Groq API...\n")
insights_input = {**pred_input, "predicted_yield_kg_per_acre": predicted_yield}
ins, s = post("/ai-insights", insights_input, token)

print(f"Status    : {s}")
print(f"Provider  : {ins.get('provider')}")
print(f"Model     : {ins.get('model')}")
print(f"Disclaimer: {ins.get('disclaimer')}")
print("\n--- AI INSIGHTS ---\n")
print(ins.get("insights", "No insights returned"))
print("\n--- END ---")

if s == 200 and ins.get("insights") and "unavailable" not in ins.get("insights","").lower()[:30]:
    print("\n[PASS] Groq AI insights are WORKING with real API key.")
else:
    print("\n[INFO] Check insights text above for any API errors.")
