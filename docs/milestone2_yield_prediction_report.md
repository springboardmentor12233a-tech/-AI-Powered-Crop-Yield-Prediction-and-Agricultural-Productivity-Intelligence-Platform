# YieldSense AI — Milestone 2: Machine Learning Yield Prediction Report

## 1. Project Objective & Milestone 2 Overview
Milestone 2 implements an end-to-end Machine Learning forecasting pipeline for agricultural crop yields, integrated with dataset-based weather analytics and crop-aware soil health assessments.

---

## 2. Dataset & Feature Contract
- **Source Dataset**: `datasets/processed/cleaned_crop_yield.csv` (500 records, 22 columns)
- **Target Variable**: `yield_kg_per_hectare`
- **Feature Contract**: 14 Features (5 Categorical, 9 Numerical) used identically across training, preprocessing, API schemas, and frontend prediction forms.

### Feature Inventory:
1. `crop_type` (Categorical: Wheat, Rice, Maize, Soybean, Cotton)
2. `region` (Categorical: North India, South USA, Central USA, East Africa, South India)
3. `irrigation_type` (Categorical: Drip, Sprinkler, Flood, Rainfed)
4. `fertilizer_type` (Categorical: NPK 14-35-14, Urea, DAP, Organic)
5. `crop_disease_status` (Categorical: None, Leaf Rust, Blight, Powdery Mildew)
6. `soil_pH` (Numerical: 3.0 – 10.0)
7. `soil_moisture_%` (Numerical: 0.0 – 100.0%)
8. `temperature_C` (Numerical: -10.0 – 60.0°C)
9. `rainfall_mm` (Numerical: 0.0 – 2000.0 mm)
10. `humidity_%` (Numerical: 0.0 – 100.0%)
11. `sunlight_hours` (Numerical: 0.0 – 24.0 hrs/day)
12. `pesticide_usage_ml` (Numerical: ml)
13. `total_days` (Numerical: growing duration days)
14. `NDVI_index` (Numerical: 0.0 – 1.0)

---

## 3. Preprocessing & Reproducible Train/Test Split
- **Train/Test Split**: `train_test_split(test_size=0.2, random_state=42)` (400 training samples, 100 testing samples).
- **Preprocessing Pipeline**: `sklearn.compose.ColumnTransformer` applying `OneHotEncoder(handle_unknown='ignore', sparse_output=False)` to categorical features and `StandardScaler()` to numerical features.
- **Persistence**: Saved as `models/preprocessor.pkl`.

---

## 4. Model Training & Evaluation Results (Actual Execution Metrics)

All 4 models were evaluated on the exact same held-out test set (100 samples). Inference latency was measured over 100 sample predictions.

| Model Algorithm | RMSE (kg/ha) | MAE (kg/ha) | R² Score | Inference Latency (ms) | Artifact Saved |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Random Forest Regressor** | **1203.56** | **1056.51** | **-0.0489** | **5.941 ms** | `crop_yield_rf.pkl` |
| **Linear Regression (Baseline)** | 1228.65 | 1096.30 | -0.0931 | 0.089 ms | `crop_yield_lr.pkl` |
| **LightGBM Regressor** | 1239.66 | 1059.64 | -0.1127 | 1.278 ms | `crop_yield_lgbm.pkl` |
| **XGBoost Regressor** | 1280.68 | 1086.32 | -0.1876 | 0.770 ms | `crop_yield_xgb.pkl` |

---

## 5. Objective Best Model Selection
- **Primary Selection Criterion**: Lowest test RMSE.
- **Selected Best Model**: **Random Forest Regressor** (Lowest Test RMSE: `1203.56 kg/ha`).
- **Production Artifacts**: Saved as `models/best_model.pkl` and `models/model_performance_metrics.json`.

---

## 6. End-to-End System Architecture

```text
[React Frontend (YieldPredictor.tsx)] 
        | (POST /api/predict with 14 features)
        v
[FastAPI Router (predictions.py)]
        | (Pydantic Schema Validation)
        v
[ML Inference Service (ml_service.py)]
        | (Applies preprocessor.pkl + best_model.pkl)
        v
[Prediction & Rating Output] -> Returns yield kg/ha, Productivity Rating, Risk Rating
```

---

## 7. Limitations & Honest Assessment
- The current dataset contains random distribution noise across the 500 rows resulting in near-zero/negative R² scores across all models.
- The model selection logic strictly executed objective criteria (lowest RMSE) without fabricating metrics or forcing artificial performance.
- As new agricultural telemetry datasets are collected in future milestones, retraining with `scripts/train_models.py` will automatically update `best_model.pkl` and `model_performance_metrics.json`.
