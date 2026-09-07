"""
Milestone 2 - Step 3: Train Baseline Models
==============================================
Trains three baseline (untuned, default-settings) models on train_processed.csv:
  - Linear Regression
  - Random Forest
  - XGBoost

Evaluates each on val_processed.csv using RMSE, MAE, R².
These are the "before" numbers - Step 4 will tune each model with
GridSearchCV and we compare against these baselines to prove tuning helped.

By: Shivani
"""

import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from xgboost import XGBRegressor

# ---------------------------------------------------------------
# Config
# ---------------------------------------------------------------
TRAIN_PATH = "../datasets/cleaned-crop-yield-production-dataset/train_processed.csv"
VAL_PATH = "../datasets/cleaned-crop-yield-production-dataset/val_processed.csv"
TARGET = "yield_tpha"
RANDOM_STATE = 42


def load_data():
    train_df = pd.read_csv(TRAIN_PATH)
    val_df = pd.read_csv(VAL_PATH)
    print(f"Loaded train: {train_df.shape[0]} rows, {train_df.shape[1]} columns")
    print(f"Loaded val:   {val_df.shape[0]} rows, {val_df.shape[1]} columns")
    return train_df, val_df


def split_features_target(df: pd.DataFrame):
    X = df.drop(columns=[TARGET, "id"], errors="ignore")
    y = df[TARGET]
    return X, y


def evaluate(model_name: str, y_true, y_pred):
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mae = mean_absolute_error(y_true, y_pred)
    r2 = r2_score(y_true, y_pred)
    print(f"\n{model_name}")
    print(f"  RMSE: {rmse:.4f}")
    print(f"  MAE:  {mae:.4f}")
    print(f"  R2:   {r2:.4f}")
    return {"model": model_name, "rmse": rmse, "mae": mae, "r2": r2}


def train_and_evaluate(X_train, y_train, X_val, y_val):
    results = []

    # --- Linear Regression ---
    lr = LinearRegression()
    lr.fit(X_train, y_train)
    preds = lr.predict(X_val)
    results.append(evaluate("Linear Regression (baseline)", y_val, preds))

    # --- Random Forest ---
    rf = RandomForestRegressor(random_state=RANDOM_STATE)
    rf.fit(X_train, y_train)
    preds = rf.predict(X_val)
    results.append(evaluate("Random Forest (baseline)", y_val, preds))

    # --- XGBoost ---
    xgb = XGBRegressor(random_state=RANDOM_STATE)
    xgb.fit(X_train, y_train)
    preds = xgb.predict(X_val)
    results.append(evaluate("XGBoost (baseline)", y_val, preds))

    return results


def summarize(results):
    print("\n" + "=" * 60)
    print("BASELINE SUMMARY (lower RMSE/MAE = better, higher R2 = better)")
    print("=" * 60)
    summary_df = pd.DataFrame(results).sort_values("rmse")
    print(summary_df.to_string(index=False))
    best = summary_df.iloc[0]["model"]
    print(f"\nBest baseline model (by RMSE): {best}")


def main():
    train_df, val_df = load_data()
    X_train, y_train = split_features_target(train_df)
    X_val, y_val = split_features_target(val_df)

    results = train_and_evaluate(X_train, y_train, X_val, y_val)
    summarize(results)

    print("\nStep 3 complete. These are your 'before' numbers for Step 4 (GridSearchCV tuning).")


if __name__ == "__main__":
    main()