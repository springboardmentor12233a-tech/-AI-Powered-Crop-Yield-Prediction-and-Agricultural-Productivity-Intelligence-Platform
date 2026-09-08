import os
import joblib
import pandas as pd

# Define paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'models')
PREPROCESSOR_PATH = os.path.join(MODELS_DIR, 'preprocessor.joblib')
MODEL_PATH = os.path.join(MODELS_DIR, 'random_forest_yield_model.joblib')

# Lazy-loaded globals for the pipeline
_preprocessor = None
_model = None

def load_pipeline():
    global _preprocessor, _model
    if _preprocessor is None:
        _preprocessor = joblib.load(PREPROCESSOR_PATH)
    if _model is None:
        _model = joblib.load(MODEL_PATH)

def preprocess_input(input_dict):
    """
    Takes a single dictionary of raw input and transforms it into the 38 features 
    expected by the model.
    """
    df = pd.DataFrame([input_dict])
    
    # Fill categorical missing (though should be provided)
    categorical_missing_columns = ["irrigation_type", "crop_disease_status"]
    for col in categorical_missing_columns:
        if col not in df.columns or pd.isna(df[col].iloc[0]):
            df[col] = "Unknown"
            
    # Parse dates
    df["sowing_date"] = pd.to_datetime(df["sowing_date"])
    df["timestamp"] = pd.to_datetime(df["observation_date"])

    # Feature Engineering
    df["sowing_month"] = df["sowing_date"].dt.month
    df["sowing_day"] = df["sowing_date"].dt.day
    df["observation_month"] = df["timestamp"].dt.month
    df["observation_day"] = df["timestamp"].dt.day
    df["days_since_sowing"] = (df["timestamp"] - df["sowing_date"]).dt.days

    df["crop_cycle_progress"] = df["days_since_sowing"] / df["total_days"]
    df["crop_cycle_progress"] = df["crop_cycle_progress"].clip(0, 1)

    # Reorder and subset features as expected by the preprocessor
    features = [
        "region", "crop_type", "soil_moisture_%", "soil_pH", "temperature_C", "rainfall_mm",
        "humidity_%", "sunlight_hours", "irrigation_type", "fertilizer_type", "pesticide_usage_ml",
        "total_days", "latitude", "longitude", "NDVI_index", "crop_disease_status",
        "sowing_month", "sowing_day", "observation_month", "observation_day",
        "days_since_sowing", "crop_cycle_progress"
    ]
    X_input = df[features]
    return X_input

def predict_yield(input_dict):
    """
    End-to-end prediction. Loads model/preprocessor if needed, preprocesses input, 
    and predicts yield.
    """
    load_pipeline()
    
    X_input = preprocess_input(input_dict)
    
    # Apply sklearn pipeline
    X_processed = _preprocessor.transform(X_input)
    
    # Get feature names to avoid UserWarning
    feature_names = _preprocessor.get_feature_names_out()
    X_processed_df = pd.DataFrame(X_processed, columns=feature_names)
    
    # Make prediction
    yield_pred = _model.predict(X_processed_df)
    
    return yield_pred[0]

def test_prediction():
    sample_input = {
        "region": "Central USA",
        "crop_type": "Maize",
        "irrigation_type": "Drip",
        "fertilizer_type": "Inorganic",
        "crop_disease_status": "Mild",
        "soil_moisture_%": 35.5,
        "soil_pH": 6.8,
        "temperature_C": 24.5,
        "rainfall_mm": 120.0,
        "humidity_%": 65.0,
        "sunlight_hours": 8.5,
        "pesticide_usage_ml": 250.0,
        "total_days": 120,
        "latitude": 40.7,
        "longitude": -95.0,
        "NDVI_index": 0.65,
        "sowing_date": "2024-04-15",
        "observation_date": "2024-06-15"
    }

    print("--- Running Test Prediction ---")
    print("Loading pipeline...")
    load_pipeline()
    print("Model loaded successfully.")
    
    # Check features count
    X_input = preprocess_input(sample_input)
    X_processed = _preprocessor.transform(X_input)
    feature_names = _preprocessor.get_feature_names_out()
    
    print(f"Processed features count: {len(feature_names)}")
    if len(feature_names) == 38:
        print("Feature count is EXACTLY 38, as expected.")
    else:
        print(f"ERROR: Expected 38 features, got {len(feature_names)}")
        
    print("Making prediction...")
    prediction = predict_yield(sample_input)
    print(f"Predicted Yield: {prediction:.2f} kg/hectare")
    print("--- Test Complete ---")

if __name__ == "__main__":
    test_prediction()
