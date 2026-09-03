import os
import joblib
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
MODELS_DIR = os.path.join(BASE_DIR, "models")

_YIELD_MODEL = None
_CROP_REC_ARTIFACT = None

def get_yield_model():
    """Loads and caches the crop yield regression pipeline."""
    global _YIELD_MODEL
    if _YIELD_MODEL is None:
        model_path = os.path.join(MODELS_DIR, "yield_model.joblib")
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Yield model artifact not found at {model_path}. Run training pipeline first.")
        _YIELD_MODEL = joblib.load(model_path)
    return _YIELD_MODEL

def get_crop_recommendation_artifact():
    """Loads and caches the crop recommendation classification artifact."""
    global _CROP_REC_ARTIFACT
    if _CROP_REC_ARTIFACT is None:
        model_path = os.path.join(MODELS_DIR, "crop_recommendation_model.joblib")
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Crop recommendation artifact not found at {model_path}. Run training pipeline first.")
        _CROP_REC_ARTIFACT = joblib.load(model_path)
    return _CROP_REC_ARTIFACT

def predict_crop_yield(input_dict: dict) -> float:
    """Runs live inference on the trained yield prediction regression model."""
    model = get_yield_model()
    
    # Required feature order
    feature_cols = [
        "Crop", "Region", "Soil_Type", "Irrigation", "Previous_Crop",
        "Soil_pH", "Rainfall_mm", "Temperature_C", "Humidity_pct",
        "Fertilizer_Used_kg", "Pesticides_Used_kg", "Planting_Density"
    ]
    
    df_in = pd.DataFrame([input_dict])[feature_cols]
    prediction = model.predict(df_in)[0]
    return float(round(prediction, 2))

def predict_crop_recommendation(input_dict: dict, top_k: int = 3) -> list:
    """Runs live inference on the trained crop recommendation classifier, returning top_k candidates with probabilities."""
    artifact = get_crop_recommendation_artifact()
    pipeline = artifact["pipeline"]
    label_encoder = artifact["label_encoder"]
    
    feature_cols = ["Temperature", "Humidity", "pH", "Rainfall"]
    df_in = pd.DataFrame([input_dict])[feature_cols]
    
    # Check if classifier supports predict_proba
    classifier = pipeline.named_steps.get("classifier")
    if hasattr(classifier, "predict_proba"):
        probs = pipeline.predict_proba(df_in)[0]
        top_indices = np.argsort(probs)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            crop_name = label_encoder.inverse_transform([idx])[0]
            confidence = float(round(probs[idx], 4))
            results.append({
                "crop": crop_name,
                "confidence": confidence,
                "confidence_pct": f"{confidence * 100:.1f}%"
            })
        return results
    else:
        pred_idx = pipeline.predict(df_in)[0]
        crop_name = label_encoder.inverse_transform([pred_idx])[0]
        return [{
            "crop": crop_name,
            "confidence": 1.0,
            "confidence_pct": "100.0%"
        }]
