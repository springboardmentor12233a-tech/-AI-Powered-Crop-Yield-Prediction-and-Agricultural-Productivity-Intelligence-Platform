import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.ensemble import RandomForestRegressor, ExtraTreesRegressor, HistGradientBoostingRegressor
from sklearn.preprocessing import OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

from catboost import CatBoostRegressor

# ============================================================
# 1. LOAD DATA
# ============================================================

DATA_PATH = "../dataset/soil_weather_yield_train.csv"

df = pd.read_csv(DATA_PATH)

print("Dataset shape:", df.shape)

# ============================================================
# 2. PREPARE DATA
# ============================================================

# Convert harvest date
df["harvest_date"] = pd.to_datetime(
    df["harvest_date"],
    dayfirst=True,
    errors="coerce"
)

# Extract month
df["harvest_month"] = df["harvest_date"].dt.month

# Target
y = df["yield_tpha"]

# Remove target + IDs + raw date
X = df.drop(
    columns=[
        "yield_tpha",
        "id",
        "field_id",
        "harvest_date"
    ]
)

categorical_features = [
    "crop_type",
    "region",
    "season"
]

numeric_features = [
    col for col in X.columns
    if col not in categorical_features
]

# ============================================================
# 3. SAME TRAIN/VALIDATION SPLIT FOR ALL MODELS
# ============================================================

X_train, X_val, y_train, y_val = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)

print("Training rows:", len(X_train))
print("Validation rows:", len(X_val))


# ============================================================
# 4. PREPROCESSING FOR SKLEARN MODELS
# ============================================================

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OrdinalEncoder(
                handle_unknown="use_encoded_value",
                unknown_value=-1
            ),
            categorical_features
        ),
        (
            "numeric",
            "passthrough",
            numeric_features
        )
    ]
)


# ============================================================
# 5. MODELS
# ============================================================

models = {

    "Random Forest": Pipeline([
        (
            "preprocessor",
            preprocessor
        ),
        (
            "model",
            RandomForestRegressor(
                n_estimators=500,
                max_depth=None,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )
        )
    ]),

    "Extra Trees": Pipeline([
        (
            "preprocessor",
            preprocessor
        ),
        (
            "model",
            ExtraTreesRegressor(
                n_estimators=500,
                max_depth=None,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )
        )
    ]),

    "Hist Gradient Boosting": Pipeline([
        (
            "preprocessor",
            preprocessor
        ),
        (
            "model",
            HistGradientBoostingRegressor(
                max_iter=500,
                learning_rate=0.05,
                max_leaf_nodes=31,
                random_state=42
            )
        )
    ])
}


# ============================================================
# 6. TRAIN SKLEARN MODELS
# ============================================================

results = []

for name, model in models.items():

    print("\n======================================")
    print("Training:", name)
    print("======================================")

    model.fit(
        X_train,
        y_train
    )

    pred = model.predict(X_val)

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

    results.append({
        "Model": name,
        "MAE": mae,
        "RMSE": rmse,
        "R2": r2
    })

    print(f"MAE  : {mae:.4f}")
    print(f"RMSE : {rmse:.4f}")
    print(f"R²   : {r2:.4f}")


# ============================================================
# 7. CATBOOST
# ============================================================

print("\n======================================")
print("Training: CatBoost")
print("======================================")

cat_indices = [
    X.columns.get_loc(col)
    for col in categorical_features
]

catboost_model = CatBoostRegressor(
    iterations=1000,
    depth=7,
    learning_rate=0.05,
    loss_function="RMSE",
    random_seed=42,
    verbose=100
)

catboost_model.fit(
    X_train,
    y_train,
    cat_features=cat_indices,
    eval_set=(X_val, y_val),
    early_stopping_rounds=100
)

cat_pred = catboost_model.predict(X_val)

cat_mae = mean_absolute_error(
    y_val,
    cat_pred
)

cat_rmse = np.sqrt(
    mean_squared_error(
        y_val,
        cat_pred
    )
)

cat_r2 = r2_score(
    y_val,
    cat_pred
)

results.append({
    "Model": "CatBoost",
    "MAE": cat_mae,
    "RMSE": cat_rmse,
    "R2": cat_r2
})


# ============================================================
# 8. COMPARISON
# ============================================================

results_df = pd.DataFrame(results)

results_df = results_df.sort_values(
    by="R2",
    ascending=False
)

print("\n\n======================================")
print("FINAL MODEL COMPARISON")
print("======================================")

print(
    results_df.to_string(
        index=False,
        float_format=lambda x: f"{x:.4f}"
    )
)


# ============================================================
# 9. BEST MODEL
# ============================================================

best_model = results_df.iloc[0]

print("\n======================================")
print("BEST MODEL")
print("======================================")

print("Model :", best_model["Model"])
print("MAE   :", round(best_model["MAE"], 4))
print("RMSE  :", round(best_model["RMSE"], 4))
print("R²    :", round(best_model["R2"], 4))


print("\nComparison completed successfully! ✅")