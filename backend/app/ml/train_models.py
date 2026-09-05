import os
import sys
import json
from pathlib import Path
from typing import Dict, Any, Tuple

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import pandas as pd
import numpy as np
import joblib
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.model_selection import cross_val_score, KFold

from backend.app.services.ml_data_pipeline import MLDataPipeline


class ModelTrainingService:
    """
    Milestone 2 Step 2 - Crop Yield Regression Models Training & Benchmarking Service.
    
    Models evaluated:
    1. Linear Regression
    2. Decision Tree Regressor
    3. Random Forest Regressor
    4. Gradient Boosting Regressor
    """

    def __init__(
        self,
        artifacts_dir: Path | None = None,
        random_state: int = 42,
        cv_folds: int = 5
    ):
        base_dir = Path(__file__).resolve().parents[3]
        self.artifacts_dir = artifacts_dir or (base_dir / "backend" / "app" / "ml" / "artifacts")
        self.output_dir = base_dir / "dataset" / "processed"
        self.random_state = random_state
        self.cv_folds = cv_folds

        self.models = {
            "Linear Regression": LinearRegression(),
            "Decision Tree": DecisionTreeRegressor(
                random_state=self.random_state,
                max_depth=10,
                min_samples_split=5
            ),
            "Random Forest": RandomForestRegressor(
                n_estimators=100,
                random_state=self.random_state,
                n_jobs=-1
            ),
            "Gradient Boosting": GradientBoostingRegressor(
                n_estimators=100,
                random_state=self.random_state,
                learning_rate=0.1,
                max_depth=5
            )
        }

    def train_and_evaluate(self) -> Dict[str, Any]:
        print("[*] Running ML Data Pipeline to prepare training & test data...")
        pipeline = MLDataPipeline(random_state=self.random_state, test_size=0.2)
        pipeline_summary = pipeline.run_pipeline()

        # Load raw dataset and split
        df = pipeline.load_data()
        X_train_raw, X_test_raw, y_train, y_test = pipeline.split_data(df)

        # Fit & transform
        X_train_trans, X_test_trans = pipeline.fit_and_transform(X_train_raw, X_test_raw)
        feature_names = pipeline.feature_names_out

        kf = KFold(n_splits=self.cv_folds, shuffle=True, random_state=self.random_state)

        results = {}
        trained_models = {}
        feature_importances = {}

        print(f"\n[*] Training and evaluating {len(self.models)} regression models...")
        print("-" * 80)

        for name, model in self.models.items():
            print(f"--> Training {name}...")
            # Fit on training data
            model.fit(X_train_trans, y_train)
            trained_models[name] = model

            # Predictions
            y_train_pred = model.predict(X_train_trans)
            y_test_pred = model.predict(X_test_trans)

            # Metrics
            train_r2 = float(r2_score(y_train, y_train_pred))
            test_r2 = float(r2_score(y_test, y_test_pred))

            train_mae = float(mean_absolute_error(y_train, y_train_pred))
            test_mae = float(mean_absolute_error(y_test, y_test_pred))

            train_mse = float(mean_squared_error(y_train, y_train_pred))
            test_mse = float(mean_squared_error(y_test, y_test_pred))

            train_rmse = float(np.sqrt(train_mse))
            test_rmse = float(np.sqrt(test_mse))

            # Cross validation on training set
            cv_scores = cross_val_score(model, X_train_trans, y_train, cv=kf, scoring="r2")
            cv_r2_mean = float(np.mean(cv_scores))
            cv_r2_std = float(np.std(cv_scores))

            # Extract feature importance if supported
            if hasattr(model, "feature_importances_"):
                importances = model.feature_importances_
                top_features = sorted(
                    zip(feature_names, [float(x) for x in importances]),
                    key=lambda x: x[1],
                    reverse=True
                )[:10]
                feature_importances[name] = top_features
            elif hasattr(model, "coef_"):
                coefs = model.coef_
                top_features = sorted(
                    zip(feature_names, [float(abs(x)) for x in coefs]),
                    key=lambda x: x[1],
                    reverse=True
                )[:10]
                feature_importances[name] = top_features

            results[name] = {
                "train_r2": round(train_r2, 4),
                "test_r2": round(test_r2, 4),
                "cv_r2_mean": round(cv_r2_mean, 4),
                "cv_r2_std": round(cv_r2_std, 4),
                "train_rmse": round(train_rmse, 2),
                "test_rmse": round(test_rmse, 2),
                "train_mae": round(train_mae, 2),
                "test_mae": round(test_mae, 2),
                "train_mse": round(train_mse, 2),
                "test_mse": round(test_mse, 2),
            }

            print(f"    Test R²: {test_r2:.4f} | Test RMSE: {test_rmse:.2f} | Test MAE: {test_mae:.2f} | CV R²: {cv_r2_mean:.4f} (±{cv_r2_std:.4f})")

        # Determine best model based on Test R2 and Test RMSE
        best_model_name = max(results.keys(), key=lambda k: results[k]["test_r2"])
        best_model = trained_models[best_model_name]

        print("-" * 80)
        print(f"[*] Best Performing Model: {best_model_name} (Test R²: {results[best_model_name]['test_r2']})")

        # Save artifacts
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Save all models
        model_paths = {}
        for name, model in trained_models.items():
            safe_name = name.lower().replace(" ", "_")
            path = self.artifacts_dir / f"{safe_name}.joblib"
            joblib.dump(model, path)
            model_paths[name] = str(path)

        # Save best model explicitly
        best_model_path = self.artifacts_dir / "best_model.joblib"
        joblib.dump(best_model, best_model_path)

        # Save comparison results JSON
        eval_payload = {
            "best_model": best_model_name,
            "metrics": results,
            "feature_importances": feature_importances,
            "dataset": {
                "total_records": len(df),
                "train_records": len(X_train_raw),
                "test_records": len(X_test_raw),
                "features_count": len(feature_names),
                "random_state": self.random_state
            }
        }

        eval_json_path = self.artifacts_dir / "models_evaluation.json"
        with open(eval_json_path, "w", encoding="utf-8") as f:
            json.dump(eval_payload, f, indent=2)

        # Save comparison CSV
        comparison_df = pd.DataFrame.from_dict(results, orient="index")
        comparison_df.index.name = "Model"
        comparison_csv_path = self.output_dir / "models_comparison.csv"
        comparison_df.to_csv(comparison_csv_path)

        return {
            "status": "success",
            "best_model": best_model_name,
            "results": results,
            "model_paths": model_paths,
            "best_model_path": str(best_model_path),
            "eval_json_path": str(eval_json_path),
            "comparison_csv_path": str(comparison_csv_path),
            "feature_importances": feature_importances
        }


if __name__ == "__main__":
    service = ModelTrainingService()
    service.train_and_evaluate()
