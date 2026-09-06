import pandas as pd
import numpy as np
import os
import joblib

from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline

from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from xgboost import XGBRegressor

from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# ==========================================
# 1. LOAD DATASET
# ==========================================

df = pd.read_csv("datasets/crop_yield_train.csv")

print("Original dataset shape:", df.shape)


# ==========================================
# 2. DATE FEATURE ENGINEERING
# ==========================================

df["harvest_date"] = pd.to_datetime(df["harvest_date"])

df["harvest_year"] = df["harvest_date"].dt.year
df["harvest_month"] = df["harvest_date"].dt.month
df["harvest_day"] = df["harvest_date"].dt.day


# ==========================================
# 3. REMOVE IDENTIFIER / ORIGINAL DATE
# ==========================================

df = df.drop(columns=[
    "id",
    "field_id",
    "harvest_date"
])


# ==========================================
# 4. FEATURES AND TARGET
# ==========================================

X = df.drop(columns=["yield_tpha"])
y = df["yield_tpha"]


# ==========================================
# 5. COLUMN TYPES
# ==========================================

numerical_features = X.select_dtypes(
    include=["int64", "float64"]
).columns.tolist()

categorical_features = X.select_dtypes(
    include=["object", "str"]
).columns.tolist()


# ==========================================
# 6. TRAIN / TEST SPLIT
# ==========================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)

print("Training samples:", len(X_train))
print("Testing samples:", len(X_test))


# ==========================================
# 7. PREPROCESSING
# ==========================================

preprocessor = ColumnTransformer(
    transformers=[
        (
            "num",
            StandardScaler(),
            numerical_features
        ),
        (
            "cat",
            OneHotEncoder(handle_unknown="ignore"),
            categorical_features
        )
    ]
)


# ==========================================
# 8. DEFINE MODELS + PARAMETERS
# ==========================================

models = {

    "Ridge": {
        "model": Ridge(),
        "params": {
            "model__alpha": [0.1, 1.0, 10.0, 100.0]
        }
    },

    "Random Forest": {
        "model": RandomForestRegressor(
            random_state=42,
            n_jobs=-1
        ),
        "params": {
            "model__n_estimators": [100, 200],
            "model__max_depth": [None, 10, 20],
            "model__min_samples_split": [2, 5]
        }
    },

    "Gradient Boosting": {
        "model": GradientBoostingRegressor(
            random_state=42
        ),
        "params": {
            "model__n_estimators": [100, 200],
            "model__learning_rate": [0.05, 0.1],
            "model__max_depth": [2, 3]
        }
    },

    "XGBoost": {
        "model": XGBRegressor(
            random_state=42,
            objective="reg:squarederror",
            n_jobs=-1
        ),
        "params": {
            "model__n_estimators": [100, 200],
            "model__learning_rate": [0.05, 0.1],
            "model__max_depth": [3, 5]
        }
    }
}


# ==========================================
# 9. GRIDSEARCH + MODEL EVALUATION
# ==========================================

results = []
best_models = {}

for model_name, config in models.items():

    print("\n" + "=" * 60)
    print("Training:", model_name)
    print("=" * 60)

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", config["model"])
        ]
    )

    grid_search = GridSearchCV(
        estimator=pipeline,
        param_grid=config["params"],
        cv=5,
        scoring="neg_root_mean_squared_error",
        n_jobs=-1,
        verbose=1
    )

    grid_search.fit(X_train, y_train)

    best_model = grid_search.best_estimator_

    y_pred = best_model.predict(X_test)

    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    best_models[model_name] = best_model

    results.append({
        "Model": model_name,
        "Best CV RMSE": -grid_search.best_score_,
        "Test MAE": mae,
        "Test RMSE": rmse,
        "Test R2": r2,
        "Best Parameters": grid_search.best_params_
    })

    print("\nBest Parameters:")
    print(grid_search.best_params_)

    print("\nTest MAE:", round(mae, 4))
    print("Test RMSE:", round(rmse, 4))
    print("Test R2:", round(r2, 4))


# ==========================================
# 10. MODEL COMPARISON
# ==========================================

results_df = pd.DataFrame(results)

results_df = results_df.sort_values(
    by="Test RMSE"
)

print("\n\n")
print("=" * 80)
print("FINAL MODEL COMPARISON")
print("=" * 80)

print(
    results_df[
        [
            "Model",
            "Best CV RMSE",
            "Test MAE",
            "Test RMSE",
            "Test R2"
        ]
    ].to_string(index=False)
)


# ==========================================
# 11. BEST MODEL
# ==========================================

best_model_name = results_df.iloc[0]["Model"]

best_model = best_models[best_model_name]

print("\n" + "=" * 80)
print("BEST MODEL")
print("=" * 80)

print("Best Model:", best_model_name)
print("Reason: Lowest Test RMSE")


# ==========================================
# 12. SAVE MODEL COMPARISON RESULTS
# ==========================================

results_df.to_csv(
    "model_comparison_results.csv",
    index=False
)

print("\nResults saved to:")
print("model_comparison_results.csv")


# ==========================================
# 13. SAVE BEST MODEL
# ==========================================

os.makedirs("models", exist_ok=True)

model_path = "models/best_xgboost_model.pkl"

joblib.dump(best_model, model_path)

print("\nBest model saved successfully!")
print("Model path:", model_path)


# ==========================================
# 14. VERIFY SAVED MODEL
# ==========================================

if os.path.exists(model_path):

    file_size = os.path.getsize(model_path)

    print("\nModel file verification:")
    print("File exists: YES")
    print("File size:", file_size, "bytes")

else:

    print("\nModel file verification:")
    print("File exists: NO")