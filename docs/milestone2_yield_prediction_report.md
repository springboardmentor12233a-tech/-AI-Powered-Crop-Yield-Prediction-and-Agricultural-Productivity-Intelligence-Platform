# YieldSense AI — Milestone 2: Methodological ML Quality & Dual-Tier Validation Report

## 1. Executive Summary & Methodological Clarification
This document presents the complete dual-tier Machine Learning audit and evaluation report for **YieldSense AI Milestone 2**. 

To maintain 100% academic rigor and data science integrity:
- **Tier A (Genuine Real-World Benchmark)**: Evaluates models on the original raw telemetry dataset (`Smart_Farming_Crop_Yield_2024.csv`). R² scores are near-zero / slightly negative because the raw target variable exhibits zero measurable mathematical correlation with feature attributes.
- **Tier B (Pipeline Functional Validation)**: Evaluates models on an agronomically enriched dataset derived using domain response formulas. This validates that the 14-feature preprocessing pipeline, model fitting, and API inference architecture function correctly ($R^2 = 0.8876$).
- **No False Claims**: The $R^2 = 0.8876$ metric is strictly documented as **pipeline functional validation** and is **NOT** claimed as real-world predictive performance.

---

## 2. Target Enrichment Methodology Inspection (Tier B)

### 2.1 Formula & Operations Used
The agronomically enriched target was derived using standard agronomic response principles:

$$\text{yield\_kg\_per\_hectare} = \text{base\_yield} + \text{rainfall\_effect} + \text{NDVI\_effect} - \text{temp\_penalty} - \text{pH\_penalty} - \text{disease\_penalty} + \epsilon$$

Where:
- $\text{base\_yield}$: Crop-specific base potential (`Rice`: 4500, `Maize`: 4400, `Wheat`: 4200, `Cotton`: 4100, `Soybean`: 3900 kg/ha).
- $\text{rainfall\_effect}$: $( \text{rainfall\_mm} - 100 ) \times 4.5$ (clipped to max 200mm surplus).
- $\text{NDVI\_effect}$: $\text{NDVI\_index} \times 1500$ (canopy vigor bonus).
- $\text{temp\_penalty}$: $|\text{temperature\_C} - 25| \times 35$ (thermal stress deduction).
- $\text{pH\_penalty}$: $|\text{soil\_pH} - 6.5| \times 250$ (soil acidity/alkalinity imbalance deduction).
- $\text{disease\_penalty}$: $600\text{ kg/ha}$ deduction if `crop_disease_status` $\neq$ `'None'`.
- $\epsilon$: Gaussian noise $\mathcal{N}(\mu=0, \sigma=150)$ representing unobserved field variance.

### 2.2 Contributing Input Features
Features contributing to Tier B target: `crop_type`, `rainfall_mm`, `NDVI_index`, `temperature_C`, `soil_pH`, `crop_disease_status`.

---

## 3. Dual-Tier Evaluation Comparison (All 6 Models)

Evaluated on the exact same 100 held-out test records (`test_size=0.2, random_state=42`):

| Model Algorithm | Tier A: Raw Data RMSE (kg/ha) | Tier A: Raw Data R² | Tier B: Enriched RMSE (kg/ha) | Tier B: Enriched R² | Inference Latency (ms) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Linear Regression** | 1228.65 | -0.0931 | **182.52** | **0.8876** | 0.067 ms |
| **Ridge Regression** | 1223.15 | -0.0833 | 184.30 | 0.8854 | 0.063 ms |
| **Random Forest Regressor** | 1210.82 | -0.0616 | 219.04 | 0.8381 | 4.925 ms |
| **XGBoost Regressor** | 1214.76 | -0.0685 | 242.90 | 0.8008 | 0.517 ms |
| **LightGBM Regressor** | 1192.20 | -0.0292 | 247.33 | 0.7935 | 0.848 ms |
| **Dummy Regressor (Mean Baseline)** | **1175.44** | **-0.0004** | 547.09 | -0.0102 | **0.007 ms** |

---

## 4. Dataset Source Compatibility Analysis

The reference catalog [`datasets/raw/YieldSense_AI_Dataset_Collection.xlsx`](file:///c:/INFOSYS%207.0/datasets/raw/YieldSense_AI_Dataset_Collection.xlsx) documents three external sources:

1. 🥇 **Kaggle Crop Yield Prediction Challenge**:
   - *Compatibility*: **HIGH**. Contains Soil pH, Soil Moisture, Temp, Rainfall, Fertilizer, Pesticide, Sunlight, Crop, Region, Yield.
   - *Recommendation*: Preferred source for retraining in Milestone 3 when real-world observed yield CSVs are introduced.
2. 🥈 **FAOSTAT Crop Production Database**:
   - *Compatibility*: **MEDIUM**. Provides macro-level country/year statistics, requiring spatial disaggregation to match farm-level schemas.
3. 🥉 **USDA Agricultural Production Dataset**:
   - *Compatibility*: **MEDIUM**. Excellent US regional coverage, requires mapping US county units to global metric hectares.

---

## 5. Artifact Verification & API Status
- **Pre-fitting Isolation**: `ColumnTransformer` is fitted **strictly on `X_train`**; `X_test` remains unseen during fitting.
- **Target Leakage Check**: PASSED (`yield_kg_per_hectare` is excluded from input feature matrix $X$).
- **Artifact Consistency**: `Sample Eval Pred (4920.94 kg/ha) == Saved Artifact Pred (4920.94 kg/ha)` (100% numerical match).
- **Backend API Tests**: `POST /api/predict`, `GET /api/predict/models`, `GET /api/weather/analysis?region=North%20India`, `GET /api/soil/assessment` all returned HTTP 200 OK.
- **Frontend Build**: `npm run build` completed in 390ms with **0 errors**.
- **Milestone 1 Regression**: 100% passed.
