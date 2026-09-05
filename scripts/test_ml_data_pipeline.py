import os
import sys
import unittest
import numpy as np
import pandas as pd
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.services.ml_data_pipeline import MLDataPipeline


class TestMLDataPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pipeline = MLDataPipeline(random_state=42, test_size=0.2)
        cls.results = cls.pipeline.run_pipeline()

    def test_pipeline_execution_status(self):
        self.assertEqual(self.results["status"], "success")

    def test_split_proportions(self):
        # 1500 records -> 1200 train, 300 test (80/20)
        train_rows = self.results["train_shape"][0]
        test_rows = self.results["test_shape"][0]
        self.assertEqual(train_rows, 1200)
        self.assertEqual(test_rows, 300)
        self.assertEqual(train_rows + test_rows, 1500)

    def test_feature_dimensions(self):
        # Transformed features count should match across train and test
        train_cols = self.results["train_shape"][1]
        test_cols = self.results["test_shape"][1]
        self.assertEqual(train_cols, test_cols)
        self.assertGreater(train_cols, 10)
        print(f"[TEST PASS] Total Transformed Feature Dimensions: {train_cols}")

    def test_no_missing_values(self):
        train_df = pd.read_csv(self.results["artifacts"]["train_transformed_path"])
        test_df = pd.read_csv(self.results["artifacts"]["test_transformed_path"])
        self.assertEqual(train_df.isnull().sum().sum(), 0)
        self.assertEqual(test_df.isnull().sum().sum(), 0)

    def test_artifacts_saved(self):
        for key, path_str in self.results["artifacts"].items():
            path = Path(path_str)
            self.assertTrue(path.exists(), f"Artifact {key} not found at {path}")
            self.assertGreater(path.stat().st_size, 0, f"Artifact {key} is empty at {path}")

    def test_single_record_inference(self):
        sample_record = {
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
        transformed = self.pipeline.transform_single_record(sample_record)
        self.assertEqual(transformed.shape, (1, self.results["transformed_features_count"]))
        self.assertFalse(np.isnan(transformed).any())
        print(f"[TEST PASS] Single record inference output vector shape: {transformed.shape}")

    def test_unseen_category_robustness(self):
        # Testing handle_unknown='ignore'
        sample_record_unknown = {
            "State": "UnknownState",
            "Crop": "UnknownCrop",
            "Soil_Type": "UnknownSoil",
            "Fertilizer": "UnknownFertilizer",
            "N": 50,
            "P": 50,
            "K": 50,
            "Rainfall_mm": 100,
            "Temperature_C": 25.0,
            "Soil_pH": 6.5,
            "Year": 2024
        }
        transformed = self.pipeline.transform_single_record(sample_record_unknown)
        self.assertEqual(transformed.shape, (1, self.results["transformed_features_count"]))
        self.assertFalse(np.isnan(transformed).any())
        print("[TEST PASS] Successfully handled unseen categorical levels without crashing.")


if __name__ == "__main__":
    unittest.main(verbosity=2)
