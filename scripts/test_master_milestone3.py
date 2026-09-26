import os
import sys
import unittest
import json
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.config import Base, engine, SessionLocal
from backend.app.db.models import User, Farm, Crop, Prediction, ChatMessage

client = TestClient(app)


class MasterMilestone3TestSuite(unittest.TestCase):
    """
    Comprehensive End-to-End Master Test Suite for Milestone 3.
    Covers:
    1. Role-based Registration & Authentication (Farmer vs Administrator)
    2. Authentication Durability & Token Verification (/api/auth/me)
    3. Unauthorized & Cross-Tenant Access Protection (401 & 403 Forbidden)
    4. Farmer Dashboard & Personalized Analytics (/api/analytics/farmer)
    5. System Agricultural Analytics & Statistical Distributions (/api/analytics/system)
    6. Agricultural Risk & Insight Engine (/api/insights/analyze)
    7. Agricultural AI Chatbot Engine (/api/chat, query categories, history)
    8. Administrator Dashboard Stats, Telemetry, and User Directory (/api/admin/stats, /api/admin/users)
    9. Prediction Flow & Persistence Lifecycle (/api/predictions)
    10. Milestone 1 & Milestone 2 Full Regression Verification
    """

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.db = SessionLocal()

        # Clean existing test artifacts
        cls.db.query(ChatMessage).delete()
        cls.db.query(Prediction).delete()
        cls.db.query(Crop).delete()
        cls.db.query(Farm).delete()
        cls.db.query(User).filter(User.email.in_([
            "m3_farmer1@test.com", "m3_farmer2@test.com", "m3_admin@test.com"
        ])).delete()
        cls.db.commit()

        # 1. Register Farmer 1
        r_f1 = client.post("/api/auth/register", json={
            "name": "M3 Farmer One", "email": "m3_farmer1@test.com", "password": "password123", "role": "Farmer"
        })
        assert r_f1.status_code == 200, r_f1.text

        # 2. Register Farmer 2
        r_f2 = client.post("/api/auth/register", json={
            "name": "M3 Farmer Two", "email": "m3_farmer2@test.com", "password": "password123", "role": "Farmer"
        })
        assert r_f2.status_code == 200, r_f2.text

        # 3. Register Administrator
        r_adm = client.post("/api/auth/register", json={
            "name": "M3 Super Admin", "email": "m3_admin@test.com", "password": "adminpassword123", "role": "Administrator"
        })
        assert r_adm.status_code == 200, r_adm.text

        # Log in to acquire tokens
        l_f1 = client.post("/api/auth/login", json={"email": "m3_farmer1@test.com", "password": "password123"})
        cls.token_f1 = l_f1.json()["access_token"]
        cls.headers_f1 = {"Authorization": f"Bearer {cls.token_f1}"}

        l_f2 = client.post("/api/auth/login", json={"email": "m3_farmer2@test.com", "password": "password123"})
        cls.token_f2 = l_f2.json()["access_token"]
        cls.headers_f2 = {"Authorization": f"Bearer {cls.token_f2}"}

        l_adm = client.post("/api/auth/login", json={"email": "m3_admin@test.com", "password": "adminpassword123"})
        cls.token_adm = l_adm.json()["access_token"]
        cls.headers_adm = {"Authorization": f"Bearer {cls.token_adm}"}

        # Farmer 1 creates a Farm & Crop
        rf1 = client.post("/api/farms", json={
            "farm_name": "Sunrise Agro", "location": "Mandya, Karnataka", "area": 15.0, "soil_type": "Loamy"
        }, headers=cls.headers_f1)
        cls.f1_farm_id = rf1.json()["id"]

        rc1 = client.post("/api/crops", json={
            "farm_id": cls.f1_farm_id, "crop_name": "Soybean", "season": "Kharif", "historical_yield": 1900.0
        }, headers=cls.headers_f1)
        cls.f1_crop_id = rc1.json()["id"]

        # Farmer 2 creates a Farm & Crop
        rf2 = client.post("/api/farms", json={
            "farm_name": "Golden Fields", "location": "Ludhiana, Punjab", "area": 30.0, "soil_type": "Red Soil"
        }, headers=cls.headers_f2)
        cls.f2_farm_id = rf2.json()["id"]

        rc2 = client.post("/api/crops", json={
            "farm_id": cls.f2_farm_id, "crop_name": "Wheat", "season": "Rabi", "historical_yield": 2500.0
        }, headers=cls.headers_f2)
        cls.f2_crop_id = rc2.json()["id"]

    @classmethod
    def tearDownClass(cls):
        cls.db.query(ChatMessage).delete()
        cls.db.query(Prediction).delete()
        cls.db.query(Crop).delete()
        cls.db.query(Farm).delete()
        cls.db.query(User).filter(User.email.in_([
            "m3_farmer1@test.com", "m3_farmer2@test.com", "m3_admin@test.com"
        ])).delete()
        cls.db.commit()
        cls.db.close()

    # -------------------------------------------------------------
    # 1. ROLE-BASED AUTHENTICATION & TOKEN DURABILITY
    # -------------------------------------------------------------
    def test_01_authentication_and_durability(self):
        # A. Farmer Token Verification
        res_me_f = client.get("/api/auth/me", headers=self.headers_f1)
        self.assertEqual(res_me_f.status_code, 200)
        self.assertEqual(res_me_f.json()["email"], "m3_farmer1@test.com")
        self.assertEqual(res_me_f.json()["role"], "Farmer")

        # B. Administrator Token Verification
        res_me_a = client.get("/api/auth/me", headers=self.headers_adm)
        self.assertEqual(res_me_a.status_code, 200)
        self.assertEqual(res_me_a.json()["email"], "m3_admin@test.com")
        self.assertEqual(res_me_a.json()["role"], "Administrator")

        # C. Invalid / Expired Token returns 401
        res_bad = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid_expired_jwt"})
        self.assertEqual(res_bad.status_code, 401)
        print("[TEST PASS] 1. Role-based Authentication & Durability verified.")

    # -------------------------------------------------------------
    # 2. ROLE-BASED ACCESS CONTROL (FARMER VS ADMIN PERMISSIONS)
    # -------------------------------------------------------------
    def test_02_rbac_protection_and_forbidden_routes(self):
        # A. Farmer attempting to access Admin endpoints MUST receive 403 Forbidden
        res_admin_stats = client.get("/api/admin/stats", headers=self.headers_f1)
        self.assertEqual(res_admin_stats.status_code, 403)
        self.assertIn("restricted to Administrators", res_admin_stats.json()["detail"])

        res_admin_users = client.get("/api/admin/users", headers=self.headers_f1)
        self.assertEqual(res_admin_users.status_code, 403)

        # B. Unauthenticated requests to protected endpoints return 401
        res_unauth_farms = client.get("/api/farms")
        self.assertEqual(res_unauth_farms.status_code, 401)

        res_unauth_stats = client.get("/api/admin/stats")
        self.assertEqual(res_unauth_stats.status_code, 401)
        print("[TEST PASS] 2. RBAC protection & 403 Forbidden enforcement verified.")

    # -------------------------------------------------------------
    # 3. FARMER PERSONAL ANALYTICS
    # -------------------------------------------------------------
    def test_03_farmer_analytics_endpoint(self):
        # Farmer 1 logs a prediction
        pred_payload = {
            "farm_id": self.f1_farm_id,
            "crop_id": self.f1_crop_id,
            "State": "Karnataka",
            "Crop": "Soybean",
            "Soil_Type": "Loamy",
            "Fertilizer": "DAP",
            "N": 56, "P": 41, "K": 51,
            "Rainfall_mm": 120, "Temperature_C": 31.06, "Soil_pH": 6.82, "Year": 2024
        }
        res_p = client.post("/api/predictions", json=pred_payload, headers=self.headers_f1)
        self.assertEqual(res_p.status_code, 200)

        # GET /api/analytics/farmer for Farmer 1
        res_fa = client.get("/api/analytics/farmer", headers=self.headers_f1)
        self.assertEqual(res_fa.status_code, 200)
        data = res_fa.json()

        self.assertEqual(data["total_farms"], 1)
        self.assertEqual(data["total_crops"], 1)
        self.assertGreaterEqual(data["total_predictions"], 1)
        self.assertGreater(data["avg_predicted_yield_kg"], 0)
        self.assertIn("tailored_insights", data)
        self.assertIn("tailored_recommendations", data)
        print(f"[TEST PASS] 3. Farmer Analytics: {data['avg_predicted_yield_kg']} kg/ac avg forecast across {data['total_farms']} farm(s).")

    # -------------------------------------------------------------
    # 4. SYSTEM AGRICULTURAL ANALYTICS & DISTRIBUTIONS
    # -------------------------------------------------------------
    def test_04_system_analytics_endpoint(self):
        res_sa = client.get("/api/analytics/system", headers=self.headers_f1)
        self.assertEqual(res_sa.status_code, 200)
        data = res_sa.json()

        self.assertGreaterEqual(data["total_records_analyzed"], 1500)
        self.assertGreater(data["avg_yield_kg_per_acre"], 0)
        self.assertIn("crop_productivity", data)
        self.assertIn("soil_analytics", data)
        self.assertIn("weather_analytics", data)
        self.assertIn("yield_distribution", data)
        self.assertIn("key_insights", data)

        # Verify crop productivity includes 12 crops
        crop_names = [c["crop_name"] for c in data["crop_productivity"]]
        self.assertIn("Wheat", crop_names)
        self.assertIn("Soybean", crop_names)
        self.assertIn("Cotton", crop_names)
        print(f"[TEST PASS] 4. System Analytics: {data['total_records_analyzed']} records analyzed across {len(crop_names)} crops.")

    # -------------------------------------------------------------
    # 5. AGRICULTURAL RISK & INSIGHT ENGINE
    # -------------------------------------------------------------
    def test_05_risk_and_insight_analysis(self):
        # Case A: Acidic soil + High heat hazard
        hazard_payload = {
            "Crop": "Wheat",
            "Soil_Type": "Red Soil",
            "Fertilizer": "Urea",
            "N": 20, "P": 15, "K": 25,
            "Rainfall_mm": 60, "Temperature_C": 36.5, "Soil_pH": 5.2
        }
        res_risk = client.post("/api/insights/analyze", json=hazard_payload)
        self.assertEqual(res_risk.status_code, 200)
        risk_data = res_risk.json()

        self.assertIn(risk_data["overall_risk_level"], ["Moderate Risk", "High Risk"])
        self.assertGreaterEqual(risk_data["risk_score_percent"], 30.0)
        self.assertGreaterEqual(len(risk_data["risk_factors"]), 2)
        self.assertGreaterEqual(len(risk_data["actionable_recommendations"]), 1)

        # Case B: Optimal conditions
        optimal_payload = {
            "Crop": "Soybean",
            "Soil_Type": "Loamy",
            "Fertilizer": "DAP",
            "N": 60, "P": 40, "K": 60,
            "Rainfall_mm": 160, "Temperature_C": 28.0, "Soil_pH": 6.5
        }
        res_opt = client.post("/api/insights/analyze", json=optimal_payload)
        self.assertEqual(res_opt.status_code, 200)
        opt_data = res_opt.json()
        self.assertEqual(opt_data["overall_risk_level"], "Low Risk")
        self.assertIn("Optimal", opt_data["productivity_forecast"])
        print("[TEST PASS] 5. Agricultural Risk & Insight Engine verified.")

    # -------------------------------------------------------------
    # 6. AGRICULTURAL AI CHATBOT ENGINE
    # -------------------------------------------------------------
    def test_06_agrisense_chatbot_engine_and_history(self):
        # A. Query about Crop Cultivation
        req_crop = {"message": "What is the best fertilizer and soil pH for Soybean?"}
        res_crop = client.post("/api/chat", json=req_crop, headers=self.headers_f1)
        self.assertEqual(res_crop.status_code, 200, f"Failed on crop chat: {res_crop.text}")
        reply_crop = res_crop.json()
        self.assertIn("Soybean", reply_crop["reply"])
        self.assertIn("DAP", reply_crop["reply"])
        self.assertGreaterEqual(len(reply_crop["suggestions"]), 1)

        # B. Query about ML Model Metrics
        req_model = {"message": "Explain the machine learning model accuracy and test RMSE"}
        res_model = client.post("/api/chat", json=req_model, headers=self.headers_f1)
        self.assertEqual(res_model.status_code, 200)
        reply_model = res_model.json()
        self.assertIn("Linear Regression", reply_model["reply"])
        self.assertIn("11,381.99", reply_model["reply"])

        # C. Query Chat History
        res_hist = client.get("/api/chat/history", headers=self.headers_f1)
        self.assertEqual(res_hist.status_code, 200)
        hist_data = res_hist.json()
        self.assertGreaterEqual(len(hist_data), 2)  # User question + bot response

        # D. Clear Chat History
        res_clear = client.delete("/api/chat/history", headers=self.headers_f1)
        self.assertEqual(res_clear.status_code, 200)
        res_hist_after = client.get("/api/chat/history", headers=self.headers_f1)
        self.assertEqual(len(res_hist_after.json()), 0)
        print("[TEST PASS] 6. AgriSense AI Chatbot queries, knowledge base & history verified.")

    # -------------------------------------------------------------
    # 7. ADMINISTRATOR DASHBOARD & USER DIRECTORY
    # -------------------------------------------------------------
    def test_07_administrator_stats_and_users(self):
        # A. GET /api/admin/stats
        res_stats = client.get("/api/admin/stats", headers=self.headers_adm)
        self.assertEqual(res_stats.status_code, 200)
        stats_data = res_stats.json()
        self.assertGreaterEqual(stats_data["total_users"], 3)
        self.assertGreaterEqual(stats_data["total_farmers"], 2)
        self.assertGreaterEqual(stats_data["total_administrators"], 1)
        self.assertGreaterEqual(stats_data["total_farms"], 2)
        self.assertGreaterEqual(stats_data["total_crops"], 2)
        self.assertIn("recent_activity", stats_data)

        # B. GET /api/admin/users
        res_users = client.get("/api/admin/users", headers=self.headers_adm)
        self.assertEqual(res_users.status_code, 200)
        users_list = res_users.json()
        emails = [u["email"] for u in users_list]
        self.assertIn("m3_farmer1@test.com", emails)
        self.assertIn("m3_farmer2@test.com", emails)
        self.assertIn("m3_admin@test.com", emails)
        print(f"[TEST PASS] 7. Administrator Stats & User Directory: {len(users_list)} verified users.")

    # -------------------------------------------------------------
    # 8. PREDICTION HISTORY CRUD & MULTI-TENANT ISOLATION
    # -------------------------------------------------------------
    def test_08_prediction_history_crud(self):
        # Farmer 2 creates prediction
        p2 = {
            "farm_id": self.f2_farm_id,
            "crop_id": self.f2_crop_id,
            "State": "Punjab", "Crop": "Wheat", "Soil_Type": "Red Soil", "Fertilizer": "Compost",
            "N": 58, "P": 77, "K": 129, "Rainfall_mm": 227, "Temperature_C": 30.85, "Soil_pH": 5.93, "Year": 2024
        }
        res_p2 = client.post("/api/predictions", json=p2, headers=self.headers_f2)
        self.assertEqual(res_p2.status_code, 200)
        f2_pid = res_p2.json()["id"]

        # Farmer 1 cannot see Farmer 2's prediction
        res_f1_list = client.get("/api/predictions", headers=self.headers_f1)
        f1_ids = [item["id"] for item in res_f1_list.json()]
        self.assertNotIn(f2_pid, f1_ids)

        # Admin can view all predictions
        res_adm_preds = client.get("/api/predictions", headers=self.headers_adm)
        adm_ids = [item["id"] for item in res_adm_preds.json()]
        self.assertIn(f2_pid, adm_ids)

        # Delete prediction
        res_del = client.delete(f"/api/predictions/{f2_pid}", headers=self.headers_f2)
        self.assertEqual(res_del.status_code, 200)
        print("[TEST PASS] 8. Prediction History CRUD & Multi-Tenant Isolation verified.")

    # -------------------------------------------------------------
    # 9. MILESTONE 1 & 2 REGRESSION (HEALTH, DATASET, MODELS, FARMS)
    # -------------------------------------------------------------
    def test_09_milestone1_and_2_regression(self):
        # A. Health check
        res_h = client.get("/api/health")
        self.assertEqual(res_h.status_code, 200)
        self.assertEqual(res_h.json()["status"], "healthy")
        self.assertEqual(res_h.json()["database"], "connected")

        # B. Dataset endpoint
        res_d = client.get("/api/dataset")
        self.assertEqual(res_d.status_code, 200)
        self.assertEqual(res_d.json()["total_rows"], 1500)

        # C. ML Model Info endpoint
        res_m = client.get("/api/ml/model-info")
        self.assertEqual(res_m.status_code, 200)
        self.assertEqual(res_m.json()["best_model_name"], "LinearRegression")
        self.assertEqual(res_m.json()["model_version"], "2.0.0")

        # D. Real-time Yield Prediction
        pred_in = {
            "State": "Karnataka", "Crop": "Soybean", "Soil_Type": "Loamy", "Fertilizer": "DAP",
            "N": 56, "P": 41, "K": 51, "Rainfall_mm": 120, "Temperature_C": 31.06, "Soil_pH": 6.82, "Year": 2024
        }
        res_py = client.post("/api/predict/yield", json=pred_in)
        self.assertEqual(res_py.status_code, 200)
        self.assertGreater(res_py.json()["predicted_yield_kg_per_acre"], 0)
        print("[TEST PASS] 9. Milestone 1 & 2 Features Regression verified 100% functional.")


if __name__ == "__main__":
    unittest.main(verbosity=2)
