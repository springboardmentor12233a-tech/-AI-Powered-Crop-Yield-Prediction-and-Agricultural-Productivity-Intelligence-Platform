# YieldSense AI — Milestone 2: Machine Learning Yield Prediction & Evaluation Report

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

## 4. Model Training & Evaluation Results (Agronomic Telemetry Dataset)

Evaluated on the exact same held-out test set (100 samples):

| Model Algorithm | Test RMSE (kg/ha) | Test MAE (kg/ha) | Test R² Score | Latency (ms) | Selection Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Linear Regression** | **182.52** | **142.87** | **0.8876** | **0.067 ms** | **Best Model (Selected)** |
| **Ridge Regression** | 184.30 | 144.82 | 0.8854 | 0.063 ms | Evaluated |
| **Random Forest Regressor** | 219.04 | 171.62 | 0.8381 | 4.925 ms | Evaluated |
| **XGBoost Regressor** | 242.90 | 191.07 | 0.8008 | 0.517 ms | Evaluated |
| **LightGBM Regressor** | 247.33 | 192.84 | 0.7935 | 0.848 ms | Evaluated |
| **Dummy Regressor (Mean Baseline)** | 547.09 | 448.18 | -0.0102 | 0.007 ms | Baseline |

---

## 5. Objective Best Model Selection
- **Primary Selection Criterion**: Lowest test RMSE.
- **Selected Best Model**: **Linear Regression** (Lowest Test RMSE: `182.52 kg/ha`, R²: `0.8876`), outperforming the Dummy Mean Baseline (`RMSE: 547.09 kg/ha`).
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

## 7. Verification & Audit Summary
- Target leakage check: PASSED (target column NOT in feature set).
- Preprocessor isolation check: PASSED (`ColumnTransformer` fitted strictly on `X_train`).
- Artifact prediction match: PASSED (Sample evaluation prediction `4920.94 kg/ha` matched saved artifact prediction `4920.94 kg/ha`).
- API test results: `POST /api/predict`, `GET /api/predict/models`, `GET /api/weather/analysis`, `GET /api/soil/assessment` all returned 200 OK.
- Frontend build: `npm run build` passed with 0 errors.
- Milestone 1 regression: 100% passed.
