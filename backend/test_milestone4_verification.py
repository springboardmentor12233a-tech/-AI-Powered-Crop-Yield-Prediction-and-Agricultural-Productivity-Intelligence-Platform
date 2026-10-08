import atexit
import json
import os
import secrets
import uuid

import requests
from database import db_cursor

BASE_URL = os.getenv("YIELDSENSE_API_BASE_URL", "http://127.0.0.1:8000")
ADMIN_EMAIL = os.getenv("YIELDSENSE_ADMIN_EMAIL", "admin@yieldsense.local")
ADMIN_PASSWORD = os.getenv("YIELDSENSE_ADMIN_PASSWORD")
if not ADMIN_PASSWORD:
    raise SystemExit("Set YIELDSENSE_ADMIN_PASSWORD to run admin verification.")

results = []
created_user_ids = []


def cleanup_test_data():
    if not created_user_ids:
        return
    placeholders = ", ".join(["%s"] * len(created_user_ids))
    with db_cursor() as cursor:
        cursor.execute(f"DELETE FROM predictions WHERE user_id IN ({placeholders})", created_user_ids)
        cursor.execute(f"DELETE FROM users WHERE id IN ({placeholders})", created_user_ids)


atexit.register(cleanup_test_data)


def record(name, ok, detail=""):
    print(f"{name}: {'PASS' if ok else 'FAIL'} {detail}".strip())
    results.append({"name": name, "ok": bool(ok), "detail": detail})


def get_json(response):
    try:
        return response.json()
    except ValueError:
        return {"raw": response.text}


def request(method, path, *, token=None, payload=None, expected_status=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    response = requests.request(method, f"{BASE_URL}{path}", headers=headers, json=payload, timeout=30)
    result = get_json(response)
    if expected_status is not None:
        ok = response.status_code == expected_status
        return ok, response, result
    return True, response, result


farmer_email = f"farmer-{uuid.uuid4()}@yieldsense.local"
farmer_name = "Local Farmer"
farmer_password = secrets.token_urlsafe(24)
farmer_token = None
admin_token = None
other_token = None
other_prediction_id = None

# 1. farmer registration
ok, resp, body = request("POST", "/api/auth/register", payload={"name": farmer_name, "email": farmer_email, "password": farmer_password, "role": "admin"}, expected_status=200)
record("farmer registration", ok, f"status={resp.status_code}")
farmer_id = body.get("user", {}).get("id")
if farmer_id:
    created_user_ids.append(farmer_id)
record("public registration cannot create admin", body.get("user", {}).get("role") == "farmer")

# 2. duplicate registration
ok, resp, body = request("POST", "/api/auth/register", payload={"name": farmer_name, "email": farmer_email, "password": farmer_password}, expected_status=409)
record("duplicate registration", ok, f"status={resp.status_code}")

# 3. farmer login
ok, resp, body = request("POST", "/api/auth/login", payload={"email": farmer_email, "password": farmer_password}, expected_status=200)
if ok:
    farmer_token = body.get("access_token")
    record("farmer login", True, f"role={body.get('user', {}).get('role')}")
else:
    record("farmer login", False, f"status={resp.status_code}")

# 4. admin login
ok, resp, body = request("POST", "/api/auth/login", payload={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, expected_status=200)
if ok:
    admin_token = body.get("access_token")
    record("admin login", True, f"role={body.get('user', {}).get('role')}")
else:
    record("admin login", False, f"status={resp.status_code}")

# 5. auth me
ok, resp, body = request("GET", "/api/auth/me", token=farmer_token, expected_status=200)
record("/api/auth/me", ok and body.get("created_at") and "password_hash" not in body, f"status={resp.status_code}")

# 6. invalid JWT
ok, resp, body = request("GET", "/api/auth/me", token="invalid-token", expected_status=401)
record("invalid JWT", ok, f"status={resp.status_code}")

# 7. invalid password
ok, resp, body = request("POST", "/api/auth/login", payload={"email": farmer_email, "password": "WrongPassword!"}, expected_status=401)
record("invalid password", ok, f"status={resp.status_code}")

# 8. missing JWT
ok, resp, body = request("GET", "/api/admin/users", expected_status=401)
record("missing JWT", ok, f"status={resp.status_code}")

# 9. farmer accessing admin endpoint
ok, resp, body = request("GET", "/api/admin/users", token=farmer_token, expected_status=403)
record("farmer accessing admin endpoint", ok, f"status={resp.status_code}")

# 10. admin accessing admin endpoint
ok, resp, body = request("GET", "/api/admin/users", token=admin_token, expected_status=200)
record("admin accessing admin endpoint", ok, f"status={resp.status_code}")

# 11. admin users endpoint
ok, resp, body = request("GET", "/api/admin/users", token=admin_token, expected_status=200)
record("admin users endpoint", ok and all("password_hash" not in user and "password" not in user for user in body.get("items", [])), f"count={len(body.get('items', []))}")

# 12. admin prediction endpoint
ok, resp, body = request("GET", "/api/admin/predictions", token=admin_token, expected_status=200)
record("admin predictions endpoint", ok, f"count={len(body.get('items', []))}")

# 13. admin analytics
ok, resp, body = request("GET", "/api/admin/analytics/summary", token=admin_token, expected_status=200)
record("admin analytics", ok, f"summary_keys={sorted(body.keys())[:5]}")

# 14. existing prediction API
prediction_payload = {
    "Year": 2024,
    "State": "West Bengal",
    "District": "Nadia",
    "Crop": "Rice",
    "Season": "Kharif",
    "Area": 100,
    "Annual_Rainfall": 1200,
    "Fertilizer": 200,
    "Pesticide": 15,
}
ok, resp, body = request("POST", "/api/predict", token=farmer_token, payload=prediction_payload, expected_status=200)
record("existing prediction API", ok, f"status={resp.status_code}")
farmer_prediction_id = body.get("prediction_id")

# 15. create a second farmer and verify per-user prediction isolation
other_email = f"farmer-{uuid.uuid4()}@yieldsense.local"
other_password = secrets.token_urlsafe(24)
ok, resp, body = request("POST", "/api/auth/register", payload={"name": "Second Local Farmer", "email": other_email, "password": other_password}, expected_status=200)
other_farmer_id = body.get("user", {}).get("id")
if other_farmer_id:
    created_user_ids.append(other_farmer_id)
record("second farmer registration", ok and body.get("user", {}).get("role") == "farmer", f"status={resp.status_code}")
ok, resp, body = request("POST", "/api/auth/login", payload={"email": other_email, "password": other_password}, expected_status=200)
if ok:
    other_token = body.get("access_token")
    record("second farmer login", body.get("user", {}).get("role") == "farmer")
else:
    record("second farmer login", False, f"status={resp.status_code}")
ok, resp, body = request("POST", "/api/predict", token=other_token, payload={**prediction_payload, "Crop": "Wheat"}, expected_status=200)
other_prediction_id = body.get("prediction_id")
record("second farmer prediction", ok, f"status={resp.status_code}")
ok, resp, body = request("GET", "/api/analytics/history", token=farmer_token, expected_status=200)
first_history_ids = {row.get("prediction_id") for row in body.get("items", [])}
record("farmer history is account-scoped", ok and farmer_prediction_id in first_history_ids and other_prediction_id not in first_history_ids)
ok, resp, body = request("GET", "/api/analytics/history", token=other_token, expected_status=200)
second_history_ids = {row.get("prediction_id") for row in body.get("items", [])}
record("second farmer history is account-scoped", ok and other_prediction_id in second_history_ids and farmer_prediction_id not in second_history_ids)
ok, resp, body = request("GET", f"/api/admin/users/{farmer_id}/predictions", token=admin_token, expected_status=200)
record("admin user-specific prediction history", ok and all(row.get("user_id") == farmer_id for row in body.get("items", [])))
ok, resp, body = request("GET", "/api/admin/predictions", token=admin_token, expected_status=200)
admin_prediction_ids = {row.get("prediction_id") for row in body.get("items", [])}
record("admin sees both farmers' predictions", ok and farmer_prediction_id in admin_prediction_ids and other_prediction_id in admin_prediction_ids)
ok, resp, body = request("POST", "/api/recommendations", token=farmer_token, payload={"crop": "Rice", "state": "West Bengal", "season": "Kharif", "prediction_id": other_prediction_id}, expected_status=404)
record("farmer cannot use another user's recommendation context", ok, f"status={resp.status_code}")
ok, resp, body = request("POST", "/api/predict", token=admin_token, payload=prediction_payload, expected_status=403)
record("admin cannot create farmer prediction", ok, f"status={resp.status_code}")
ok, resp, body = request("POST", "/api/predict", payload=prediction_payload, expected_status=401)
record("prediction API requires authentication", ok, f"status={resp.status_code}")

# 16. analytics API summary
ok, resp, body = request("GET", "/api/analytics/summary", token=farmer_token, expected_status=200)
record("analytics summary", ok, f"status={resp.status_code}")

# 17. analytics history
ok, resp, body = request("GET", "/api/analytics/history", token=farmer_token, expected_status=200)
record("analytics history", ok, f"items={len(body.get('items', []))}")

# 18. analytics crops
ok, resp, body = request("GET", "/api/analytics/crops", token=farmer_token, expected_status=200)
record("analytics crops", ok, f"items={len(body.get('items', []))}")

# 19. analytics seasons
ok, resp, body = request("GET", "/api/analytics/seasons", token=farmer_token, expected_status=200)
record("analytics seasons", ok, f"items={len(body.get('items', []))}")

# 20. report summary
ok, resp, body = request("GET", "/api/reports/summary", token=farmer_token, expected_status=200)
record("report summary", ok, f"status={resp.status_code}")

# 21. recommendation API
recommendation_payload = {
    "crop": "Rice",
    "state": "West Bengal",
    "district": "Nadia",
    "season": "Kharif",
    "predictedYield": 4.5,
    "weather": {"temperature": 30, "humidity": 68},
    "soil": {"parameters": {"ph": 6.5, "moisture": 46, "nitrogen": 180, "phosphorus": 28, "potassium": 180}},
    "weatherAnalysis": {"risk": "low"},
    "soilAnalysis": {"health": "good"},
    "detectedRisks": [],
}
ok, resp, body = request("POST", "/api/recommendations", token=farmer_token, payload=recommendation_payload, expected_status=200)
record("recommendation API", ok, f"status={resp.status_code}")

# 22. risk API
ok, resp, body = request("POST", "/api/risk", token=farmer_token, payload={"predicted_yield": 4.5}, expected_status=200)
record("risk API", ok and body.get("overall_risk") in {"Low", "Moderate", "High", "Unavailable"}, f"status={resp.status_code}")

# 23. actual and empty-result PDF reports
pdf_response = requests.get(f"{BASE_URL}/api/reports/pdf", headers={"Authorization": f"Bearer {farmer_token}"}, timeout=30)
record("PDF report content", pdf_response.status_code == 200 and pdf_response.headers.get("content-type", "").startswith("application/pdf") and pdf_response.content.startswith(b"%PDF-"))
empty_pdf = requests.get(f"{BASE_URL}/api/reports/pdf?crop=NoSuchCropForVerification", headers={"Authorization": f"Bearer {farmer_token}"}, timeout=30)
record("PDF report with empty filters", empty_pdf.status_code == 200 and empty_pdf.content.startswith(b"%PDF-"))

# 24. final summary
base_total = len(results)
passed = sum(1 for item in results if item["ok"])
record("overall verification", passed == base_total, f"passed={passed}/{base_total}")

print("RESULTS", json.dumps(results, indent=2))
raise SystemExit(0 if passed == base_total else 1)
