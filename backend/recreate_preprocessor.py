import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
import os

def recreate_and_save_preprocessor():
    # Load data
    csv_path = os.path.join(os.path.dirname(__file__), '..', 'Smart_Farming_Crop_Yield_2024.csv')
    df = pd.read_csv(csv_path)

    # Handle missing categories
    categorical_missing_columns = ["irrigation_type", "crop_disease_status"]
    for col in categorical_missing_columns:
        df[col] = df[col].fillna("Unknown")

    # Parse dates
    df["sowing_date"] = pd.to_datetime(df["sowing_date"])
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["harvest_date"] = pd.to_datetime(df["harvest_date"])

    # Date features
    df["sowing_month"] = df["sowing_date"].dt.month
    df["sowing_day"] = df["sowing_date"].dt.day
    df["observation_month"] = df["timestamp"].dt.month
    df["observation_day"] = df["timestamp"].dt.day
    df["days_since_sowing"] = (df["timestamp"] - df["sowing_date"]).dt.days

    df["crop_cycle_progress"] = df["days_since_sowing"] / df["total_days"]
    df["crop_cycle_progress"] = df["crop_cycle_progress"].clip(0, 1)

    target = "yield_kg_per_hectare"
    features = [
        "region", "crop_type", "soil_moisture_%", "soil_pH", "temperature_C", "rainfall_mm",
        "humidity_%", "sunlight_hours", "irrigation_type", "fertilizer_type", "pesticide_usage_ml",
        "total_days", "latitude", "longitude", "NDVI_index", "crop_disease_status",
        "sowing_month", "sowing_day", "observation_month", "observation_day",
        "days_since_sowing", "crop_cycle_progress"
    ]

    X = df[features].copy()
    y = df[target].copy()

    # Ensure correct data types
    numerical_features = X.select_dtypes(include=["int32", "int64", "float64"]).columns.tolist()
    categorical_features = X.select_dtypes(include=["object"]).columns.tolist()

    # The notebook split the data before fitting the preprocessor
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )

    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    preprocessor = ColumnTransformer(transformers=[
        ("num", numeric_transformer, numerical_features),
        ("cat", categorical_transformer, categorical_features)
    ])

    preprocessor.fit(X_train)

    # Output order and size
    feature_names = preprocessor.get_feature_names_out()
    print("Processed features count:", len(feature_names))

    models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
    os.makedirs(models_dir, exist_ok=True)
    save_path = os.path.join(models_dir, 'preprocessor.joblib')
    joblib.dump(preprocessor, save_path)
    print(f"Saved preprocessor to {save_path}")

if __name__ == "__main__":
    recreate_and_save_preprocessor()
