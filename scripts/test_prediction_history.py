import os
import sys
import unittest
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.config import Base, engine, SessionLocal
from backend.app.db.models import User, Prediction, Farm

client = TestClient(app)


class TestPredictionHistoryAuth(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.db = SessionLocal()

        # Clean existing test users & data
        cls.db.query(Prediction).delete()
        cls.db.query(Farm).delete()
        cls.db.query(User).filter(User.email.in_([
            "farmer1@test.com", "farmer2@test.com", "admin@test.com"
        ])).delete()
        cls.db.commit()

        # Register Farmer 1
        res_f1 = client.post("/api/auth/register", json={
            "name": "Farmer One",
            "email": "farmer1@test.com",
            "password": "password123",
            "role": "Farmer"
        })
        assert res_f1.status_code == 200, res_f1.text

        # Register Farmer 2
        res_f2 = client.post("/api/auth/register", json={
            "name": "Farmer Two",
            "email": "farmer2@test.com",
            "password": "password123",
            "role": "Farmer"
        })
        assert res_f2.status_code == 200, res_f2.text

        # Register Admin
        res_adm = client.post("/api/auth/register", json={
            "name": "System Admin",
            "email": "admin@test.com",
            "password": "adminpassword123",
            "role": "Administrator"
        })
        assert res_adm.status_code == 200, res_adm.text

        # Login to obtain JWT tokens
        login_f1 = client.post("/api/auth/login", json={"email": "farmer1@test.com", "password": "password123"})
        cls.token_f1 = login_f1.json()["access_token"]
        cls.headers_f1 = {"Authorization": f"Bearer {cls.token_f1}"}

        login_f2 = client.post("/api/auth/login", json={"email": "farmer2@test.com", "password": "password123"})
        cls.token_f2 = login_f2.json()["access_token"]
        cls.headers_f2 = {"Authorization": f"Bearer {cls.token_f2}"}

        login_adm = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "adminpassword123"})
        cls.token_adm = login_adm.json()["access_token"]
        cls.headers_adm = {"Authorization": f"Bearer {cls.token_adm}"}

        # Create Baseline Predictions in setUpClass:
        # Farmer 1 creates 2 predictions
        p1 = {
            "State": "Karnataka", "Crop": "Soybean", "Soil_Type": "Loamy", "Fertilizer": "DAP",
            "N": 56, "P": 41, "K": 51, "Rainfall_mm": 120, "Temperature_C": 31.06, "Soil_pH": 6.82, "Year": 2024
        }
        res1 = client.post("/api/predictions", json=p1, headers=cls.headers_f1)
        assert res1.status_code == 200, res1.text
        cls.f1_pred1_id = res1.json()["id"]

        p2 = {
            "State": "Punjab", "Crop": "Wheat", "Soil_Type": "Red Soil", "Fertilizer": "Compost",
            "N": 58, "P": 77, "K": 129, "Rainfall_mm": 227, "Temperature_C": 30.85, "Soil_pH": 5.93, "Year": 2024
        }
        res2 = client.post("/api/predictions", json=p2, headers=cls.headers_f1)
        assert res2.status_code == 200, res2.text
        cls.f1_pred2_id = res2.json()["id"]

        # Farmer 2 creates 1 prediction
        p3 = {
            "State": "Andhra Pradesh", "Crop": "Cotton", "Soil_Type": "Clay", "Fertilizer": "Organic",
            "N": 108, "P": 61, "K": 63, "Rainfall_mm": 263, "Temperature_C": 37.03, "Soil_pH": 6.24, "Year": 2024
        }
        res3 = client.post("/api/predictions", json=p3, headers=cls.headers_f2)
        assert res3.status_code == 200, res3.text
        cls.f2_pred_id = res3.json()["id"]

    @classmethod
    def tearDownClass(cls):
        cls.db.query(Prediction).delete()
        cls.db.query(Farm).delete()
        cls.db.query(User).filter(User.email.in_([
            "farmer1@test.com", "farmer2@test.com", "admin@test.com"
        ])).delete()
        cls.db.commit()
        cls.db.close()

    def test_01_unauthenticated_access_rejected(self):
        res = client.get("/api/predictions")
        self.assertEqual(res.status_code, 401)
        res_post = client.post("/api/predictions", json={})
        self.assertEqual(res_post.status_code, 401)
        print("[TEST PASS] Unauthenticated requests rejected with HTTP 401.")

    def test_02_farmer1_prediction_creation_and_fields(self):
        res = client.get(f"/api/predictions/{self.f1_pred1_id}", headers=self.headers_f1)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["crop"], "Soybean")
        self.assertEqual(data["state"], "Karnataka")
        self.assertGreaterEqual(data["predicted_yield_kg"], 0)
        self.assertIn("productivity_category", data)
        self.assertIn("recommendation_summary", data)
        self.assertEqual(data["model_name"], "LinearRegression")
        print("[TEST PASS] Prediction record correctly saved with all metadata & forecast outputs.")

    def test_03_role_filtering_farmer1_isolation(self):
        res = client.get("/api/predictions", headers=self.headers_f1)
        self.assertEqual(res.status_code, 200)
        items = res.json()
        self.assertEqual(len(items), 2)
        ids = [item["id"] for item in items]
        self.assertIn(self.f1_pred1_id, ids)
        self.assertIn(self.f1_pred2_id, ids)
        self.assertNotIn(self.f2_pred_id, ids)
        print("[TEST PASS] Farmer 1 is isolated and only receives their own 2 predictions.")

    def test_04_role_filtering_farmer2_isolation(self):
        res = client.get("/api/predictions", headers=self.headers_f2)
        self.assertEqual(res.status_code, 200)
        items = res.json()
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["id"], self.f2_pred_id)
        print("[TEST PASS] Farmer 2 is isolated and only receives their own 1 prediction.")

    def test_05_role_filtering_admin_sees_all(self):
        res = client.get("/api/predictions", headers=self.headers_adm)
        self.assertEqual(res.status_code, 200)
        items = res.json()
        self.assertEqual(len(items), 3)
        ids = [item["id"] for item in items]
        self.assertIn(self.f1_pred1_id, ids)
        self.assertIn(self.f1_pred2_id, ids)
        self.assertIn(self.f2_pred_id, ids)
        print("[TEST PASS] Administrator has oversight access to view all system predictions (3 total).")

    def test_06_cross_tenant_access_forbidden(self):
        # Farmer 2 tries to read Farmer 1's prediction
        res = client.get(f"/api/predictions/{self.f1_pred1_id}", headers=self.headers_f2)
        self.assertEqual(res.status_code, 403)
        self.assertIn("Permission denied", res.json()["detail"])
        print("[TEST PASS] Farmer 2 accessing Farmer 1 record rejected with HTTP 403 Forbidden.")

    def test_07_cross_tenant_delete_forbidden(self):
        # Farmer 2 tries to delete Farmer 1's prediction
        res = client.delete(f"/api/predictions/{self.f1_pred1_id}", headers=self.headers_f2)
        self.assertEqual(res.status_code, 403)
        self.assertIn("Permission denied", res.json()["detail"])
        print("[TEST PASS] Farmer 2 deleting Farmer 1 record rejected with HTTP 403 Forbidden.")

    def test_08_owner_delete_record(self):
        # Farmer 1 deletes their second prediction
        res = client.delete(f"/api/predictions/{self.f1_pred2_id}", headers=self.headers_f1)
        self.assertEqual(res.status_code, 200)

        # Ensure it is removed
        res_check = client.get(f"/api/predictions/{self.f1_pred2_id}", headers=self.headers_f1)
        self.assertEqual(res_check.status_code, 404)
        print(f"[TEST PASS] Farmer 1 successfully deleted prediction #{self.f1_pred2_id}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
