from pathlib import Path

import numpy as np
import pandas as pd
from catboost import CatBoostRegressor

ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = Path(__file__).resolve().parent / "models" / "yieldsense_final_catboost.cbm"
TEST_PATH = ROOT / "dataset" / "final_cleaned_crop_yield_test.csv"
BASE_FEATURES = [
    "Year",
    "State",
    "Crop",
    "Season",
    "Area",
    "Annual_Rainfall",
    "Fertilizer",
    "Pesticide",
]
ENGINEERED_FEATURES = [
    "Fertilizer_per_Area",
    "Pesticide_per_Area",
    "Crop_Season",
    "Crop_State",
]


def main():
    model = CatBoostRegressor()
    model.load_model(str(MODEL_PATH))
    expected_features = BASE_FEATURES + ENGINEERED_FEATURES
    actual_features = list(model.feature_names_)
    if actual_features != expected_features:
        raise RuntimeError(
            f"Serving model feature mismatch: expected {expected_features}, "
            f"got {actual_features}"
        )

    test = pd.read_csv(TEST_PATH)
    features = test[BASE_FEATURES].copy()
    area = features["Area"].replace(0, np.nan)
    features["Fertilizer_per_Area"] = features["Fertilizer"] / area
    features["Pesticide_per_Area"] = features["Pesticide"] / area
    features["Crop_Season"] = features["Crop"].astype(str) + "_" + features["Season"].astype(str)
    features["Crop_State"] = features["Crop"].astype(str) + "_" + features["State"].astype(str)
    features = features[expected_features].replace([np.inf, -np.inf], np.nan)
    valid_rows = ~features.isna().any(axis=1)
    actual = test.loc[valid_rows, "Yield"].to_numpy(dtype=float)
    predicted = model.predict(features.loc[valid_rows])
    residual = actual - predicted

    mae = np.mean(np.abs(residual))
    rmse = np.sqrt(np.mean(np.square(residual)))
    total_variance = np.sum(np.square(actual - np.mean(actual)))
    r_squared = 1 - np.sum(np.square(residual)) / total_variance

    print(f"MODEL_LOADED: {MODEL_PATH.name}")
    print(f"FEATURE_ORDER_VALID: {len(actual_features)} features")
    print(f"EVALUATION_DATASET: {TEST_PATH.relative_to(ROOT)}")
    print(f"EVALUATION_ROWS: {len(actual)}")
    print(f"DROPPED_INVALID_ROWS: {int((~valid_rows).sum())}")
    print(f"MAE: {mae:.6f}")
    print(f"RMSE: {rmse:.6f}")
    print(f"R2: {r_squared:.6f}")


if __name__ == "__main__":
    main()
