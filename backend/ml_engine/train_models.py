import os
import json
import joblib
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import r2_score, mean_absolute_error, root_mean_squared_error
from xgboost import XGBRegressor

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "crop_yield_train.csv"))
MODELS_DIR = os.path.join(BASE_DIR, "saved_models")
os.makedirs(MODELS_DIR, exist_ok=True)

def train():
    print(f"Loading agricultural dataset from {DATA_PATH}...")
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    print(f"Dataset loaded successfully with {len(df)} samples and {df.shape[1]} columns.")

    # Target and Features
    target = 'yield_tpha'
    
    # Feature columns based on Kaggle & FAO/USDA indicators
    numeric_features = [
        'soil_ph', 'soil_moisture', 'avg_temperature', 'total_rainfall',
        'fertilizer_amount', 'pesticide_usage', 'sunlight_hours',
        'nitrogen_content', 'phosphorus_content', 'potassium_content',
        'irrigation_frequency'
    ]
    
    categorical_features = ['crop_type', 'region', 'season']

    # Filter available columns
    available_num = [c for c in numeric_features if c in df.columns]
    available_cat = [c for c in categorical_features if c in df.columns]

    X = df[available_num + available_cat].copy()
    y = df[target].copy()

    # Handle any null values
    for col in available_num:
        X[col] = X[col].fillna(X[col].median())
    for col in available_cat:
        X[col] = X[col].fillna(X[col].mode()[0])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print(f"Training set: {len(X_train)} samples, Test set: {len(X_test)} samples.")

    # Preprocessing Pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), available_num),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), available_cat)
        ]
    )

    preprocessor.fit(X_train)
    X_train_proc = preprocessor.transform(X_train)
    X_test_proc = preprocessor.transform(X_test)

    # 1. Train XGBoost Model
    print("Training XGBoost Regressor...")
    xgb = XGBRegressor(
        n_estimators=180,
        learning_rate=0.08,
        max_depth=6,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        n_jobs=-1
    )
    xgb.fit(X_train_proc, y_train)
    y_pred_xgb = xgb.predict(X_test_proc)

    r2_xgb = float(r2_score(y_test, y_pred_xgb))
    mae_xgb = float(mean_absolute_error(y_test, y_pred_xgb))
    rmse_xgb = float(root_mean_squared_error(y_test, y_pred_xgb))

    print(f"XGBoost Results -> R2: {r2_xgb:.4f}, MAE: {mae_xgb:.4f}, RMSE: {rmse_xgb:.4f}")

    # 2. Train Random Forest Model
    print("Training Random Forest Regressor...")
    rf = RandomForestRegressor(
        n_estimators=120,
        max_depth=12,
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train_proc, y_train)
    y_pred_rf = rf.predict(X_test_proc)

    r2_rf = float(r2_score(y_test, y_pred_rf))
    mae_rf = float(mean_absolute_error(y_test, y_pred_rf))
    rmse_rf = float(root_mean_squared_error(y_test, y_pred_rf))

    print(f"Random Forest Results -> R2: {r2_rf:.4f}, MAE: {mae_rf:.4f}, RMSE: {rmse_rf:.4f}")

    # 3. Train Gradient Boosting Model
    print("Training Gradient Boosting Regressor...")
    gb = GradientBoostingRegressor(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5,
        random_state=42
    )
    gb.fit(X_train_proc, y_train)
    y_pred_gb = gb.predict(X_test_proc)

    r2_gb = float(r2_score(y_test, y_pred_gb))
    mae_gb = float(mean_absolute_error(y_test, y_pred_gb))
    rmse_gb = float(root_mean_squared_error(y_test, y_pred_gb))

    print(f"Gradient Boosting Results -> R2: {r2_gb:.4f}, MAE: {mae_gb:.4f}, RMSE: {rmse_gb:.4f}")

    # Extract Feature Importances (from XGBoost)
    cat_names = preprocessor.named_transformers_['cat'].get_feature_names_out(available_cat).tolist()
    all_feature_names = available_num + cat_names
    importances = xgb.feature_importances_.tolist()
    
    feature_importance_list = [
        {"feature": name, "importance": round(imp * 100, 2)}
        for name, imp in sorted(zip(all_feature_names, importances), key=lambda x: x[1], reverse=True)[:10]
    ]

    # Save models & artifacts
    joblib.dump(xgb, os.path.join(MODELS_DIR, "model_xgboost.pkl"))
    joblib.dump(rf, os.path.join(MODELS_DIR, "model_rf.pkl"))
    joblib.dump(gb, os.path.join(MODELS_DIR, "model_gb.pkl"))
    joblib.dump(preprocessor, os.path.join(MODELS_DIR, "preprocessor.pkl"))

    metrics = {
        "dataset": "Kaggle Precision Ag + FAOSTAT/USDA historical crop yield records",
        "sample_count": len(df),
        "features_used": available_num + available_cat,
        "models": {
            "XGBoost": {
                "r2_score": round(r2_xgb, 4),
                "accuracy_percent": round(max(0, r2_xgb * 100), 2),
                "mae": round(mae_xgb, 4),
                "rmse": round(rmse_xgb, 4)
            },
            "RandomForest": {
                "r2_score": round(r2_rf, 4),
                "accuracy_percent": round(max(0, r2_rf * 100), 2),
                "mae": round(mae_rf, 4),
                "rmse": round(rmse_rf, 4)
            },
            "GradientBoosting": {
                "r2_score": round(r2_gb, 4),
                "accuracy_percent": round(max(0, r2_gb * 100), 2),
                "mae": round(mae_gb, 4),
                "rmse": round(rmse_gb, 4)
            }
        },
        "top_feature_importance": feature_importance_list,
        "best_model": "XGBoost Regressor"
    }

    with open(os.path.join(MODELS_DIR, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    print("All ML models and evaluation metrics serialized to backend/ml_engine/saved_models/")
    return metrics

if __name__ == "__main__":
    train()
