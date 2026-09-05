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

client = TestClient(app)


class TestPredictAPI(unittest.TestCase):
    def test_health_check(self):
        response = client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "healthy")

    def test_predict_yield_valid_input(self):
        payload = {
            "State": "Karnataka",
            "Crop": "Soybean",
            "Soil_Type": "Loamy",
            "Fertilizer": "DAP",
            "N": 56.0,
            "P": 41.0,
            "K": 51.0,
            "Rainfall_mm": 120.0,
            "Temperature_C": 31.06,
            "Soil_pH": 6.82,
            "Year": 2024
        }
        response = client.post("/api/predict/yield", json=payload)
        self.assertEqual(response.status_code, 200, response.text)
        
        data = response.json()
        self.assertIn("predicted_yield_kg_per_acre", data)
        self.assertIn("predicted_yield_tons_per_acre", data)
        self.assertIn("productivity_category", data)
        self.assertIn("recommendation_summary", data)
        self.assertIn("model_version", data)
        self.assertIn("algorithm_used", data)
        self.assertGreaterEqual(data["predicted_yield_kg_per_acre"], 0)
        print(f"[TEST PASS] POST /api/predict/yield successful: {data['predicted_yield_kg_per_acre']} kg/acre ({data['predicted_yield_tons_per_acre']} tons/acre)")

    def test_predict_yield_punjab_wheat(self):
        payload = {
            "State": "Punjab",
            "Crop": "Wheat",
            "Soil_Type": "Red Soil",
            "Fertilizer": "Compost",
            "N": 58.0,
            "P": 77.0,
            "K": 129.0,
            "Rainfall_mm": 227.0,
            "Temperature_C": 30.85,
            "Soil_pH": 5.93,
            "Year": 2022
        }
        response = client.post("/api/predict/yield", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(data["predicted_yield_kg_per_acre"], 0)
        print(f"[TEST PASS] POST /api/predict/yield (Punjab Wheat): {data['predicted_yield_kg_per_acre']} kg/acre")

    def test_predict_validation_invalid_ph(self):
        # Soil pH must be between 0 and 14
        invalid_payload = {
            "State": "Karnataka",
            "Crop": "Soybean",
            "Soil_Type": "Loamy",
            "Fertilizer": "DAP",
            "N": 56.0,
            "P": 41.0,
            "K": 51.0,
            "Rainfall_mm": 120.0,
            "Temperature_C": 31.06,
            "Soil_pH": 18.5,  # Invalid pH > 14
            "Year": 2024
        }
        response = client.post("/api/predict/yield", json=invalid_payload)
        self.assertEqual(response.status_code, 422)
        print("[TEST PASS] Validation rejected invalid pH (> 14) with HTTP 422.")

    def test_predict_validation_negative_nitrogen(self):
        # N cannot be negative
        invalid_payload = {
            "State": "Karnataka",
            "Crop": "Soybean",
            "Soil_Type": "Loamy",
            "Fertilizer": "DAP",
            "N": -10.0,  # Invalid N < 0
            "P": 41.0,
            "K": 51.0,
            "Rainfall_mm": 120.0,
            "Temperature_C": 31.06,
            "Soil_pH": 6.82,
            "Year": 2024
        }
        response = client.post("/api/predict/yield", json=invalid_payload)
        self.assertEqual(response.status_code, 422)
        print("[TEST PASS] Validation rejected negative Nitrogen (< 0) with HTTP 422.")

    def test_get_model_metadata(self):
        response = client.get("/api/predict/metadata")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("model_name", data)
        self.assertIn("algorithm", data)
        self.assertIn("input_features", data)
        print(f"[TEST PASS] GET /api/predict/metadata returned model: {data['algorithm']}")

    def test_get_ml_model_info(self):
        response = client.get("/api/ml/model-info")
        self.assertEqual(response.status_code, 200, response.text)
        data = response.json()
        
        # Verify required Milestone 2 Step 6 fields
        self.assertIn("best_model_name", data)
        self.assertIn("dataset_size", data)
        self.assertIn("number_of_features", data)
        self.assertIn("mae", data)
        self.assertIn("rmse", data)
        self.assertIn("r2", data)
        self.assertIn("model_version", data)

        # Validate exact types and values
        self.assertEqual(data["dataset_size"], 1500)
        self.assertEqual(data["train_samples"], 1200)
        self.assertEqual(data["test_samples"], 300)
        self.assertEqual(data["number_of_features"], 11)
        self.assertEqual(data["total_transformed_features"], 43)
        self.assertAlmostEqual(data["mae"], 4273.23, places=2)
        self.assertAlmostEqual(data["rmse"], 11381.99, places=2)
        self.assertAlmostEqual(data["r2"], 0.0029, places=4)
        self.assertEqual(data["model_version"], "2.0.0")

        print("\n[TEST PASS] GET /api/ml/model-info Payload:")
        print(f"  - Best Model: {data['best_model_name']}")
        print(f"  - Model Version: {data['model_version']}")
        print(f"  - Dataset Size: {data['dataset_size']} (Train: {data['train_samples']}, Test: {data['test_samples']})")
        print(f"  - Features: {data['number_of_features']} raw ({data['total_transformed_features']} transformed)")
        print(f"  - Test MAE: {data['mae']:.2f} kg/acre")
        print(f"  - Test RMSE: {data['rmse']:.2f} kg/acre")
        print(f"  - Test R²: {data['r2']:.4f}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
