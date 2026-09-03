import os
import sys
sys.path.insert(0, os.path.abspath("."))

import json
import joblib
import pandas as pd
import numpy as np

def run_deep_ml_and_analytics_verification():
    print("=" * 70)
    print("DEEP VERIFICATION: ML PIPELINES, MODELS, REGISTRY & ANALYTICS")
    print("=" * 70)
    
    # -------------------------------------------------------------
    # 1. Yield Pipeline & Model Verification
    # -------------------------------------------------------------
    print("\n[TEST 1] Verifying Yield Model & Pipeline...")
    yield_model_path = "models/yield_model.joblib"
    yield_meta_path = "models/yield_model_metadata.json"
    
    assert os.path.exists(yield_model_path), "yield_model.joblib does not exist"
    assert os.path.exists(yield_meta_path), "yield_model_metadata.json does not exist"
    
    yield_pipeline = joblib.load(yield_model_path)
    with open(yield_meta_path, "r") as f:
        yield_meta = json.load(f)
        
    print(f"[OK] Loaded yield model: {yield_meta['algorithm']} (v{yield_meta['version']})")
    print(f"[OK] Metrics in metadata: Test R2 = {yield_meta['metrics']['test_r2']}, Test RMSE = {yield_meta['metrics']['test_rmse']}")
    
    # Verify inference on Dataset B samples
    df_b = pd.read_csv("data/processed/smart_crop_yield_cleaned.csv")
    sample_b = df_b.drop(columns=["Yield_ton_per_ha"]).iloc[:5]
    actual_y = df_b["Yield_ton_per_ha"].iloc[:5].values
    
    pred_y = yield_pipeline.predict(sample_b)
    print(f"[OK] Sample Predictions: {np.round(pred_y, 2)}")
    print(f"[OK] Actual Yields:      {actual_y}")
    assert len(pred_y) == 5
    assert all(np.isfinite(pred_y)), "Predictions contain NaN or Inf"
    assert all(pred_y > 0), "Predicted negative yield"
    
    # Verify no target leakage in feature list
    cat_cols = yield_meta["categorical_features"]
    num_cols = yield_meta["numerical_features"]
    all_features = cat_cols + num_cols
    assert "Yield_ton_per_ha" not in all_features, "TARGET LEAKAGE DETECTED in feature schema!"
    print("[OK] Verified zero target leakage in feature schema.")

    # -------------------------------------------------------------
    # 2. Crop Recommendation Model Verification
    # -------------------------------------------------------------
    print("\n[TEST 2] Verifying Crop Recommendation Model & Pipeline...")
    rec_model_path = "models/crop_recommendation_model.joblib"
    rec_meta_path = "models/crop_recommendation_metadata.json"
    
    assert os.path.exists(rec_model_path), "crop_recommendation_model.joblib does not exist"
    assert os.path.exists(rec_meta_path), "crop_recommendation_metadata.json does not exist"
    
    rec_artifact = joblib.load(rec_model_path)
    with open(rec_meta_path, "r") as f:
        rec_meta = json.load(f)
        
    print(f"[OK] Loaded recommendation model: {rec_meta['algorithm']} (v{rec_meta['version']})")
    print(f"[OK] Metrics in metadata: Test Accuracy = {rec_meta['metrics']['test_accuracy']}, Test F1 = {rec_meta['metrics']['test_f1_weighted']}")
    
    assert len(rec_artifact["classes"]) == 70, f"Expected 70 classes, got {len(rec_artifact['classes'])}"
    assert rec_meta["features"] == ["Temperature", "Humidity", "pH", "Rainfall"], "Unexpected feature set"
    assert "N" not in rec_meta["features"] and "P" not in rec_meta["features"] and "K" not in rec_meta["features"]
    print("[OK] Confirmed dataset features strictly limited to [Temperature, Humidity, pH, Rainfall] (No N/P/K).")
    
    # Test inference
    df_a = pd.read_csv("data/processed/crop_recommendation_cleaned.csv")
    sample_a = df_a[["Temperature", "Humidity", "pH", "Rainfall"]].iloc[:5]
    actual_labels = df_a["Label"].iloc[:5].values
    
    rec_pipeline = rec_artifact["pipeline"]
    le = rec_artifact["label_encoder"]
    
    pred_idx = rec_pipeline.predict(sample_a)
    pred_labels = le.inverse_transform(pred_idx)
    probs = rec_pipeline.predict_proba(sample_a)
    
    print(f"[OK] Sample Predicted Crops: {pred_labels}")
    print(f"[OK] Actual Crops:          {actual_labels}")
    assert len(pred_labels) == 5
    assert probs.shape == (5, 70)
    assert np.allclose(probs.sum(axis=1), 1.0), "Probabilities do not sum to 1.0"
    print("[OK] Verified probability calibration sums to 1.0 across all 70 classes.")

    # -------------------------------------------------------------
    # 3. Model Registry Verification
    # -------------------------------------------------------------
    print("\n[TEST 3] Verifying Model Registry...")
    from src.ml.models.registry import (
        get_yield_model,
        get_crop_recommendation_artifact,
        predict_crop_yield,
        predict_crop_recommendation
    )
    
    m1 = get_yield_model()
    m2 = get_yield_model()
    assert m1 is m2, "Yield model caching failed (returned different instances)"
    print("[OK] Verified model registry singleton caching for yield regressor.")
    
    art1 = get_crop_recommendation_artifact()
    art2 = get_crop_recommendation_artifact()
    assert art1 is art2, "Recommendation model caching failed"
    print("[OK] Verified model registry singleton caching for crop recommendation.")
    
    # Single prediction tests via registry
    reg_yield = predict_crop_yield({
        "Crop": "Rice",
        "Region": "Region_A",
        "Soil_Type": "Clay",
        "Soil_pH": 6.5,
        "Rainfall_mm": 1200.0,
        "Temperature_C": 28.0,
        "Humidity_pct": 78.0,
        "Fertilizer_Used_kg": 220.0,
        "Irrigation": "Flood",
        "Pesticides_Used_kg": 25.0,
        "Planting_Density": 18.0,
        "Previous_Crop": "Wheat"
    })
    print(f"[OK] Registry predict_crop_yield returned: {reg_yield} ton/ha")
    assert isinstance(reg_yield, float) and reg_yield > 0
    
    rec_results = predict_crop_recommendation({
        "Temperature": 28.0,
        "Humidity": 80.0,
        "pH": 6.5,
        "Rainfall": 1200.0
    }, top_k=3)
    print(f"[OK] Registry predict_crop_recommendation returned: {rec_results}")
    assert len(rec_results) == 3
    assert all("crop" in r and "confidence" in r and "confidence_pct" in r for r in rec_results)

    # -------------------------------------------------------------
    # 4. Analytics & Insights Verification
    # -------------------------------------------------------------
    print("\n[TEST 4] Verifying Analytics & Decision Engine...")
    from src.analytics.weather_analytics import get_weather_analytics_summary
    from src.analytics.soil_analysis import get_soil_analysis_summary, classify_soil_ph
    from src.analytics.agricultural_insights import generate_agricultural_insights
    from src.analytics.prediction_report import build_prediction_report, format_markdown_report
    
    w_sum = get_weather_analytics_summary()
    assert "crop_climatic_profiles" in w_sum
    assert len(w_sum["crop_climatic_profiles"]) > 0
    print(f"[OK] Weather analytics calculated profiles for {len(w_sum['crop_climatic_profiles'])} crops.")
    
    s_sum = get_soil_analysis_summary()
    assert "soil_texture_performance" in s_sum
    assert set(s_sum["soil_texture_performance"].keys()) == {"Clay", "Loam", "Sandy"}
    print(f"[OK] Soil texture benchmarks verified for Clay, Loam, Sandy soils.")
    
    # Verify USDA pH Classification thresholds
    ph_cases = [
        (4.5, "Strongly Acidic"),
        (6.0, "Moderately Acidic"),
        (7.0, "Neutral"),
        (8.0, "Moderately Alkaline"),
        (9.0, "Strongly Alkaline")
    ]
    for ph_val, expected_cat in ph_cases:
        res = classify_soil_ph(ph_val)
        assert res["category"] == expected_cat, f"pH {ph_val} expected {expected_cat}, got {res['category']}"
    print("[OK] Verified USDA soil pH classification boundaries.")
    
    # Agricultural insights tier separation
    insights = generate_agricultural_insights(
        crop="Rice",
        soil_ph=6.5,
        soil_type="Clay",
        rainfall_mm=1200.0,
        temperature_c=28.0,
        humidity_pct=78.0,
        fertilizer_kg=220.0,
        pesticides_kg=25.0,
        irrigation="Flood",
        previous_crop="Wheat",
        predicted_yield=138.5,
        recommended_crops=[{"crop": "Rice", "confidence_pct": "92.0%"}]
    )
    assert len(insights["model_predictions"]) > 0
    assert len(insights["data_driven_insights"]) > 0
    assert len(insights["general_guidance"]) > 0
    print("[OK] Verified multi-tier separation (Model Prediction, Data-Driven Insight, General Guidance).")
    
    # Prediction Report Generator
    report = build_prediction_report(
        farm_id="FARM-TEST",
        plot_label="Sector 4",
        crop="Rice",
        region="Region_A",
        soil_type="Clay",
        soil_ph=6.5,
        rainfall_mm=1200.0,
        temperature_c=28.0,
        humidity_pct=78.0,
        fertilizer_kg=220.0,
        pesticides_kg=25.0,
        planting_density=18.0,
        irrigation="Flood",
        previous_crop="Wheat",
        predicted_yield=138.5,
        recommended_crops=[{"crop": "Rice", "confidence_pct": "92.0%"}]
    )
    md_report = format_markdown_report(report)
    assert "REPORT ID" in md_report or "Report ID" in md_report
    assert "FARM-TEST" in md_report
    assert "138.5" in md_report
    print("[OK] Verified prediction report generation and markdown formatting.")

    print("\n" + "=" * 70)
    print("ALL ML, REGISTRY & ANALYTICS TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_deep_ml_and_analytics_verification()
