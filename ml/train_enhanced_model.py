import os
import json
import pandas as pd

from catboost import CatBoostRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# ============================================================
# 1. PATHS
# ============================================================

DATA_PATH = "../dataset/soil_weather_yield_train.csv"

MODEL_DIR = "../models"

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "yieldsense_soil_weather_model.cbm"
)

METRICS_PATH = os.path.join(
    MODEL_DIR,
    "soil_weather_model_metrics.json"
)


# ============================================================
# 2. LOAD DATASET
# ============================================================

print("\nLoading dataset...")

df = pd.read_csv(DATA_PATH)

print("Dataset shape:", df.shape)

print("\nColumns:")
print(df.columns.tolist())


# ============================================================
# 3. DATA QUALITY CHECK
# ============================================================

print("\nMissing values:")
print(df.isnull().sum())

print("\nDuplicate rows:", df.duplicated().sum())

df = df.drop_duplicates().copy()


# ============================================================
# 4. DATE PROCESSING
# ============================================================

df["harvest_date"] = pd.to_datetime(
    df["harvest_date"],
    errors="coerce"
)

df["harvest_month"] = df["harvest_date"].dt.month

df = df.drop(columns=["harvest_date"])


# ============================================================
# 5. TARGET
# ============================================================

TARGET = "yield_tpha"

X = df.drop(columns=[TARGET])

y = df[TARGET]


# ============================================================
# 6. REMOVE IDENTIFIER COLUMNS
# ============================================================

X = X.drop(
    columns=["id", "field_id"],
    errors="ignore"
)


# ============================================================
# 7. CATEGORICAL FEATURES
# ============================================================

categorical_features = [
    "crop_type",
    "region",
    "season"
]

categorical_features = [
    col for col in categorical_features
    if col in X.columns
]

categorical_indices = [
    X.columns.get_loc(col)
    for col in categorical_features
]

print("\nCategorical features:")
print(categorical_features)


# ============================================================
# 8. TRAIN / VALIDATION SPLIT
# ============================================================

X_train, X_val, y_train, y_val = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)

print("\nTraining rows:", len(X_train))
print("Validation rows:", len(X_val))


# ============================================================
# 9. CATBOOST MODEL
# ============================================================

print("\nTraining Soil + Weather Yield Model...")

model = CatBoostRegressor(
    iterations=1000,
    depth=7,
    learning_rate=0.05,
    loss_function="RMSE",
    eval_metric="RMSE",
    random_seed=42,
    verbose=100
)


model.fit(
    X_train,
    y_train,
    cat_features=categorical_indices,
    eval_set=(X_val, y_val),
    early_stopping_rounds=100
)


# ============================================================
# 10. PREDICTIONS
# ============================================================

predictions = model.predict(X_val)


# ============================================================
# 11. EVALUATION
# ============================================================

mae = mean_absolute_error(
    y_val,
    predictions
)

rmse = mean_squared_error(
    y_val,
    predictions
) ** 0.5

r2 = r2_score(
    y_val,
    predictions
)


print("\n======================================")
print("SOIL + WEATHER MODEL RESULTS")
print("======================================")

print(f"MAE  : {mae:.4f}")
print(f"RMSE : {rmse:.4f}")
print(f"R²   : {r2:.4f}")


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
print("FEATURE IMPORTANCE")
print("======================================")

print(importance.to_string(index=False))


# ============================================================
# 13. SAVE MODEL
# ============================================================

os.makedirs(
    MODEL_DIR,
    exist_ok=True
)

model.save_model(MODEL_PATH)

print("\nModel saved:")
print(MODEL_PATH)


# ============================================================
# 14. SAVE METRICS
# ============================================================

metrics = {
    "model": "YieldSense Soil Weather Yield Model",
    "dataset_rows": int(len(df)),
    "features": list(X.columns),
    "categorical_features": categorical_features,
    "mae": float(mae),
    "rmse": float(rmse),
    "r2": float(r2)
}

with open(
    METRICS_PATH,
    "w"
) as file:
    json.dump(
        metrics,
        file,
        indent=4
    )

print("\nMetrics saved:")
print(METRICS_PATH)


# ============================================================
# 15. SAMPLE PREDICTION
# ============================================================

sample = X_val.iloc[[0]]

actual = y_val.iloc[0]

predicted = model.predict(sample)[0]

print("\n======================================")
print("SAMPLE PREDICTION")
print("======================================")

print(
    "Actual Yield    :",
    round(actual, 3),
    "t/ha"
)

print(
    "Predicted Yield :",
    round(predicted, 3),
    "t/ha"
)


print("\nTraining completed successfully! ✅")