import os
import sys
import json
from pathlib import Path
from typing import Dict, Any, List, Union, Optional

import pandas as pd
import numpy as np
import joblib

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


class PredictionService:
    """
    Production Prediction Service for YieldSense AI.
    Loads the serialized model and preprocessing pipeline from models/
    to perform single or batch crop yield forecasts.
    """

    def __init__(self, models_dir: Optional[Path] = None):
        if models_dir:
            self.models_dir = Path(models_dir)
        else:
            # Check models/ at project root first, fallback to backend/app/models
            root_models = PROJECT_ROOT / "models"
            backend_models = PROJECT_ROOT / "backend" / "app" / "models"
            self.models_dir = root_models if root_models.exists() else backend_models

        self.model_path = self.models_dir / "crop_yield_model.pkl"
        self.pipeline_path = self.models_dir / "preprocessing_pipeline.pkl"
        self.metadata_path = self.models_dir / "model_metadata.json"

        self.model = None
        self.preprocessor = None
        self.metadata = {}

        self._load_artifacts()

    def _load_artifacts(self):
        if not self.model_path.exists():
            raise FileNotFoundError(f"Model file not found at {self.model_path}")
        if not self.pipeline_path.exists():
            raise FileNotFoundError(f"Preprocessing pipeline not found at {self.pipeline_path}")

        self.model = joblib.load(self.model_path)
        self.preprocessor = joblib.load(self.pipeline_path)

        if self.metadata_path.exists():
            with open(self.metadata_path, "r", encoding="utf-8") as f:
                self.metadata = json.load(f)

    def get_metadata(self) -> Dict[str, Any]:
        return self.metadata

    def predict_single(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes crop yield prediction for a single farm/crop record.
        
        Expected keys in input_data:
        - State (str)
        - Crop (str)
        - Soil_Type (str)
        - Fertilizer (str)
        - N (float/int)
        - P (float/int)
        - K (float/int)
        - Rainfall_mm (float/int)
        - Temperature_C (float/int)
        - Soil_pH (float/int)
        - Year (int, optional - defaults to current year)
        """
        df_input = pd.DataFrame([input_data])
        
        if "Year" not in df_input.columns:
            df_input["Year"] = 2026

        # Transform using preprocessing ColumnTransformer
        X_trans = self.preprocessor.transform(df_input)

        # Predict
        pred_yield_kg = float(self.model.predict(X_trans)[0])
        # Ensure yield cannot physically be negative
        pred_yield_kg_clamped = max(0.0, pred_yield_kg)
        pred_yield_tons = round(pred_yield_kg_clamped / 1000.0, 3)

        # Productivity classification
        if pred_yield_kg_clamped < 1000:
            category = "Low Yield"
            advice = "Consider soil nutrient enhancement (N-P-K balance) and supplemental irrigation to improve productivity."
        elif pred_yield_kg_clamped <= 3500:
            category = "Optimal Yield"
            advice = "Nutrient and climate conditions are in an optimal operational window for this crop variety."
        else:
            category = "High Productivity Yield"
            advice = "Exceptional yield profile expected under these conditions. Ensure pest control is maintained."

        return {
            "predicted_yield_kg_per_acre": round(pred_yield_kg_clamped, 2),
            "predicted_yield_tons_per_acre": pred_yield_tons,
            "raw_prediction_kg": round(pred_yield_kg, 2),
            "productivity_category": category,
            "recommendation_summary": advice,
            "model_version": self.metadata.get("version", "2.0.0"),
            "algorithm_used": type(self.model).__name__,
            "inputs_received": input_data
        }

    def predict_batch(self, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Executes predictions for a batch list of records."""
        return [self.predict_single(r) for r in records]
