import os
import sys
import json
import shutil
from pathlib import Path
from datetime import datetime

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import joblib
import pandas as pd
import numpy as np

from backend.app.ml.train_models import ModelTrainingService


def export_models_directory():
    models_dir = PROJECT_ROOT / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    artifacts_dir = PROJECT_ROOT / "backend" / "app" / "ml" / "artifacts"

    # 1. Ensure models and preprocessors are trained and serialized
    best_model_source = artifacts_dir / "best_model.joblib"
    preprocessor_source = artifacts_dir / "preprocessor.joblib"
    meta_source = artifacts_dir / "preprocessor_metadata.json"
    eval_source = artifacts_dir / "detailed_evaluation_report.json"

    if not best_model_source.exists() or not preprocessor_source.exists():
        print("[*] Artifacts not found. Running ModelTrainingService...")
        trainer = ModelTrainingService()
        trainer.train_and_evaluate()

    # Load best model and preprocessor
    model = joblib.load(best_model_source)
    preprocessor = joblib.load(preprocessor_source)

    # 2. Save directly into models/ with .pkl extensions as requested
    model_dest = models_dir / "crop_yield_model.pkl"
    preprocessor_dest = models_dir / "preprocessing_pipeline.pkl"

    joblib.dump(model, model_dest)
    joblib.dump(preprocessor, preprocessor_dest)
    print(f"[+] Saved model to: {model_dest}")
    print(f"[+] Saved preprocessing pipeline to: {preprocessor_dest}")

    # Also keep a copy inside backend/app/models for internal backend packaging if needed
    backend_models_dir = PROJECT_ROOT / "backend" / "app" / "models"
    backend_models_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, backend_models_dir / "crop_yield_model.pkl")
    joblib.dump(preprocessor, backend_models_dir / "preprocessing_pipeline.pkl")

    # 3. Load preprocessor and evaluation metadata to assemble unified model_metadata.json
    with open(meta_source, "r", encoding="utf-8") as f:
        prep_meta = json.load(f)

    eval_data = {}
    if eval_source.exists():
        with open(eval_source, "r", encoding="utf-8") as f:
            eval_data = json.load(f)

    model_metadata = {
        "model_name": "YieldSense AI Crop Yield Regressor",
        "algorithm": type(model).__name__,
        "version": "2.0.0",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "target_variable": {
            "name": "Yield_kg_per_acre",
            "unit": "kg/acre",
            "converted_unit": "tons/acre (1 ton = 1000 kg)"
        },
        "dataset_summary": prep_meta.get("dataset_info", {}),
        "input_features": {
            "categorical": prep_meta.get("features", {}).get("categorical_columns", []),
            "numerical": prep_meta.get("features", {}).get("numerical_columns", []),
            "total_raw_features": len(prep_meta.get("features", {}).get("categorical_columns", [])) + len(prep_meta.get("features", {}).get("numerical_columns", [])),
            "total_transformed_features": prep_meta.get("features", {}).get("total_transformed_features", 0),
            "transformed_feature_names": prep_meta.get("features", {}).get("transformed_feature_names", [])
        },
        "categorical_valid_values": prep_meta.get("categorical_categories", {}),
        "numerical_scaling_parameters": prep_meta.get("numerical_scaling_parameters", {}),
        "performance_metrics": eval_data.get("metrics", {}).get(type(model).__name__, eval_data.get("metrics", {}).get("Linear Regression", {})),
        "feature_importances": eval_data.get("feature_importances", {}).get(type(model).__name__, eval_data.get("feature_importances", {}).get("Linear Regression", []))
    }

    metadata_dest = models_dir / "model_metadata.json"
    with open(metadata_dest, "w", encoding="utf-8") as f:
        json.dump(model_metadata, f, indent=2)
    print(f"[+] Saved unified metadata to: {metadata_dest}")

    with open(backend_models_dir / "model_metadata.json", "w", encoding="utf-8") as f:
        json.dump(model_metadata, f, indent=2)

    return {
        "model_file": str(model_dest),
        "pipeline_file": str(preprocessor_dest),
        "metadata_file": str(metadata_dest)
    }


if __name__ == "__main__":
    export_models_directory()
