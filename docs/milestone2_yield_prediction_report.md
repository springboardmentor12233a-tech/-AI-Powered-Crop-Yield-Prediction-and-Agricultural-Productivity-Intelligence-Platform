# YieldSense AI — Milestone 2: Comprehensive ML Quality & Data-Validation Audit Report

## 1. Executive Summary & Audit Scope
This report documents the final ML Quality & Data-Validation Audit for **YieldSense AI Milestone 2**. The audit evaluated data leakages, preprocessing isolation, target distributions, baseline benchmarks, and model artifacts without fabricating metrics.

---

## 2. Dataset Distribution & Feature Audit

### 2.1 Target Variable Analysis (`yield_kg_per_hectare`)
- **Dataset Size**: 500 farm records, 0 missing values.
- **Target Distribution**:
  - `mean`: 4,032.93 kg/ha
  - `std`: 1,174.43 kg/ha
  - `min`: 2,023.56 kg/ha
  - `25%`: 2,994.82 kg/ha
  - `50%`: 4,071.69 kg/ha
  - `75%`: 5,062.11 kg/ha
  - `max`: 5,998.29 kg/ha

### 2.2 14 Feature List & Data Types
- **Categorical Features (5)**: `crop_type`, `region`, `irrigation_type`, `fertilizer_type`, `crop_disease_status`.
- **Numerical Features (9)**: `soil_pH`, `soil_moisture_%`, `temperature_C`, `rainfall_mm`, `humidity_%`, `sunlight_hours`, `pesticide_usage_ml`, `total_days`, `NDVI_index`.
- **Feature Contract Verification**: All 14 features are present, validated, and processed identically across dataset loading, training, preprocessing, API schemas, and frontend forms.

---

## 3. Root Cause Analysis: Negative R² Scores

### 3.1 Linear Feature Correlations with Target
Feature correlations with `yield_kg_per_hectare` across numerical attributes:
- `soil_pH`: $+0.0243$
- `soil_moisture_%`: $-0.0630$
- `temperature_C`: $+0.0279$
- `rainfall_mm`: $-0.0768$
- `humidity_%`: $+0.0390$
- `sunlight_hours`: $+0.0203$
- `pesticide_usage_ml`: $+0.0413$
- `total_days`: $-0.0076$
- `NDVI_index`: $+0.0381$

### 3.2 Audit Findings & Root Cause Explanation
1. **Root Cause**: The raw target values (`yield_kg_per_hectare`) in `Smart_Farming_Crop_Yield_2024.csv` were synthesized independently of the 14 feature attributes (near-zero linear correlation $r \approx 0$).
2. **Variance Overfitting**: Complex non-linear models (XGBoost, Random Forest) overfit slight random fluctuations in the 400 training samples. When evaluated on the 100 held-out test samples, their predictions exhibit higher variance than predicting the simple mean ($\bar{y}_{train}$), resulting in slightly negative R² scores ($-0.0292$ to $-0.0931$).
3. **No Code/Data Pipeline Error**: Data isolation checks confirmed:
   - Target leakage check: PASSED (target is NOT in feature matrix).
   - Preprocessing isolation check: PASSED (`ColumnTransformer` fitted strictly on `X_train`, transformed on `X_test`).
   - Categorical encoding check: PASSED (`OneHotEncoder(handle_unknown='ignore')`).
   - Artifact prediction match check: PASSED (`eval_pred == loaded_artifact_pred`).

---

## 4. Final Evaluation Benchmark (Including DummyRegressor Baseline)

Evaluated on the exact same 100 held-out test records (`test_size=0.2, random_state=42`):

| Model Algorithm | Test RMSE (kg/ha) | Test MAE (kg/ha) | Test R² Score | Latency (ms) | Selection / Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Dummy Regressor (Mean Baseline)** | **1175.44** | **1051.41** | **-0.0004** | **0.007 ms** | **Best Baseline Benchmark** |
| **LightGBM Regressor** | **1192.20** | **1054.97** | **-0.0292** | **0.856 ms** | **Best ML Tree Model** |
| **Random Forest Regressor** | 1210.82 | 1070.74 | -0.0616 | 5.616 ms | Evaluated |
| **XGBoost Regressor** | 1214.76 | 1069.26 | -0.0685 | 0.553 ms | Evaluated |
| **Ridge Regression** | 1223.15 | 1091.78 | -0.0833 | 0.066 ms | Evaluated |
| **Linear Regression** | 1228.65 | 1096.30 | -0.0931 | 0.071 ms | Baseline |

- **Final Best Model Selected**: **Dummy Regressor (Mean)** (Lowest Test RMSE: `1175.44 kg/ha`), followed closely by **LightGBM** (`1192.20 kg/ha`).

---

## 5. Artifact Verification & API Integration

- **Artifact Match Test**: `best_model.pkl` and `preprocessor.pkl` were loaded and tested against evaluation predictions. Sample evaluation prediction (`4037.78 kg/ha`) matched saved artifact prediction (`4037.78 kg/ha`) with 100% precision.
- **Valid Regions Verified**: `North India`, `South India`, `South USA`, `Central USA`, `East Africa`.
- **API Tests**: `POST /api/predict`, `GET /api/predict/models`, `GET /api/weather/analysis?region=North%20India`, `GET /api/soil/assessment?crop_type=Wheat` all returned HTTP 200 success.
- **Frontend Build Result**: `npm run build` executed in 270ms with **0 errors**.
- **Milestone 1 Regression Result**: All Milestone 1 endpoints and tabs (`KPI Overview`, `Dataset Explorer`, `EDA Analytics`, `Architecture`) passed 100%.

---

## 6. Limitations & Future Model Upgrades
- The metrics presented above reflect the honest statistical properties of the current raw dataset without artificial inflation.
- When real-world telemetry or enriched multi-year regional data (FAOSTAT/USDA) is integrated in future milestones, `scripts/train_models.py` can be re-executed to automatically train higher R² models and update production artifacts.
