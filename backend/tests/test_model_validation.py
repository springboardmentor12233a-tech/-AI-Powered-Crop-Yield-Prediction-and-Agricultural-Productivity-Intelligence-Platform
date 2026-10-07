import os
import sys
import time
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Add backend to path so imports work
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(BASE_DIR)

from backend import prediction

def main():
    print("="*50)
    print("PHASE 2: MODEL LOADING VALIDATION")
    print("="*50)
    try:
        prediction.load_pipeline()
        print("[PASS] Pipeline loaded successfully.")
    except Exception as e:
        print(f"[FAIL] Failed to load pipeline: {e}")
        return

    # Check features count using a sample input
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

    try:
        X_input = prediction.preprocess_input(sample_input)
        X_processed = prediction._preprocessor.transform(X_input)
        feature_names = prediction._preprocessor.get_feature_names_out()
        
        print(f"Expected 38 features, got: {len(feature_names)}")
        if len(feature_names) == 38:
            print("[PASS] Expected feature count is correct.")
        else:
            print("[FAIL] Feature count mismatch.")
            
        print("[PASS] Preprocessing pipeline executed successfully.")
        
        pred = prediction.predict_yield(sample_input)
        print(f"Sample Prediction: {pred:.2f} kg/ha")
        print("[PASS] Model produces numeric prediction.")
    except Exception as e:
        print(f"[FAIL] Pipeline execution failed: {e}")
        return


    print("\n" + "="*50)
    print("PHASE 3 & 4: DATA & PREDICTION VALIDATION")
    print("="*50)
    test_data_path = os.path.join(BASE_DIR, 'data', 'processed', 'test_processed.csv')
    try:
        df_test = pd.read_csv(test_data_path)
        print(f"[PASS] Loaded test data: {df_test.shape[0]} records, {df_test.shape[1]} columns.")
    except Exception as e:
        print(f"[FAIL] Failed to load test data: {e}")
        return

    target_col = 'yield_kg_per_hectare'
    if target_col not in df_test.columns:
        print(f"[FAIL] Target column {target_col} not found in test data.")
        return

    # Check for NaNs
    missing_vals = df_test.isnull().sum().sum()
    print(f"Missing values in test data: {missing_vals}")
    
    y_true = df_test[target_col]
    
    # We must predict on df_test. 
    # Since df_test is already PROCESSED, we shouldn't pass it through preprocess_input().
    # Let's check df_test columns vs preprocessor feature_names
    # If test_processed.csv was saved AFTER preprocessor, it might have 38+1 columns
    # If it was saved BEFORE preprocessor, it will have the raw columns.
    
    # Let's inspect the columns to decide:
    cols = df_test.columns.tolist()
    if 'region' in cols and 'crop_type' in cols:
        print("Data appears to be RAW test data (not yet one-hot encoded). We must preprocess.")
        # But wait, predict_yield expects a dictionary per row for preprocess_input, which is slow.
        # Let's use a batch approach for raw data.
        predictions = []
        start_time = time.time()
        for idx, row in df_test.iterrows():
            # Convert row to dict, handling NaNs
            row_dict = row.dropna().to_dict()
            pred = prediction.predict_yield(row_dict)
            predictions.append(pred)
        end_time = time.time()
        latency = end_time - start_time
        predictions = np.array(predictions)
    else:
        print("Data appears to be ALREADY PROCESSED.")
        # Drop target to get X_test
        X_test = df_test.drop(columns=[target_col])
        start_time = time.time()
        predictions = prediction._model.predict(X_test)
        end_time = time.time()
        latency = end_time - start_time

    # Calculate metrics
    mae = mean_absolute_error(y_true, predictions)
    rmse = np.sqrt(mean_squared_error(y_true, predictions))
    r2 = r2_score(y_true, predictions)

    print(f"Predictions made: {len(predictions)}")
    print(f"MAE: {mae:.2f} kg/ha")
    print(f"RMSE: {rmse:.2f} kg/ha")
    print(f"R²: {r2:.4f}")
    print(f"Min Prediction: {predictions.min():.2f}")
    print(f"Max Prediction: {predictions.max():.2f}")
    print(f"Mean Prediction: {predictions.mean():.2f}")
    print(f"Total Prediction Time: {latency:.4f} seconds")
    print(f"Average Time per Prediction: {(latency/len(predictions)):.4f} seconds")

    print("\n" + "="*50)
    print("PHASE 5: PREDICTION SANITY CHECK")
    print("="*50)
    has_nan = np.isnan(predictions).any()
    has_inf = np.isinf(predictions).any()
    has_neg = (predictions < 0).any()
    
    print(f"NaN predictions: {has_nan}")
    print(f"Infinite predictions: {has_inf}")
    print(f"Negative predictions: {has_neg}")
    
    if not (has_nan or has_inf or has_neg):
        print("[PASS] Sanity checks passed.")
    else:
        print("[FAIL] Sanity checks failed.")

    print("\n" + "="*50)
    print("PHASE 6: EDGE CASE VALIDATION")
    print("="*50)
    edge_cases = {
        "Normal": sample_input.copy(),
        "Low Rainfall": {**sample_input, "rainfall_mm": 10.0},
        "High Rainfall": {**sample_input, "rainfall_mm": 500.0},
        "Low Moisture": {**sample_input, "soil_moisture_%": 5.0},
        "High Moisture": {**sample_input, "soil_moisture_%": 95.0},
        "Different Crop (Wheat)": {**sample_input, "crop_type": "Wheat"},
        "Different Region (Europe)": {**sample_input, "region": "Europe"},
        "Low pH": {**sample_input, "soil_pH": 4.0},
        "High Temp": {**sample_input, "temperature_C": 45.0},
        "Low NDVI": {**sample_input, "NDVI_index": 0.1},
    }
    
    for name, inputs in edge_cases.items():
        try:
            pred = prediction.predict_yield(inputs)
            print(f"{name}: {pred:.2f} kg/ha")
        except Exception as e:
            print(f"{name}: [ERROR] {e}")


    print("\n" + "="*50)
    print("PHASE 8: REPEATABILITY TEST")
    print("="*50)
    first_pred = prediction.predict_yield(sample_input)
    repeat_preds = [prediction.predict_yield(sample_input) for _ in range(5)]
    all_same = all(p == first_pred for p in repeat_preds)
    print(f"First Prediction: {first_pred:.2f}")
    print(f"Repeat Predictions: {[f'{p:.2f}' for p in repeat_preds]}")
    if all_same:
        print("[PASS] Predictions are completely stable and repeatable.")
    else:
        print("[FAIL] Predictions varied across runs.")


if __name__ == "__main__":
    main()
