"""
YieldSense AI — Prediction Inference Module
Loads saved best model and preprocessing pipeline to predict crop yield.
"""
import os
import json
import numpy as np
import pandas as pd
import joblib
from typing import Dict

BASE_DIR  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "saved_models")

_pipeline = None
_metadata = None


def _load_artifacts():
    global _pipeline, _metadata
    if _pipeline is None:
        model_path = os.path.join(MODEL_DIR, "best_model.pkl")
        meta_path  = os.path.join(MODEL_DIR, "training_metadata.json")
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Model not found at {model_path}. "
                "Please run: python backend/ml/train.py"
            )
        _pipeline = joblib.load(model_path)
        with open(meta_path) as f:
            _metadata = json.load(f)
    return _pipeline, _metadata


def predict_yield(input_data: dict) -> dict:
    """
    Predict crop yield from input parameters.

    Args:
        input_data: dict with keys matching the training features

    Returns:
        dict with predicted_yield_kg_per_acre, model_used, etc.
    """
    pipeline, metadata = _load_artifacts()

    feature_order = metadata["feature_order"]
    df_input = pd.DataFrame([{col: input_data.get(col) for col in feature_order}])

    # Column name mapping (API uses snake_case, training used specific names)
    col_map = {
        "crop": "Crop",
        "rainfall_mm": "Rainfall_mm",
        "temperature_c": "Temperature_C",
        "fertilizer_used": "Fertilizer_Used",
        "irrigation_used": "Irrigation_Used",
        "weather_condition": "Weather_Condition",
        "soil_type": "Soil_Type",
        "region": "Region",
        "nitrogen": "Nitrogen",
        "phosphorus": "Phosphorus",
        "potassium": "Potassium",
        "soil_ph": "Soil_pH",
    }

    # Build input dataframe with correct column names
    row = {}
    for api_key, df_col in col_map.items():
        row[df_col] = input_data.get(api_key)

    df_input = pd.DataFrame([row])
    df_input = df_input[feature_order]

    prediction = pipeline.predict(df_input)[0]
    prediction = max(0.0, round(float(prediction), 2))

    return {
        "predicted_yield_kg_per_acre": prediction,
        "model_used": metadata["best_model_name"],
        "input_summary": {k: v for k, v in col_map.items()},
        "prediction_confidence": "high" if metadata.get("best_r2", 0) > 0.85 else "medium",
    }


def get_model_info() -> dict:
    """Return metadata about the trained model."""
    _, metadata = _load_artifacts()
    return {
        "best_model": metadata.get("best_model_name"),
        "r2_score": metadata.get("best_r2"),
        "total_training_rows": metadata.get("total_rows"),
        "target_column": metadata.get("target_column"),
    }


def get_comparison_table() -> list:
    """Return the full model comparison table."""
    comparison_path = os.path.join(MODEL_DIR, "model_comparison.json")
    if not os.path.exists(comparison_path):
        return []
    with open(comparison_path) as f:
        return json.load(f)
