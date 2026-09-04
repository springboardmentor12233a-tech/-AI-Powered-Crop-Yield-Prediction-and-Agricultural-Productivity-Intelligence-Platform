import os
import time
import json
import joblib
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from xgboost import XGBRegressor
from lightgbm import LGBMRegressor

def train_and_evaluate():
    print("=" * 75)
    print("YieldSense AI - Milestone 2 ML Training & GridSearchCV Tuning Pipeline")
    print("=" * 75)

    dataset_path = os.path.join("datasets", "processed", "cleaned_crop_yield.csv")
    models_dir = "models"
    os.makedirs(models_dir, exist_ok=True)

    # 1. Dataset Loading & Validation
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Cleaned dataset not found at {dataset_path}")

    df = pd.read_csv(dataset_path)
    print(f"[1/7] Dataset Loaded: Shape {df.shape}")

    # 2. Define 14 Features & Target
    categorical_features = [
        "crop_type",
        "region",
        "irrigation_type",
        "fertilizer_type",
        "crop_disease_status"
    ]
    
    numerical_features = [
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

    target_column = "yield_kg_per_hectare"

    # Verify target is NOT accidentally in feature set
    assert target_column not in categorical_features and target_column not in numerical_features, \
        "Target column must NOT be in feature set!"

    all_required_cols = categorical_features + numerical_features + [target_column]
    for col in all_required_cols:
        if col not in df.columns:
            raise KeyError(f"Required column '{col}' missing from dataset!")

    print(f"[2/7] Verified 14 features ({len(categorical_features)} categorical, {len(numerical_features)} numerical) and target '{target_column}'.")

    X = df[categorical_features + numerical_features]
    y = df[target_column]

    # 3. Build Preprocessing Pipeline (Fitted STRICTLY on X_train only)
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_features),
            ("num", StandardScaler(), numerical_features)
        ],
        remainder="drop"
    )

    # 4. Reproducible Train / Test Split (test_size=0.2, random_state=42)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"[3/7] Train/Test Split: {len(X_train)} train rows, {len(X_test)} test rows (random_state=42).")

    # Fit Preprocessor STRICTLY on X_train
    X_train_trans: np.ndarray = np.asarray(preprocessor.fit_transform(X_train))
    X_test_trans: np.ndarray = np.asarray(preprocessor.transform(X_test))

    # Save Preprocessor Artifact
    preprocessor_path = os.path.join(models_dir, "preprocessor.pkl")
    joblib.dump(preprocessor, preprocessor_path)
    print(f"      Saved fitted preprocessor to: {preprocessor_path}")

    # 5. Define ML Models & GridSearchCV Parameter Grids
    print("[4/7] Executing GridSearchCV Hyperparameter Tuning & Model Benchmarking...")
    
    # GridSearchCV Tuning for Random Forest
    rf_param_grid = {
        'n_estimators': [50, 100],
        'max_depth': [5, 10, None],
        'min_samples_leaf': [2, 4]
    }
    rf_grid = GridSearchCV(RandomForestRegressor(random_state=42), rf_param_grid, cv=3, scoring='neg_root_mean_squared_error')
    rf_grid.fit(X_train_trans, y_train)
    best_rf_model = rf_grid.best_estimator_
    print(f"      -> GridSearchCV Best Random Forest Params: {rf_grid.best_params_}")

    # GridSearchCV Tuning for XGBoost
    xgb_param_grid = {
        'n_estimators': [50, 100],
        'max_depth': [3, 5],
        'learning_rate': [0.03, 0.05]
    }
    xgb_grid = GridSearchCV(XGBRegressor(random_state=42), xgb_param_grid, cv=3, scoring='neg_root_mean_squared_error')
    xgb_grid.fit(X_train_trans, y_train)
    best_xgb_model = xgb_grid.best_estimator_
    print(f"      -> GridSearchCV Best XGBoost Params: {xgb_grid.best_params_}")

    models = {
        "Dummy Regressor (Mean)": (
            DummyRegressor(strategy="mean"),
            os.path.join(models_dir, "crop_yield_dummy.pkl")
        ),
        "Linear Regression": (
            LinearRegression(),
            os.path.join(models_dir, "crop_yield_lr.pkl")
        ),
        "Ridge Regression": (
            Ridge(alpha=10.0, random_state=42),
            os.path.join(models_dir, "crop_yield_ridge.pkl")
        ),
        "Random Forest (GridSearchCV)": (
            best_rf_model,
            os.path.join(models_dir, "crop_yield_rf.pkl")
        ),
        "XGBoost (GridSearchCV)": (
            best_xgb_model,
            os.path.join(models_dir, "crop_yield_xgb.pkl")
        ),
        "LightGBM": (
            LGBMRegressor(learning_rate=0.05, max_depth=5, n_estimators=100, random_state=42, verbosity=-1),
            os.path.join(models_dir, "crop_yield_lgbm.pkl")
        )
    }

    # 6. Evaluate Models on Held-Out Test Set
    metrics_summary = {}
    best_model_name = None
    best_rmse = float("inf")
    best_model_obj = None

    sample_single_input = X_test_trans[:1]

    for name, (model, artifact_path) in models.items():
        # Fit model on training set
        model.fit(X_train_trans, y_train)
        
        # Save individual model artifact
        joblib.dump(model, artifact_path)

        # Predict on Test Set
        y_pred = model.predict(X_test_trans)

        # Calculate Metrics
        mae = round(float(mean_absolute_error(y_test, y_pred)), 2)
        rmse = round(float(np.sqrt(mean_squared_error(y_test, y_pred))), 2)
        r2 = round(float(r2_score(y_test, y_pred)), 4)

        # Measure Inference Latency (ms)
        start_time = time.perf_counter()
        for _ in range(100):
            model.predict(sample_single_input)
        end_time = time.perf_counter()
        latency_ms = round(((end_time - start_time) / 100.0) * 1000.0, 3)

        metrics_summary[name] = {
            "mae": mae,
            "rmse": rmse,
            "r2": r2,
            "inference_latency_ms": latency_ms
        }

        print(f"      -> {name:28s} | RMSE: {rmse:7.2f} | MAE: {mae:7.2f} | R2: {r2:7.4f} | Latency: {latency_ms:.3f} ms")

        # Objective Selection: Lowest RMSE
        if rmse < best_rmse:
            best_rmse = rmse
            best_model_name = name
            best_model_obj = model

    metrics_summary["best_model"] = best_model_name
    metrics_summary["gridsearch_cv_tuning"] = {
        "random_forest_best_params": rf_grid.best_params_,
        "xgboost_best_params": xgb_grid.best_params_
    }
    metrics_summary["metadata"] = {
        "dataset_size": len(df),
        "train_size": len(X_train),
        "test_size": len(X_test),
        "random_state": 42,
        "features": categorical_features + numerical_features,
        "target": target_column,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    print(f"[5/7] Objective Selection -> Best Model: {best_model_name} (Lowest Test RMSE: {best_rmse:.2f})")

    # Save Production Best Model Artifact
    best_model_path = os.path.join(models_dir, "best_model.pkl")
    joblib.dump(best_model_obj, best_model_path)
    print(f"      Saved production best model to: {best_model_path}")

    metrics_json_path = os.path.join(models_dir, "model_performance_metrics.json")
    with open(metrics_json_path, "w", encoding="utf-8") as f:
        json.dump(metrics_summary, f, indent=2)
    print(f"      Saved model performance metrics JSON to: {metrics_json_path}")

    # 7. Artifact Verification
    print("[6/7] Verifying Saved Artifacts Match Evaluation Predictions...")
    loaded_preprocessor = joblib.load(preprocessor_path)
    loaded_model = joblib.load(best_model_path)

    sample_raw_row = X_test.iloc[0:1]
    assert best_model_obj is not None
    pred_array: np.ndarray = np.asarray(best_model_obj.predict(X_test_trans[0:1]))
    eval_pred = float(pred_array[0])

    loaded_trans = loaded_preprocessor.transform(sample_raw_row)
    loaded_pred_array: np.ndarray = np.asarray(loaded_model.predict(loaded_trans))
    loaded_pred = float(loaded_pred_array[0])

    diff = abs(eval_pred - loaded_pred)
    assert diff < 1e-6, f"Artifact prediction mismatch! Eval: {eval_pred}, Loaded: {loaded_pred}"
    print(f"[7/7] ARTIFACT VERIFICATION PASSED: Sample Eval Pred ({eval_pred:.2f}) == Saved Artifact Pred ({loaded_pred:.2f})")

    print("=" * 75)
    print("SUCCESS: ML Training, GridSearchCV Tuning & Verification Complete.")
    print("=" * 75)

if __name__ == "__main__":
    train_and_evaluate()
