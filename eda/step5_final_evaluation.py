"""
Milestone 2 - Step 5: Final Evaluation & Save Best Model
=============================================================
Consolidates baseline (Step 3) and tuned (Step 4) results into one
comparison table, saves it as a CSV for documentation, then retrains
the winning model (XGBoost, best params from Step 4) and saves it to
disk so later steps (weather/soil modules, LLM insights, Flask API)
can load it directly instead of retraining every time.

By: Shivani
"""

import pandas as pd
import numpy as np
import joblib
from xgboost import XGBRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# ---------------------------------------------------------------
# Config
# ---------------------------------------------------------------
TRAIN_PATH = "../datasets/cleaned-crop-yield-production-dataset/train_processed.csv"
VAL_PATH = "../datasets/cleaned-crop-yield-production-dataset/val_processed.csv"
TARGET = "yield_tpha"
RANDOM_STATE = 42
MODEL_OUTPUT_PATH = "../backend/models/xgboost_yield_model.pkl"
REPORT_OUTPUT_PATH = "model_comparison_report.csv"

# Best params found by GridSearchCV in Step 4
BEST_XGB_PARAMS = {"learning_rate": 0.1, "max_depth": 3, "n_estimators": 100}

# All results from Steps 3-4, consolidated here for the final report
RESULTS = [
    {"model": "Linear Regression", "stage": "baseline", "rmse": 0.6586, "mae": 0.5266, "r2": 0.6751},
    {"model": "Random Forest", "stage": "baseline", "rmse": 0.6742, "mae": 0.5372, "r2": 0.6595},
    {"model": "XGBoost", "stage": "baseline", "rmse": 0.7008, "mae": 0.5628, "r2": 0.6321},
    {"model": "Random Forest", "stage": "tuned", "rmse": 0.6696, "mae": 0.5358, "r2": 0.6641},
    {"model": "XGBoost", "stage": "tuned", "rmse": 0.6567, "mae": 0.5266, "r2": 0.6770},
]


def save_comparison_report():
    df = pd.DataFrame(RESULTS).sort_values("rmse")
    df.to_csv(REPORT_OUTPUT_PATH, index=False)
    print(f"Saved comparison report: {REPORT_OUTPUT_PATH}")
    print("\n" + df.to_string(index=False))
    return df


def load_data():
    train_df = pd.read_csv(TRAIN_PATH)
    val_df = pd.read_csv(VAL_PATH)
    return train_df, val_df


def split_features_target(df: pd.DataFrame):
    X = df.drop(columns=[TARGET, "id"], errors="ignore")
    y = df[TARGET]
    return X, y


def train_final_model(X_train, y_train, X_val, y_val):
    print("\nRetraining final XGBoost model with best params from Step 4...")
    model = XGBRegressor(**BEST_XGB_PARAMS, random_state=RANDOM_STATE)
    model.fit(X_train, y_train)

    preds = model.predict(X_val)
    rmse = np.sqrt(mean_squared_error(y_val, preds))
    mae = mean_absolute_error(y_val, preds)
    r2 = r2_score(y_val, preds)
    print(f"Final model validation check - RMSE: {rmse:.4f}, MAE: {mae:.4f}, R2: {r2:.4f}")
    return model


def save_model(model):
    import os
    os.makedirs(os.path.dirname(MODEL_OUTPUT_PATH), exist_ok=True)
    joblib.dump(model, MODEL_OUTPUT_PATH)
    print(f"\nSaved final model: {MODEL_OUTPUT_PATH}")


def main():
    print("=" * 60)
    print("FINAL MODEL COMPARISON")
    print("=" * 60)
    save_comparison_report()

    train_df, val_df = load_data()
    X_train, y_train = split_features_target(train_df)
    X_val, y_val = split_features_target(val_df)

    model = train_final_model(X_train, y_train, X_val, y_val)
    save_model(model)

    print("\nStep 5 complete. Model saved and ready for Steps 6-8 (weather/soil modules, LLM insights).")


if __name__ == "__main__":
    main()