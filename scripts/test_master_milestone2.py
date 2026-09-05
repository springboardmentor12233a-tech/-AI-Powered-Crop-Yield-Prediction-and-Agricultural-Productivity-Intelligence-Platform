import os
import sys
import unittest
import json
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import joblib
import pandas as pd
import numpy as np
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.db.config import Base, engine, SessionLocal
from backend.app.db.models import User, Farm, Crop, Prediction
from backend.app.services.prediction_service import PredictionService

client = TestClient(app)


class MasterMilestone2TestSuite(unittest.TestCase):
    """
    Comprehensive End-to-End Master Test Suite for Milestone 2.
    Covers:
    1. Model loading & artifact verification
    2. Valid predictions across multiple crops & states
    3. Invalid input validation (bounds, negative nutrients, non-numeric)
    4. Missing input validation
    5. Prediction APIs (predict/yield, predict/metadata, ml/model-info)
    6. Authentication & JWT security
    7. Farmer authorization & multi-tenant isolation
    8. Administrator global oversight access
    9. Prediction history CRUD
    10. Milestone 1 regression (health, dataset, farms, crops)
    """

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.db = SessionLocal()

        # Clean any old test users
        cls.db.query(Prediction).delete()
        cls.db.query(Crop).delete()
        cls.db.query(Farm).delete()
        cls.db.query(User).filter(User.email.in_([
            "m2_farmer1@test.com", "m2_farmer2@test.com", "m2_admin@test.com"
        ])).delete()
        cls.db.commit()

        # Register Farmer 1
        r_f1 = client.post("/api/auth/register", json={
            "name": "M2 Farmer One", "email": "m2_farmer1@test.com", "password": "password123", "role": "Farmer"
        })
        assert r_f1.status_code == 200, r_f1.text

        # Register Farmer 2
        r_f2 = client.post("/api/auth/register", json={
            "name": "M2 Farmer Two", "email": "m2_farmer2@test.com", "password": "password123", "role": "Farmer"
        })
        assert r_f2.status_code == 200, r_f2.text

        # Register Administrator
        r_adm = client.post("/api/auth/register", json={
            "name": "M2 Administrator", "email": "m2_admin@test.com", "password": "adminpassword123", "role": "Administrator"
        })
        assert r_adm.status_code == 200, r_adm.text

        # Log in to get tokens
        l_f1 = client.post("/api/auth/login", json={"email": "m2_farmer1@test.com", "password": "password123"})
        cls.token_f1 = l_f1.json()["access_token"]
        cls.headers_f1 = {"Authorization": f"Bearer {cls.token_f1}"}

        l_f2 = client.post("/api/auth/login", json={"email": "m2_farmer2@test.com", "password": "password123"})
        cls.token_f2 = l_f2.json()["access_token"]
        cls.headers_f2 = {"Authorization": f"Bearer {cls.token_f2}"}

        l_adm = client.post("/api/auth/login", json={"email": "m2_admin@test.com", "password": "adminpassword123"})
        cls.token_adm = l_adm.json()["access_token"]
        cls.headers_adm = {"Authorization": f"Bearer {cls.token_adm}"}

        # Farmer 1 creates a Farm & Crop
        rf = client.post("/api/farms", json={
            "farm_name": "Green Acres", "location": "Mandya, Karnataka", "area": 12.5, "soil_type": "Loamy"
        }, headers=cls.headers_f1)
        cls.f1_farm_id = rf.json()["id"]

        rc = client.post("/api/crops", json={
            "farm_id": cls.f1_farm_id, "crop_name": "Soybean", "season": "Kharif", "historical_yield": 1800.0
        }, headers=cls.headers_f1)
        cls.f1_crop_id = rc.json()["id"]

        # Farmer 2 creates a Farm & Crop
        rf2 = client.post("/api/farms", json={
            "farm_name": "River Valley", "location": "Ludhiana, Punjab", "area": 25.0, "soil_type": "Red Soil"
        }, headers=cls.headers_f2)
        cls.f2_farm_id = rf2.json()["id"]

        rc2 = client.post("/api/crops", json={
            "farm_id": cls.f2_farm_id, "crop_name": "Wheat", "season": "Rabi", "historical_yield": 2400.0
        }, headers=cls.headers_f2)
        cls.f2_crop_id = rc2.json()["id"]

    @classmethod
    def tearDownClass(cls):
        cls.db.query(Prediction).delete()
        cls.db.query(Crop).delete()
        cls.db.query(Farm).delete()
        cls.db.query(User).filter(User.email.in_([
            "m2_farmer1@test.com", "m2_farmer2@test.com", "m2_admin@test.com"
        ])).delete()
        cls.db.commit()
        cls.db.close()

    # -------------------------------------------------------------
    # 1. MODEL LOADING & ARTIFACTS
    # -------------------------------------------------------------
    def test_01_model_loading_and_pipeline_structure(self):
        models_dir = PROJECT_ROOT / "models"
        model_file = models_dir / "crop_yield_model.pkl"
        pipeline_file = models_dir / "preprocessing_pipeline.pkl"
        metadata_file = models_dir / "model_metadata.json"

        self.assertTrue(model_file.exists(), "crop_yield_model.pkl is missing in models/")
        self.assertTrue(pipeline_file.exists(), "preprocessing_pipeline.pkl is missing in models/")
        self.assertTrue(metadata_file.exists(), "model_metadata.json is missing in models/")

        model = joblib.load(model_file)
        pipeline = joblib.load(pipeline_file)

        self.assertTrue(hasattr(model, "predict"), "Model object has no predict method")
        self.assertTrue(hasattr(pipeline, "transform"), "Pipeline object has no transform method")
        print("[TEST PASS] 1. Model & Preprocessing Pipeline loaded successfully from models/")

    # -------------------------------------------------------------
    # 2. VALID PREDICTION TESTING
    # -------------------------------------------------------------
    def test_02_valid_predictions_multiple_scenarios(self):
        test_cases = [
            {
                "payload": {
                    "State": "Karnataka", "Crop": "Soybean", "Soil_Type": "Loamy", "Fertilizer": "DAP",
                    "N": 56, "P": 41, "K": 51, "Rainfall_mm": 120, "Temperature_C": 31.06, "Soil_pH": 6.82, "Year": 2024
                },
                "name": "Karnataka Soybean"
            },
            {
                "payload": {
                    "State": "Punjab", "Crop": "Wheat", "Soil_Type": "Red Soil", "Fertilizer": "Compost",
                    "N": 58, "P": 77, "K": 129, "Rainfall_mm": 227, "Temperature_C": 30.85, "Soil_pH": 5.93, "Year": 2022
                },
                "name": "Punjab Wheat"
            },
            {
                "payload": {
                    "State": "Andhra Pradesh", "Crop": "Cotton", "Soil_Type": "Clay", "Fertilizer": "Organic",
                    "N": 108, "P": 61, "K": 63, "Rainfall_mm": 263, "Temperature_C": 37.03, "Soil_pH": 6.24, "Year": 2024
                },
                "name": "AP Cotton"
            }
        ]

        for tc in test_cases:
            res = client.post("/api/predict/yield", json=tc["payload"])
            self.assertEqual(res.status_code, 200, f"Failed on {tc['name']}: {res.text}")
            data = res.json()
            self.assertGreaterEqual(data["predicted_yield_kg_per_acre"], 0)
            self.assertGreaterEqual(data["predicted_yield_tons_per_acre"], 0)
            self.assertIn("productivity_category", data)
            self.assertIn("recommendation_summary", data)
            self.assertEqual(data["model_version"], "2.0.0")
            print(f"[TEST PASS] 2. Valid Prediction ({tc['name']}): {data['predicted_yield_kg_per_acre']} kg/acre")

    # -------------------------------------------------------------
    # 3. INVALID INPUT VALIDATION (BOUNDS & NEGATIVE VALUES)
    # -------------------------------------------------------------
    def test_03_invalid_input_rejections(self):
        base_payload = {
            "State": "Karnataka", "Crop": "Soybean", "Soil_Type": "Loamy", "Fertilizer": "DAP",
            "N": 56, "P": 41, "K": 51, "Rainfall_mm": 120, "Temperature_C": 31.06, "Soil_pH": 6.82, "Year": 2024
        }

        # Case A: Soil pH > 14
        bad_ph_high = dict(base_payload, Soil_pH=16.5)
        res_ph_h = client.post("/api/predict/yield", json=bad_ph_high)
        self.assertEqual(res_ph_h.status_code, 422)

        # Case B: Soil pH < 0
        bad_ph_low = dict(base_payload, Soil_pH=-1.2)
        res_ph_l = client.post("/api/predict/yield", json=bad_ph_low)
        self.assertEqual(res_ph_l.status_code, 422)

        # Case C: Negative Nitrogen
        bad_n = dict(base_payload, N=-5.0)
        res_n = client.post("/api/predict/yield", json=bad_n)
        self.assertEqual(res_n.status_code, 422)

        # Case D: Negative Rainfall
        bad_rain = dict(base_payload, Rainfall_mm=-20.0)
        res_rain = client.post("/api/predict/yield", json=bad_rain)
        self.assertEqual(res_rain.status_code, 422)

        # Case E: String passed for numerical field
        bad_type = dict(base_payload, Temperature_C="VeryHot")
        res_type = client.post("/api/predict/yield", json=bad_type)
        self.assertEqual(res_type.status_code, 422)

        print("[TEST PASS] 3. Invalid inputs properly caught and rejected with HTTP 422.")

    # -------------------------------------------------------------
    # 4. MISSING INPUT VALIDATION
    # -------------------------------------------------------------
    def test_04_missing_input_fields_rejection(self):
        # Missing 'Crop'
        payload_no_crop = {
            "State": "Karnataka", "Soil_Type": "Loamy", "Fertilizer": "DAP",
            "N": 56, "P": 41, "K": 51, "Rainfall_mm": 120, "Temperature_C": 31.06, "Soil_pH": 6.82
        }
        res_no_crop = client.post("/api/predict/yield", json=payload_no_crop)
        self.assertEqual(res_no_crop.status_code, 422)

        # Missing 'N'
        payload_no_n = {
            "State": "Karnataka", "Crop": "Soybean", "Soil_Type": "Loamy", "Fertilizer": "DAP",
            "P": 41, "K": 51, "Rainfall_mm": 120, "Temperature_C": 31.06, "Soil_pH": 6.82
        }
        res_no_n = client.post("/api/predict/yield", json=payload_no_n)
        self.assertEqual(res_no_n.status_code, 422)
        print("[TEST PASS] 4. Missing required input fields rejected with HTTP 422.")

    # -------------------------------------------------------------
    # 5. PREDICTION & MODEL INFO APIS
    # -------------------------------------------------------------
    def test_05_prediction_and_model_info_apis(self):
        # GET /api/predict/metadata
        res_meta = client.get("/api/predict/metadata")
        self.assertEqual(res_meta.status_code, 200)
        meta_data = res_meta.json()
        self.assertEqual(meta_data["algorithm"], "LinearRegression")
        self.assertEqual(meta_data["version"], "2.0.0")

        # GET /api/ml/model-info
        res_info = client.get("/api/ml/model-info")
        self.assertEqual(res_info.status_code, 200)
        info_data = res_info.json()
        self.assertEqual(info_data["best_model_name"], "LinearRegression")
        self.assertEqual(info_data["dataset_size"], 1500)
        self.assertEqual(info_data["train_samples"], 1200)
        self.assertEqual(info_data["test_samples"], 300)
        self.assertEqual(info_data["number_of_features"], 11)
        self.assertEqual(info_data["total_transformed_features"], 43)
        self.assertAlmostEqual(info_data["mae"], 4273.23, places=2)
        self.assertAlmostEqual(info_data["rmse"], 11381.99, places=2)
        self.assertAlmostEqual(info_data["r2"], 0.0029, places=4)
        print("[TEST PASS] 5. GET /api/ml/model-info returned exact verified metrics.")

    # -------------------------------------------------------------
    # 6. AUTHENTICATION & TOKEN VALIDATION
    # -------------------------------------------------------------
    def test_06_authentication_workflows(self):
        # A. Duplicate email registration blocked
        res_dup = client.post("/api/auth/register", json={
            "name": "Dup User", "email": "m2_farmer1@test.com", "password": "password123", "role": "Farmer"
        })
        self.assertEqual(res_dup.status_code, 400)
        self.assertIn("Email already registered", res_dup.json()["detail"])

        # B. Wrong password login fails
        res_wrong_pw = client.post("/api/auth/login", json={
            "email": "m2_farmer1@test.com", "password": "wrongpassword"
        })
        self.assertEqual(res_wrong_pw.status_code, 401)

        # C. Non-existent user login fails
        res_no_user = client.post("/api/auth/login", json={
            "email": "ghost@test.com", "password": "pass"
        })
        self.assertEqual(res_no_user.status_code, 401)

        # D. GET /api/auth/me with valid token
        res_me = client.get("/api/auth/me", headers=self.headers_f1)
        self.assertEqual(res_me.status_code, 200)
        self.assertEqual(res_me.json()["email"], "m2_farmer1@test.com")
        self.assertEqual(res_me.json()["role"], "Farmer")

        # E. GET /api/auth/me with bogus token
        res_bad_token = client.get("/api/auth/me", headers={"Authorization": "Bearer bogusjwttoken123"})
        self.assertEqual(res_bad_token.status_code, 401)
        print("[TEST PASS] 6. Authentication security & JWT verification functional.")

    # -------------------------------------------------------------
    # 7. FARMER AUTHORIZATION & MULTI-TENANT ISOLATION
    # -------------------------------------------------------------
    def test_07_farmer_authorization_and_isolation(self):
        # Farmer 1 creates a prediction
        p1 = {
            "farm_id": self.f1_farm_id,
            "crop_id": self.f1_crop_id,
            "State": "Karnataka", "Crop": "Soybean", "Soil_Type": "Loamy", "Fertilizer": "DAP",
            "N": 56, "P": 41, "K": 51, "Rainfall_mm": 120, "Temperature_C": 31.06, "Soil_pH": 6.82, "Year": 2024
        }
        res_p1 = client.post("/api/predictions", json=p1, headers=self.headers_f1)
        self.assertEqual(res_p1.status_code, 200)
        f1_pred_id = res_p1.json()["id"]

        # Farmer 2 creates a prediction
        p2 = {
            "farm_id": self.f2_farm_id,
            "crop_id": self.f2_crop_id,
            "State": "Punjab", "Crop": "Wheat", "Soil_Type": "Red Soil", "Fertilizer": "Compost",
            "N": 58, "P": 77, "K": 129, "Rainfall_mm": 227, "Temperature_C": 30.85, "Soil_pH": 5.93, "Year": 2024
        }
        res_p2 = client.post("/api/predictions", json=p2, headers=self.headers_f2)
        self.assertEqual(res_p2.status_code, 200)
        f2_pred_id = res_p2.json()["id"]

        # Farmer 1 only sees f1_pred_id
        res_f1_list = client.get("/api/predictions", headers=self.headers_f1)
        f1_ids = [item["id"] for item in res_f1_list.json()]
        self.assertIn(f1_pred_id, f1_ids)
        self.assertNotIn(f2_pred_id, f1_ids)

        # Farmer 2 only sees f2_pred_id
        res_f2_list = client.get("/api/predictions", headers=self.headers_f2)
        f2_ids = [item["id"] for item in res_f2_list.json()]
        self.assertIn(f2_pred_id, f2_ids)
        self.assertNotIn(f1_pred_id, f2_ids)

        # Farmer 2 forbidden from accessing Farmer 1's prediction
        res_cross_get = client.get(f"/api/predictions/{f1_pred_id}", headers=self.headers_f2)
        self.assertEqual(res_cross_get.status_code, 403)

        # Farmer 2 forbidden from deleting Farmer 1's prediction
        res_cross_del = client.delete(f"/api/predictions/{f1_pred_id}", headers=self.headers_f2)
        self.assertEqual(res_cross_del.status_code, 403)

        # Farmer 2 forbidden from associating with Farmer 1's farm
        bad_farm_pred = dict(p2, farm_id=self.f1_farm_id)
        res_bad_farm = client.post("/api/predictions", json=bad_farm_pred, headers=self.headers_f2)
        self.assertEqual(res_bad_farm.status_code, 403)
        print("[TEST PASS] 7. Farmer authorization & strict tenant isolation verified.")

    # -------------------------------------------------------------
    # 8. ADMINISTRATOR GLOBAL OVERSIGHT ACCESS
    # -------------------------------------------------------------
    def test_08_admin_global_access(self):
        # Admin can view all farms
        res_farms = client.get("/api/farms", headers=self.headers_adm)
        self.assertEqual(res_farms.status_code, 200)
        farm_ids = [f["id"] for f in res_farms.json()]
        self.assertIn(self.f1_farm_id, farm_ids)
        self.assertIn(self.f2_farm_id, farm_ids)

        # Admin can view all crops
        res_crops = client.get("/api/crops", headers=self.headers_adm)
        self.assertEqual(res_crops.status_code, 200)
        crop_ids = [c["id"] for c in res_crops.json()]
        self.assertIn(self.f1_crop_id, crop_ids)
        self.assertIn(self.f2_crop_id, crop_ids)

        # Admin can view all predictions
        res_preds = client.get("/api/predictions", headers=self.headers_adm)
        self.assertEqual(res_preds.status_code, 200)
        self.assertGreaterEqual(len(res_preds.json()), 2)
        print("[TEST PASS] 8. Administrator global oversight access verified.")

    # -------------------------------------------------------------
    # 9. PREDICTION HISTORY CRUD
    # -------------------------------------------------------------
    def test_09_prediction_history_lifecycle(self):
        # Create
        payload = {
            "State": "Gujarat", "Crop": "Wheat", "Soil_Type": "Red Soil", "Fertilizer": "Compost",
            "N": 58, "P": 77, "K": 129, "Rainfall_mm": 227, "Temperature_C": 30.85, "Soil_pH": 5.93, "Year": 2024
        }
        res_create = client.post("/api/predictions", json=payload, headers=self.headers_f1)
        self.assertEqual(res_create.status_code, 200)
        pred_id = res_create.json()["id"]

        # Read
        res_read = client.get(f"/api/predictions/{pred_id}", headers=self.headers_f1)
        self.assertEqual(res_read.status_code, 200)
        self.assertEqual(res_read.json()["crop"], "Wheat")

        # Delete
        res_del = client.delete(f"/api/predictions/{pred_id}", headers=self.headers_f1)
        self.assertEqual(res_del.status_code, 200)

        # Verify 404 after deletion
        res_read_after = client.get(f"/api/predictions/{pred_id}", headers=self.headers_f1)
        self.assertEqual(res_read_after.status_code, 404)
        print("[TEST PASS] 9. Prediction history CRUD lifecycle verified.")

    # -------------------------------------------------------------
    # 10. MILESTONE 1 REGRESSION TESTING
    # -------------------------------------------------------------
    def test_10_milestone1_regression(self):
        # A. Health Check
        res_h = client.get("/api/health")
        self.assertEqual(res_h.status_code, 200)
        self.assertEqual(res_h.json()["status"], "healthy")
        self.assertEqual(res_h.json()["database"], "connected")

        # B. Dataset inspection endpoint
        res_d = client.get("/api/dataset")
        self.assertEqual(res_d.status_code, 200)
        self.assertEqual(res_d.json()["total_rows"], 1500)
        self.assertEqual(len(res_d.json()["columns"]), 12)

        # C. Farm size validation (area must be > 0)
        bad_farm = {"farm_name": "Zero Area", "location": "Test", "area": 0.0, "soil_type": "Loamy"}
        res_bad_f = client.post("/api/farms", json=bad_farm, headers=self.headers_f1)
        self.assertEqual(res_bad_f.status_code, 422)

        negative_farm = {"farm_name": "Negative Area", "location": "Test", "area": -5.0, "soil_type": "Loamy"}
        res_neg_f = client.post("/api/farms", json=negative_farm, headers=self.headers_f1)
        self.assertEqual(res_neg_f.status_code, 422)
        print("[TEST PASS] 10. Milestone 1 features & validations verified intact.")


if __name__ == "__main__":
    unittest.main(verbosity=2)
