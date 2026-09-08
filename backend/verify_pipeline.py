import sklearn
import pandas as pd
import numpy as np
import joblib
import os
import sys

# Add backend to path to import prediction
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from prediction import load_pipeline, preprocess_input, predict_yield

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'models')
PREPROCESSOR_PATH = os.path.join(MODELS_DIR, 'preprocessor.joblib')
MODEL_PATH = os.path.join(MODELS_DIR, 'random_forest_yield_model.joblib')

def verify():
    print("=== VERSIONS ===")
    print(f"sklearn version: {sklearn.__version__}")
    print(f"pandas version: {pd.__version__}")
    print(f"numpy version: {np.__version__}")
    print(f"joblib version: {joblib.__version__}")
    
    # Check the version warning by explicitly catching it or just letting it print
    print("\n=== LOADING PIPELINE ===")
    import warnings
    with warnings.catch_warnings(record=True) as w:
        warnings.simplefilter("always")
        preprocessor = joblib.load(PREPROCESSOR_PATH)
        model = joblib.load(MODEL_PATH)
        for warn in w:
            print(f"WARNING: {warn.category.__name__}: {warn.message}")
            
    print("\n=== FEATURE COUNT & NAMES ===")
    print(f"Random Forest expected features: {model.n_features_in_}")
    
    feature_names = preprocessor.get_feature_names_out()
    print(f"Preprocessor output feature count: {len(feature_names)}")
    
    expected_features = [
        "num__soil_moisture_%", "num__soil_pH", "num__temperature_C", "num__rainfall_mm",
        "num__humidity_%", "num__sunlight_hours", "num__pesticide_usage_ml", "num__total_days",
        "num__latitude", "num__longitude", "num__NDVI_index", "num__sowing_month",
        "num__sowing_day", "num__observation_month", "num__observation_day",
        "num__days_since_sowing", "num__crop_cycle_progress",
        "cat__region_Central USA", "cat__region_East Africa", "cat__region_North India",
        "cat__region_South India", "cat__region_South USA", "cat__crop_type_Cotton",
        "cat__crop_type_Maize", "cat__crop_type_Rice", "cat__crop_type_Soybean",
        "cat__crop_type_Wheat", "cat__irrigation_type_Drip", "cat__irrigation_type_Manual",
        "cat__irrigation_type_Sprinkler", "cat__irrigation_type_Unknown",
        "cat__fertilizer_type_Inorganic", "cat__fertilizer_type_Mixed",
        "cat__fertilizer_type_Organic", "cat__crop_disease_status_Mild",
        "cat__crop_disease_status_Moderate", "cat__crop_disease_status_Severe",
        "cat__crop_disease_status_Unknown"
    ]
    
    features_match = (list(feature_names) == expected_features)
    print(f"Feature order exactly matches expected list: {features_match}")
    if not features_match:
        print("Mismatched features:")
        for a, b in zip(feature_names, expected_features):
            if a != b:
                print(f"Actual: {a} != Expected: {b}")
                
    print("\n=== PREDICTION CONSISTENCY CHECK ===")
    
    # Load original dataset and test processed dataset
    raw_df = pd.read_csv(os.path.join(BASE_DIR, 'Smart_Farming_Crop_Yield_2024.csv'))
    test_processed_path = os.path.join(BASE_DIR, 'data', 'processed', 'test_processed.csv')
    test_processed = pd.read_csv(test_processed_path)
    
    from sklearn.model_selection import train_test_split
    
    # To get the exact same split as the notebook, we need to sort/filter similarly if any.
    # The notebook did:
    # df_clean = df.copy() 
    # df_clean = df_clean.drop(columns=['farm_id', 'sensor_id'])
    # ... lots of feature engineering ...
    # X = df_clean[features].copy()
    # model_df = X.copy(); model_df[target] = y
    # X = model_df.drop(columns=[target])
    # X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)
    # Since the order of rows is identical from df -> model_df, splitting raw_df directly with same random_state will yield the same row indices!
    _, raw_test = train_test_split(raw_df, test_size=0.20, random_state=42)
    
    first_raw_record = raw_test.iloc[0].to_dict()
    first_raw_record["observation_date"] = first_raw_record["timestamp"]
    
    target = "yield_kg_per_hectare"
    first_processed_record = test_processed.iloc[0].drop(target)
    
    print("\n--- Prediction A (Raw Input -> Pipeline) ---")
    # Make sure we load the pipeline in prediction.py so predict_yield works
    pred_A = predict_yield(first_raw_record)
    print(f"Prediction A: {pred_A}")
    
    print("\n--- Prediction B (Processed Input -> Model) ---")
    processed_df = pd.DataFrame([first_processed_record.values], columns=expected_features)
    pred_B = model.predict(processed_df)[0]
    print(f"Prediction B: {pred_B}")
    
    diff = abs(pred_A - pred_B)
    print(f"\nDifference (A - B): {diff}")

if __name__ == '__main__':
    verify()
