"""
YieldSense AI — ML Training Pipeline (Milestone 2)
=======================================================
Trains multiple regression models with GridSearchCV to predict
crop yield (Yield_kg_per_acre).

Models trained:
  1. Linear Regression
  2. Decision Tree Regressor
  3. Random Forest Regressor
  4. Gradient Boosting Regressor
  5. Extra Trees Regressor

Saves:
  - best_model.pkl          (best estimator)
  - preprocessor.pkl        (ColumnTransformer pipeline)
  - model_comparison.json   (all evaluation results)
  - training_metadata.json  (column names, categories)
"""

import os
import sys
import json
import warnings
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, ExtraTreesRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

warnings.filterwarnings("ignore")

# ─── Paths ────────────────────────────────────────────────────────────────────
# train.py lives at backend/ml/train.py
# ROOT is two levels up: d:\2nd milestone\
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))      # backend/ml/
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)                     # backend/
ROOT_DIR   = os.path.dirname(BACKEND_DIR)                     # project root

DATA_PATH  = os.path.join(ROOT_DIR, "data", "crop_yield.csv")
MODEL_DIR  = os.path.join(BACKEND_DIR, "saved_models")
os.makedirs(MODEL_DIR, exist_ok=True)

# ─── Load Data ────────────────────────────────────────────────────────────────
print("=" * 65)
print("YieldSense AI — Model Training Pipeline")
print("=" * 65)
print(f"\n[1] Loading dataset from: {DATA_PATH}")
df = pd.read_csv(DATA_PATH)
print(f"    Shape: {df.shape}")
print(f"    Columns: {list(df.columns)}")
print(f"    Missing values:\n{df.isnull().sum()}")

# ─── Preprocessing ────────────────────────────────────────────────────────────
print("\n[2] Preprocessing ...")

TARGET = "Yield_kg_per_acre"
CATEGORICAL_FEATURES = ["Crop", "Weather_Condition", "Soil_Type", "Region"]
NUMERICAL_FEATURES   = [
    "Rainfall_mm", "Temperature_C", "Fertilizer_Used",
    "Irrigation_Used", "Nitrogen", "Phosphorus", "Potassium", "Soil_pH"
]

# Drop nulls
df.dropna(inplace=True)
print(f"    Rows after dropping nulls: {len(df)}")

X = df[CATEGORICAL_FEATURES + NUMERICAL_FEATURES]
y = df[TARGET]

print(f"    Features: {CATEGORICAL_FEATURES + NUMERICAL_FEATURES}")
print(f"    Target  : {TARGET}")
print(f"    Target stats — mean={y.mean():.1f}, std={y.std():.1f}, "
      f"min={y.min():.1f}, max={y.max():.1f}")

# ─── Column Transformer ───────────────────────────────────────────────────────
preprocessor = ColumnTransformer(transformers=[
    ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_FEATURES),
    ("num", StandardScaler(), NUMERICAL_FEATURES),
])

# ─── Train / Test Split ───────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"\n[3] Train size: {len(X_train)}, Test size: {len(X_test)}")

# ─── Model Definitions & Parameter Grids ─────────────────────────────────────
model_configs = {
    "Linear Regression": {
        "estimator": LinearRegression(),
        "param_grid": {
            "model__fit_intercept": [True, False],
        },
    },
    "Decision Tree": {
        "estimator": DecisionTreeRegressor(random_state=42),
        "param_grid": {
            "model__max_depth": [5, 10, 15, None],
            "model__min_samples_split": [2, 5, 10],
            "model__min_samples_leaf": [1, 2, 4],
        },
    },
    "Random Forest": {
        "estimator": RandomForestRegressor(random_state=42, n_jobs=-1),
        "param_grid": {
            "model__n_estimators": [100, 200],
            "model__max_depth": [10, 20, None],
            "model__min_samples_split": [2, 5],
        },
    },
    "Gradient Boosting": {
        "estimator": GradientBoostingRegressor(random_state=42),
        "param_grid": {
            "model__n_estimators": [100, 200],
            "model__learning_rate": [0.05, 0.1],
            "model__max_depth": [3, 5],
        },
    },
    "Extra Trees": {
        "estimator": ExtraTreesRegressor(random_state=42, n_jobs=-1),
        "param_grid": {
            "model__n_estimators": [100, 200],
            "model__max_depth": [10, 20, None],
            "model__min_samples_split": [2, 5],
        },
    },
}

# ─── Training Loop ────────────────────────────────────────────────────────────
print("\n[4] Running GridSearchCV for each model ...")
results = []
best_pipeline = None
best_r2 = -np.inf
best_model_name = ""
best_params = {}

for name, config in model_configs.items():
    print(f"\n  Training: {name}")
    print(f"  Parameter grid: {config['param_grid']}")

    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("model", config["estimator"]),
    ])

    gs = GridSearchCV(
        pipeline,
        param_grid=config["param_grid"],
        cv=5,
        scoring="r2",
        n_jobs=-1,
        verbose=0,
    )
    gs.fit(X_train, y_train)

    best_est = gs.best_estimator_
    y_pred   = best_est.predict(X_test)

    r2   = round(r2_score(y_test, y_pred), 4)
    mae  = round(mean_absolute_error(y_test, y_pred), 4)
    rmse = round(np.sqrt(mean_squared_error(y_test, y_pred)), 4)

    # Cleaned best_params (remove "model__" prefix)
    cleaned_params = {k.replace("model__", ""): v for k, v in gs.best_params_.items()}

    print(f"  Best params : {cleaned_params}")
    print(f"  R²={r2:.4f}  MAE={mae:.2f}  RMSE={rmse:.2f}")

    result = {
        "model_name": name,
        "best_params": cleaned_params,
        "r2_score": r2,
        "mae": mae,
        "rmse": rmse,
        "cv_best_score": round(gs.best_score_, 4),
    }
    results.append(result)

    if r2 > best_r2:
        best_r2 = r2
        best_pipeline = best_est
        best_model_name = name
        best_params = cleaned_params

# ─── Model Comparison Table ───────────────────────────────────────────────────
print("\n[5] Model Comparison Table")
print("-" * 65)
print(f"{'Model':<25} {'R²':>8} {'MAE':>10} {'RMSE':>10}")
print("-" * 65)
for r in sorted(results, key=lambda x: x["r2_score"], reverse=True):
    print(f"{r['model_name']:<25} {r['r2_score']:>8.4f} {r['mae']:>10.2f} {r['rmse']:>10.2f}")
print("-" * 65)
print(f"\n  Best Model: {best_model_name}")
print(f"  Best R²   : {best_r2:.4f}")
print(f"  Best Params: {best_params}")

# ─── Save Artifacts ───────────────────────────────────────────────────────────
print("\n[6] Saving model artifacts ...")

joblib.dump(best_pipeline, os.path.join(MODEL_DIR, "best_model.pkl"))
print(f"    Saved: best_model.pkl")

# Save preprocessor separately
fitted_preprocessor = best_pipeline.named_steps["preprocessor"]
joblib.dump(fitted_preprocessor, os.path.join(MODEL_DIR, "preprocessor.pkl"))
print(f"    Saved: preprocessor.pkl")

# Save comparison results
with open(os.path.join(MODEL_DIR, "model_comparison.json"), "w") as f:
    json.dump(results, f, indent=2)
print(f"    Saved: model_comparison.json")

# Save metadata for the prediction API
ohe_categories = {}
cat_transformer = fitted_preprocessor.named_transformers_["cat"]
for feat, cats in zip(CATEGORICAL_FEATURES, cat_transformer.categories_):
    ohe_categories[feat] = list(cats)

metadata = {
    "best_model_name": best_model_name,
    "best_params": best_params,
    "best_r2": best_r2,
    "target_column": TARGET,
    "categorical_features": CATEGORICAL_FEATURES,
    "numerical_features": NUMERICAL_FEATURES,
    "feature_order": CATEGORICAL_FEATURES + NUMERICAL_FEATURES,
    "ohe_categories": ohe_categories,
    "train_size": int(len(X_train)),
    "test_size": int(len(X_test)),
    "total_rows": int(len(df)),
}
with open(os.path.join(MODEL_DIR, "training_metadata.json"), "w") as f:
    json.dump(metadata, f, indent=2)
print(f"    Saved: training_metadata.json")

print("\n[7] Training complete!")
print(f"    All artifacts saved to: {MODEL_DIR}")
