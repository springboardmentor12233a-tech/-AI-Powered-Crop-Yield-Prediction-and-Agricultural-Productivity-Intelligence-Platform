import pytest
import time
from fastapi.testclient import TestClient

from src.api.main import app
from src.db.database import (
    init_db,
    create_user,
    authenticate_user,
    get_user_by_id,
    save_user_prediction,
    get_user_prediction_history,
    save_user_recommendation,
    get_user_recommendation_history,
    get_admin_system_stats,
    get_all_farmers,
    update_llm_config,
    get_llm_configs,
    get_active_llm_config
)
from src.analytics.risk_assessment import assess_agricultural_risks
from src.analytics.llm_provider import verify_llm_provider_connection, generate_agricultural_llm_report
from src.api.routers.auth import generate_jwt_token, decode_jwt_token

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_db():
    init_db()

def test_jwt_token_generation_and_verification():
    token = generate_jwt_token(user_id=42, email="farmer@yieldsense.ai", role="farmer")
    assert isinstance(token, str)
    assert len(token.split('.')) == 3
    
    payload = decode_jwt_token(token)
    assert payload is not None
    assert payload["user_id"] == 42
    assert payload["email"] == "farmer@yieldsense.ai"
    assert payload["role"] == "farmer"

def test_admin_and_farmer_role_isolation():
    # 1. Admin login
    admin_login_res = client.post("/api/auth/login", json={
        "email": "admin@yieldsense.ai",
        "password": "admin123"
    })
    assert admin_login_res.status_code == 200
    admin_token = admin_login_res.json()["token"]
    assert admin_login_res.json()["user"]["role"] == "admin"
    
    # 2. Register regular farmer
    farmer_email = f"test_farmer_{int(time.time())}@yieldsense.ai"
    farmer_reg_res = client.post("/api/auth/register", json={
        "email": farmer_email,
        "password": "farmerpass123",
        "full_name": "Ramesh Patel",
        "village": "Green Valley",
        "district": "Pune",
        "state": "Maharashtra"
    })
    assert farmer_reg_res.status_code == 200
    farmer_token = farmer_reg_res.json()["token"]
    assert farmer_reg_res.json()["user"]["role"] == "farmer"
    
    # 3. Farmer attempts to access Admin statistics (Must be rejected with 403)
    farmer_admin_access = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {farmer_token}"})
    assert farmer_admin_access.status_code == 403
    
    # 4. Admin accesses Admin statistics (Must succeed with 200)
    admin_access = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_access.status_code == 200
    assert "total_farmers" in admin_access.json()["stats"]

def test_risk_assessment_calculation():
    # Test High Risk (Low rainfall, no irrigation, monoculture crop)
    high_risk = assess_agricultural_risks(
        crop="Maize",
        soil_ph=4.8,  # Extreme acidity
        soil_type="Clay",
        rainfall_mm=200,  # Severe drought
        temperature_c=38,
        humidity_pct=25,
        fertilizer_kg=350,
        pesticides_kg=40,
        irrigation="Unknown",
        previous_crop="Maize",  # Monoculture
        predicted_yield=1.8
    )
    assert high_risk["overall_risk"] in ["Moderate", "High"]
    assert len(high_risk["risk_factors"]) >= 3
    assert high_risk["risk_score"] >= 4

    # Test Low Risk (Balanced parameters)
    low_risk = assess_agricultural_risks(
        crop="Wheat",
        soil_ph=6.8,
        soil_type="Loam",
        rainfall_mm=650,
        temperature_c=22,
        humidity_pct=60,
        fertilizer_kg=150,
        pesticides_kg=15,
        irrigation="Sprinkler",
        previous_crop="Legume",
        predicted_yield=5.2
    )
    assert low_risk["overall_risk"] == "Low"

def test_llm_provider_switching_and_fallback():
    # Update config to Gemini
    update_llm_config("gemini", "gemini-1.5-flash", api_key="dummy_test_key_gemini", is_active=True)
    active = get_active_llm_config()
    assert active["provider"] == "gemini"
    assert active["is_active"] == 1
    
    # Switch to OpenAI
    update_llm_config("openai", "gpt-4o-mini", api_key="sk-dummy_test_key_openai", is_active=True)
    active_now = get_active_llm_config()
    assert active_now["provider"] == "openai"
    
    # Verify API key masking in admin listing
    configs = get_llm_configs()
    for c in configs:
        assert "api_key" not in c
        assert "masked_key" in c
        
    # Verify report generator fallback works deterministically if key is dummy/offline
    risk_info = assess_agricultural_risks("Wheat", 6.5, "Loam", 600, 22, 60, 150, 15, "Sprinkler", "Maize", 4.5)
    report_out = generate_agricultural_llm_report(
        crop="Wheat",
        region="Region_A",
        soil_type="Loam",
        soil_ph=6.5,
        rainfall_mm=600,
        temperature_c=22,
        humidity_pct=60,
        fertilizer_kg=150,
        pesticides_kg=15,
        irrigation="Sprinkler",
        previous_crop="Maize",
        predicted_yield=4.5,
        risk_data=risk_info
    )
    assert report_out is not None
    assert "content" in report_out
    assert "source" in report_out

def test_contextual_ai_chat_assistant():
    # Register a farmer and perform a chat message
    farmer_email = f"chat_farmer_{int(time.time())}@yieldsense.ai"
    farmer_res = client.post("/api/auth/register", json={
        "email": farmer_email,
        "password": "farmerpass123",
        "full_name": "Kavita Devi",
        "village": "Solapur",
        "district": "Solapur",
        "state": "Maharashtra"
    })
    token = farmer_res.json()["token"]
    
    chat_res = client.post(
        "/api/chat/message",
        json={"message": "What is the best fertilizer management for my loam soil?"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert chat_res.status_code == 200
    data = chat_res.json()
    assert "reply" in data
    assert len(data["reply"]) > 20
    
    # Check chat history endpoint
    hist_res = client.get("/api/chat/history", headers={"Authorization": f"Bearer {token}"})
    assert hist_res.status_code == 200
    assert len(hist_res.json()["messages"]) >= 2

def test_end_to_end_report_and_pdf_generation():
    # 1. Register a farmer
    farmer_email = f"pdf_farmer_{int(time.time())}@yieldsense.ai"
    farmer_res = client.post("/api/auth/register", json={
        "email": farmer_email,
        "password": "farmerpass123",
        "full_name": "Anil Verma",
        "village": "Karnal",
        "district": "Karnal",
        "state": "Haryana"
    })
    token = farmer_res.json()["token"]
    
    # 2. Generate Interactive Report
    report_payload = {
        "Crop": "Wheat",
        "Region": "Region_A",
        "Soil_Type": "Loam",
        "Soil_pH": 6.8,
        "Rainfall_mm": 650.0,
        "Temperature_C": 22.5,
        "Humidity_pct": 60.0,
        "Fertilizer_Used_kg": 180.0,
        "Irrigation": "Sprinkler",
        "Pesticides_Used_kg": 20.0,
        "Planting_Density": 15.0,
        "Previous_Crop": "Maize",
        "field_name": "East Plot"
    }
    
    report_res = client.post(
        "/api/reports/generate",
        json=report_payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert report_res.status_code == 200
    report_data = report_res.json()
    report_id = report_data["report_id"]
    assert report_id.startswith("RPT-")
    assert "risk_assessment" in report_data
    assert "llm_insights" in report_data
    
    # 3. Download generated PDF
    pdf_res = client.get(
        f"/api/reports/{report_id}/pdf",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert pdf_res.content.startswith(b"%PDF-")  # Valid PDF binary signature
    assert len(pdf_res.content) > 1000  # Valid substantial PDF file
