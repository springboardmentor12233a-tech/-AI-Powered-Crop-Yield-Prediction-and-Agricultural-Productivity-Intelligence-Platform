"""
YieldSense AI — Automated Integration Test Suite for Live Weather & Crop Doctor
Tests new endpoints and verifies zero regressions on existing backend APIs.
"""
from fastapi.testclient import TestClient
import sys, os
import io

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from main import app
from db.database import create_tables, SessionLocal, User
from auth_utils import create_access_token, hash_password

create_tables()

# Register testuser in DB for FK / auth reference
db = SessionLocal()
if not db.query(User).filter(User.username == "testuser").first():
    test_u = User(username="testuser", email="test@yieldsense.com", hashed_password=hash_password("pass123"), role="farmer")
    db.add(test_u)
    db.commit()
db.close()

client = TestClient(app)

# Helper token generator
def get_auth_headers():
    token = create_access_token(data={"sub": "testuser", "user_id": 1})
    return {"Authorization": f"Bearer {token}"}


def test_weather_search():
    response = client.get("/weather/search?query=London")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "latitude" in data[0]
        assert "longitude" in data[0]
        assert "display_name" in data[0]


def test_weather_current():
    response = client.get("/weather/current?latitude=28.6139&longitude=77.2090&location=New%20Delhi")
    assert response.status_code == 200
    data = response.json()
    assert data["location"] == "New Delhi"
    assert "temperature_c" in data
    assert "humidity_percent" in data
    assert "weather_condition" in data


def test_weather_forecast():
    response = client.get("/weather/forecast?latitude=28.6139&longitude=77.2090&crop=Wheat")
    assert response.status_code == 200
    data = response.json()
    assert "current" in data
    assert "daily" in data
    assert "hourly" in data
    assert "farming_recommendations" in data
    assert isinstance(data["farming_recommendations"], list)
    assert len(data["farming_recommendations"]) > 0


def test_crop_doctor_invalid_file_type():
    headers = get_auth_headers()
    file_data = io.BytesIO(b"fake txt content")
    response = client.post(
        "/crop-doctor/analyze",
        headers=headers,
        files={"file": ("test.txt", file_data, "text/plain")}
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


def test_crop_doctor_history_empty():
    headers = get_auth_headers()
    response = client.get("/crop-doctor/history", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert data["service"] == "YieldSense AI Backend"
