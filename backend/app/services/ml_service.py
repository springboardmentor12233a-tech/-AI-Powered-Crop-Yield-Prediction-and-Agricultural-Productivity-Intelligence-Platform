import os
import joblib
import pandas as pd
import numpy as np

MODELS_DIR = "models"
BEST_MODEL_PATH = os.path.join(MODELS_DIR, "best_model.pkl")
PREPROCESSOR_PATH = os.path.join(MODELS_DIR, "preprocessor.pkl")

class MLService:
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self._load_artifacts()

    def _load_artifacts(self):
        if os.path.exists(BEST_MODEL_PATH) and os.path.exists(PREPROCESSOR_PATH):
            try:
                self.model = joblib.load(BEST_MODEL_PATH)
                self.preprocessor = joblib.load(PREPROCESSOR_PATH)
                print("[MLService] Successfully loaded best_model.pkl and preprocessor.pkl")
            except Exception as e:
                print(f"[MLService] Error loading artifacts: {e}")
                self.model = None
                self.preprocessor = None
        else:
            print("[MLService] Artifacts not found. Run scripts/train_models.py first.")

    def is_ready(self) -> bool:
        return self.model is not None and self.preprocessor is not None

    def predict_yield(self, payload: dict) -> dict:
        if not self.is_ready():
            # Try reloading once in case artifacts were freshly generated
            self._load_artifacts()
            if not self.is_ready() or self.preprocessor is None or self.model is None:
                raise RuntimeError("ML model artifacts missing. Please train the models first.")

        # Ensure exact 14-feature ordering matching training
        feature_order = [
            "crop_type",
            "region",
            "irrigation_type",
            "fertilizer_type",
            "crop_disease_status",
            "soil_pH",
            "soil_moisture_%",
            "temperature_C",
            "rainfall_mm",
            "humidity_%",
            "sunlight_hours",
            "pesticide_usage_ml",
            "total_days",
            "NDVI_index"
        ]

        missing_features = [f for f in feature_order if f not in payload]
        if missing_features:
            raise ValueError(f"Missing required input features: {missing_features}")

        # Construct single-row DataFrame
        input_df = pd.DataFrame([payload])[feature_order]

        # Transform using saved fitted preprocessor
        X_trans = self.preprocessor.transform(input_df)

        # Run inference
        predicted_yield = float(self.model.predict(X_trans)[0])
        predicted_yield_clean = max(0.0, round(predicted_yield, 2))

        # Defensible Productivity Rating (derived from dataset distribution: mean ~4312 kg/ha)
        if predicted_yield_clean < 3500.0:
            productivity_rating = "Low"
        elif 3500.0 <= predicted_yield_clean <= 4800.0:
            productivity_rating = "Medium"
        else:
            productivity_rating = "High"

        # Transparent Risk Rating (derived from agricultural condition checks)
        risk_score = 0
        disease = str(payload.get("crop_disease_status", "None")).strip()
        if disease.lower() != "none" and disease.lower() != "unknown":
            risk_score += 2
        
        temp = float(payload.get("temperature_C", 25.0))
        if temp > 35.0 or temp < 15.0:
            risk_score += 1

        rainfall = float(payload.get("rainfall_mm", 150.0))
        if rainfall < 80.0 or rainfall > 350.0:
            risk_score += 1

        ph = float(payload.get("soil_pH", 6.5))
        if ph < 5.5 or ph > 7.8:
            risk_score += 1

        if risk_score >= 3:
            risk_rating = "High"
        elif risk_score >= 1:
            risk_rating = "Medium"
        else:
            risk_rating = "Low"

        return {
            "predicted_yield_kg_ha": predicted_yield_clean,
            "productivity_rating": productivity_rating,
            "risk_rating": risk_rating
        }

ml_service = MLService()
