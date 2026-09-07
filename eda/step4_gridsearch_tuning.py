"""
Milestone 2 - Step 4: Hyperparameter Tuning with GridSearchCV
==================================================================
Tunes Random Forest and XGBoost using GridSearchCV (5-fold cross-validation
on the training set), then evaluates the tuned models on val_processed.csv.

Linear Regression is not tuned here - it has no meaningful hyperparameters
to search, so its Step 3 baseline score stays as its final score.

Compares tuned RMSE against Step 3's baseline RMSE to show what tuning
actually gained.

By: Shivani
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import GridSearchCV
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from xgboost import XGBRegressor

# ---------------------------------------------------------------
# Config
# ---------------------------------------------------------------
TRAIN_PATH = "../datasets/cleaned-crop-yield-production-dataset/train_processed.csv"
VAL_PATH = "../datasets/cleaned-crop-yield-production-dataset/val_processed.csv"
TARGET = "yield_tpha"
RANDOM_STATE = 42

# Baseline RMSE from Step 3, for comparison
BASELINE_RMSE = {
    "Linear Regression": 0.6586,
    "Random Forest": 0.6742,
    "XGBoost": 0.7008,
}

RF_PARAM_GRID = {
    "n_estimators": [100, 200],
    "max_depth": [None, 10, 20],
    "min_samples_leaf": [1, 2, 4],
}

XGB_PARAM_GRID = {
    "n_estimators": [100, 200],
    "max_depth": [3, 5, 7],
    "learning_rate": [0.05, 0.1, 0.2],
}


def load_data():
    train_df = pd.read_csv(TRAIN_PATH)
    val_df = pd.read_csv(VAL_PATH)
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


def tune_model(name, model, param_grid, X_train, y_train):
    print(f"\nRunning GridSearchCV for {name} ({len(param_grid)} params)...")
    grid = GridSearchCV(
        model,
        param_grid,
        cv=5,
        scoring="neg_root_mean_squared_error",
        n_jobs=-1,
    )
    grid.fit(X_train, y_train)
    print(f"Best params for {name}: {grid.best_params_}")
    return grid.best_estimator_


def compare_to_baseline(model_name, tuned_rmse):
    baseline = BASELINE_RMSE[model_name]
    change = baseline - tuned_rmse
    direction = "improved" if change > 0 else "got worse"
    print(f"  vs baseline ({baseline:.4f}): {direction} by {abs(change):.4f}")


def main():
    train_df, val_df = load_data()
    X_train, y_train = split_features_target(train_df)
    X_val, y_val = split_features_target(val_df)

    results = []

    # --- Random Forest tuning ---
    best_rf = tune_model("Random Forest", RandomForestRegressor(random_state=RANDOM_STATE), RF_PARAM_GRID, X_train, y_train)
    preds = best_rf.predict(X_val)
    res = evaluate("Random Forest (tuned)", y_val, preds)
    compare_to_baseline("Random Forest", res["rmse"])
    results.append(res)

    # --- XGBoost tuning ---
    best_xgb = tune_model("XGBoost", XGBRegressor(random_state=RANDOM_STATE), XGB_PARAM_GRID, X_train, y_train)
    preds = best_xgb.predict(X_val)
    res = evaluate("XGBoost (tuned)", y_val, preds)
    compare_to_baseline("XGBoost", res["rmse"])
    results.append(res)

    # --- Linear Regression stays as baseline (not tuned) ---
    results.append({
        "model": "Linear Regression (baseline, not tuned)",
        "rmse": BASELINE_RMSE["Linear Regression"],
        "mae": None,
        "r2": None,
    })

    print("\n" + "=" * 60)
    print("FINAL COMPARISON (lower RMSE = better)")
    print("=" * 60)
    summary_df = pd.DataFrame(results).sort_values("rmse")
    print(summary_df.to_string(index=False))
    best = summary_df.iloc[0]["model"]
    print(f"\nOverall best model: {best}")
    print("\nStep 4 complete. This is your final model choice for Step 5 evaluation writeup.")


if __name__ == "__main__":
    main()