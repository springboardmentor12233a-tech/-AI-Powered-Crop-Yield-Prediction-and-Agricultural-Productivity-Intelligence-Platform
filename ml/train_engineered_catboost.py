import os
import json
import pandas as pd
import numpy as np

from catboost import CatBoostRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# ============================================================
# 1. LOAD DATA
# ============================================================

DATA_PATH = "../dataset/soil_weather_yield_train.csv"

df = pd.read_csv(DATA_PATH)

print("Original shape:", df.shape)


# ============================================================
# 2. DATE FEATURE
# ============================================================

df["harvest_date"] = pd.to_datetime(
    df["harvest_date"],
    dayfirst=True,
    errors="coerce"
)

df["harvest_month"] = df["harvest_date"].dt.month

df["harvest_quarter"] = df["harvest_date"].dt.quarter

df.drop(columns=["harvest_date"], inplace=True)


# ============================================================
# 3. FEATURE ENGINEERING
# ============================================================

# NPK total
df["npk_total"] = (
    df["nitrogen_content"]
    + df["phosphorus_content"]
    + df["potassium_content"]
)

# NPK average
df["npk_average"] = df["npk_total"] / 3

# N to P ratio
df["np_ratio"] = (
    df["nitrogen_content"]
    / (df["phosphorus_content"] + 1e-6)
)

# N to K ratio
df["nk_ratio"] = (
    df["nitrogen_content"]
    / (df["potassium_content"] + 1e-6)
)

# P to K ratio
df["pk_ratio"] = (
    df["phosphorus_content"]
    / (df["potassium_content"] + 1e-6)
)

# Rainfall relative to temperature
df["rain_temperature_ratio"] = (
    df["total_rainfall"]
    / (df["avg_temperature"].abs() + 1)
)

# Fertilizer relative to NPK
df["fertilizer_npk_ratio"] = (
    df["fertilizer_amount"]
    / (df["npk_total"] + 1)
)

# Pesticide relative to fertilizer
df["pesticide_fertilizer_ratio"] = (
    df["pesticide_usage"]
    / (df["fertilizer_amount"] + 1)
)

# Irrigation and soil moisture interaction
df["irrigation_moisture_interaction"] = (
    df["irrigation_frequency"]
    * df["soil_moisture"]
)

# Temperature × rainfall
df["temperature_rainfall_interaction"] = (
    df["avg_temperature"]
    * df["total_rainfall"]
)

# Soil pH distance from neutral
df["ph_distance_from_neutral"] = (
    abs(df["soil_ph"] - 7)
)

# Sunlight × temperature
df["sunlight_temperature_interaction"] = (
    df["sunlight_hours"]
    * df["avg_temperature"]
)


# ============================================================
# 4. TARGET
# ============================================================

TARGET = "yield_tpha"

y = df[TARGET]

X = df.drop(columns=[TARGET])


# ============================================================
# 5. REMOVE IDENTIFIERS
# ============================================================

X.drop(
    columns=["id", "field_id"],
    errors="ignore",
    inplace=True
)


# ============================================================
# 6. CATEGORICAL FEATURES
# ============================================================

categorical_features = [
    "crop_type",
    "region",
    "season"
]

cat_indices = [
    X.columns.get_loc(col)
    for col in categorical_features
]


# ============================================================
# 7. TRAIN / VALIDATION SPLIT
# ============================================================

X_train, X_val, y_train, y_val = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)

print("Training rows:", len(X_train))
print("Validation rows:", len(X_val))

print("\nTotal features:", X.shape[1])


# ============================================================
# 8. CATBOOST
# ============================================================

print("\nTraining Feature-Engineered CatBoost...")

model = CatBoostRegressor(
    iterations=2000,
    depth=7,
    learning_rate=0.03,
    loss_function="RMSE",
    eval_metric="RMSE",
    random_seed=42,
    l2_leaf_reg=5,
    random_strength=1,
    verbose=100
)


model.fit(
    X_train,
    y_train,
    cat_features=cat_indices,
    eval_set=(X_val, y_val),
    early_stopping_rounds=150
)


# ============================================================
# 9. PREDICTION
# ============================================================

pred = model.predict(X_val)


# ============================================================
# 10. METRICS
# ============================================================

mae = mean_absolute_error(
    y_val,
    pred
)

rmse = np.sqrt(
    mean_squared_error(
        y_val,
        pred
    )
)

r2 = r2_score(
    y_val,
    pred
)


print("\n======================================")
print("FEATURE-ENGINEERED CATBOOST")
print("======================================")

print(f"MAE  : {mae:.4f}")
print(f"RMSE : {rmse:.4f}")
print(f"R²   : {r2:.4f}")


# ============================================================
# 11. COMPARE WITH CURRENT MODEL
# ============================================================

OLD_R2 = 0.6814

print("\n======================================")
print("COMPARISON")
print("======================================")

print(f"Previous CatBoost R² : {OLD_R2:.4f}")
print(f"New CatBoost R²      : {r2:.4f}")
print(f"Improvement          : {r2 - OLD_R2:+.4f}")


# ============================================================
# 12. FEATURE IMPORTANCE
# ============================================================

importance = pd.DataFrame({
    "Feature": X.columns,
    "Importance": model.feature_importances_
})

importance = importance.sort_values(
    by="Importance",
    ascending=False
)

print("\n======================================")
print("TOP FEATURE IMPORTANCE")
print("======================================")

print(
    importance.head(20).to_string(index=False)
)


# ============================================================
# 13. SAVE MODEL
# ============================================================

MODEL_DIR = "../models"

os.makedirs(
    MODEL_DIR,
    exist_ok=True
)

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "yieldsense_engineered_catboost.cbm"
)

model.save_model(MODEL_PATH)

print("\nModel saved:")
print(MODEL_PATH)


# ============================================================
# 14. SAVE METRICS
# ============================================================

metrics = {
    "model": "Feature Engineered CatBoost",
    "features": list(X.columns),
    "mae": float(mae),
    "rmse": float(rmse),
    "r2": float(r2),
    "previous_r2": OLD_R2,
    "improvement": float(r2 - OLD_R2)
}

METRICS_PATH = os.path.join(
    MODEL_DIR,
    "engineered_catboost_metrics.json"
)

with open(
    METRICS_PATH,
    "w"
) as f:
    json.dump(
        metrics,
        f,
        indent=4
    )

print("\nMetrics saved:")
print(METRICS_PATH)

print("\nTraining completed! ✅")