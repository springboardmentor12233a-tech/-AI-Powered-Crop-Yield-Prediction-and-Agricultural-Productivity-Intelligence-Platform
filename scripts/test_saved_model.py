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

from backend.app.services.prediction_service import PredictionService


class TestSavedModel(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.models_dir = PROJECT_ROOT / "models"
        cls.model_path = cls.models_dir / "crop_yield_model.pkl"
        cls.pipeline_path = cls.models_dir / "preprocessing_pipeline.pkl"
        cls.metadata_path = cls.models_dir / "model_metadata.json"

        cls.service = PredictionService(cls.models_dir)

    def test_files_exist(self):
        self.assertTrue(self.model_path.exists(), "crop_yield_model.pkl does not exist in models/")
        self.assertTrue(self.pipeline_path.exists(), "preprocessing_pipeline.pkl does not exist in models/")
        self.assertTrue(self.metadata_path.exists(), "model_metadata.json does not exist in models/")

    def test_metadata_content(self):
        with open(self.metadata_path, "r", encoding="utf-8") as f:
            meta = json.load(f)

        self.assertEqual(meta["model_name"], "YieldSense AI Crop Yield Regressor")
        self.assertIn("target_variable", meta)
        self.assertIn("input_features", meta)
        self.assertIn("categorical", meta["input_features"])
        self.assertIn("numerical", meta["input_features"])
        self.assertEqual(len(meta["input_features"]["categorical"]), 4)
        self.assertEqual(len(meta["input_features"]["numerical"]), 7)
        print(f"[TEST PASS] Metadata verified: {meta['algorithm']} v{meta['version']}")

    def test_single_prediction_karnataka_soybean(self):
        test_input = {
            "State": "Karnataka",
            "Crop": "Soybean",
            "Soil_Type": "Loamy",
            "Fertilizer": "DAP",
            "N": 56,
            "P": 41,
            "K": 51,
            "Rainfall_mm": 120,
            "Temperature_C": 31.06,
            "Soil_pH": 6.82,
            "Year": 2024
        }
        res = self.service.predict_single(test_input)
        self.assertIn("predicted_yield_kg_per_acre", res)
        self.assertIn("predicted_yield_tons_per_acre", res)
        self.assertIsInstance(res["predicted_yield_kg_per_acre"], (int, float))
        self.assertGreaterEqual(res["predicted_yield_kg_per_acre"], 0)
        self.assertIn("productivity_category", res)
        self.assertIn("recommendation_summary", res)
        print(f"[TEST PASS] Prediction Result for Karnataka Soybean: {res['predicted_yield_kg_per_acre']} kg/acre ({res['predicted_yield_tons_per_acre']} tons/acre) [{res['productivity_category']}]")

    def test_single_prediction_punjab_wheat(self):
        test_input = {
            "State": "Punjab",
            "Crop": "Wheat",
            "Soil_Type": "Red Soil",
            "Fertilizer": "Compost",
            "N": 58,
            "P": 77,
            "K": 129,
            "Rainfall_mm": 227,
            "Temperature_C": 30.85,
            "Soil_pH": 5.93,
            "Year": 2024
        }
        res = self.service.predict_single(test_input)
        self.assertGreater(res["predicted_yield_kg_per_acre"], 0)
        print(f"[TEST PASS] Prediction Result for Punjab Wheat: {res['predicted_yield_kg_per_acre']} kg/acre ({res['predicted_yield_tons_per_acre']} tons/acre)")

    def test_batch_prediction(self):
        batch_inputs = [
            {
                "State": "Andhra Pradesh",
                "Crop": "Cotton",
                "Soil_Type": "Clay",
                "Fertilizer": "Organic",
                "N": 108,
                "P": 61,
                "K": 63,
                "Rainfall_mm": 263,
                "Temperature_C": 37.03,
                "Soil_pH": 6.24,
                "Year": 2024
            },
            {
                "State": "Kerala",
                "Crop": "Tea",
                "Soil_Type": "Red Soil",
                "Fertilizer": "Urea",
                "N": 112,
                "P": 89,
                "K": 112,
                "Rainfall_mm": 140,
                "Temperature_C": 32.94,
                "Soil_pH": 7.25,
                "Year": 2024
            }
        ]
        batch_res = self.service.predict_batch(batch_inputs)
        self.assertEqual(len(batch_res), 2)
        for idx, item in enumerate(batch_res):
            self.assertGreaterEqual(item["predicted_yield_kg_per_acre"], 0)
            print(f"[TEST PASS] Batch #{idx+1} Output: {item['predicted_yield_kg_per_acre']} kg/acre")

    def test_unknown_categorical_level_handling(self):
        unknown_input = {
            "State": "NonExistentState",
            "Crop": "ExoticCrop",
            "Soil_Type": "Volcanic",
            "Fertilizer": "Biochar",
            "N": 70,
            "P": 60,
            "K": 100,
            "Rainfall_mm": 180,
            "Temperature_C": 28.0,
            "Soil_pH": 6.8,
            "Year": 2024
        }
        res = self.service.predict_single(unknown_input)
        self.assertIsNotNone(res["predicted_yield_kg_per_acre"])
        print(f"[TEST PASS] Unseen input gracefully handled: {res['predicted_yield_kg_per_acre']} kg/acre")


if __name__ == "__main__":
    unittest.main(verbosity=2)
