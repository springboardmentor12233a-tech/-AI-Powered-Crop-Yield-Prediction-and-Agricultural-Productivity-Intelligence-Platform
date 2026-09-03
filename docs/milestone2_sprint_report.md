# Milestone 2 Sprint Report: Yield Prediction & Agricultural Analysis

**Project**: YieldSense AI — Crop Yield Prediction & Agricultural Productivity Intelligence Platform  
**Sprint**: Milestone 2 (Weeks 3 & 4)  
**Developer**: Rithika Raymond  
**Git Branch**: `maniraj`  
**Status**: Completed & Verified  

---

## 1. Milestone 2 Objectives
During Milestone 2, I focused on implementing the end-to-end machine learning, analytics, backend serving, and frontend dashboard layers:
1. **Machine Learning Model Training**: Trained and evaluated multiple regression algorithms for continuous crop yield prediction and multiclass classification algorithms for crop recommendation.
2. **Evaluation & Model Selection**: Conducted 5-fold cross-validation and holdout test set evaluation to prevent data leakage and select optimal models based on measurable metrics ($R^2$, RMSE, MAE, Accuracy, Weighted F1).
3. **Weather Analytics Module**: Developed statistical profiling and crop-specific climatic tolerance envelopes.
4. **Soil Analysis Module**: Built USDA-standard soil pH classification and soil texture yield benchmark analysis (documenting the absence of N/P/K from the static datasets).
5. **Agricultural Insights & Reporting**: Implemented a multi-tier insights engine segregating model predictions, empirical dataset insights, and agronomic guidance, accompanied by a standardized prediction report generator.
6. **FastAPI & Next.js Integration**: Connected the live `.joblib` models to FastAPI REST endpoints and built an interactive dashboard UI in Next.js.

---

## 2. Dataset Usage & Separation

I maintained strict separation between the two project datasets:
- **Dataset B (`smart_crop_yield_cleaned.csv`) — Crop Yield Forecasting (Regression)**:
  - **Size**: 10,000 records, 13 features.
  - **Inputs**: 5 categorical variables (`Crop`, `Region`, `Soil_Type`, `Irrigation`, `Previous_Crop`) and 7 numerical variables (`Soil_pH`, `Rainfall_mm`, `Temperature_C`, `Humidity_pct`, `Fertilizer_Used_kg`, `Pesticides_Used_kg`, `Planting_Density`).
  - **Target**: `Yield_ton_per_ha` (continuous numerical target).
- **Dataset A (`crop_recommendation_cleaned.csv`) — Crop Recommendation (Classification)**:
  - **Size**: 7,000 records, 5 features.
  - **Inputs**: 4 numerical environmental features (`Temperature`, `Humidity`, `pH`, `Rainfall`).
  - **Target**: `Label` (70 distinct crop varieties, perfectly balanced with 100 samples per class).

---

## 3. Machine Learning Models & Evaluation

### Task 1: Crop Yield Prediction (Dataset B)
I evaluated 6 candidate regression models using an 80/20 train/test split and 5-fold cross-validation on the training set:

| Model Candidate | 5-Fold CV R² | Test MAE (ton/ha) | Test RMSE (ton/ha) | Test R² | Notes |
|---|---:|---:|---:|---:|---|
| **Dummy Baseline (Mean)** | -0.0011 | 32.61 | 38.03 | -0.0015 | Uninformed baseline |
| **Linear Regression** | 0.9824 | 4.08 | 5.08 | 0.9821 | Strong baseline |
| **Ridge Regression (Selected)** | **0.9825** | **4.08** | **5.08** | **0.9821** | Optimal generalization & stability |
| **Random Forest Regressor** | 0.9800 | 4.32 | 5.37 | 0.9800 | Tree ensemble |
| **Gradient Boosting Regressor** | 0.9811 | 4.22 | 5.25 | 0.9809 | Boosting ensemble |
| **XGBoost Regressor** | 0.9811 | 4.23 | 5.26 | 0.9808 | Extreme gradient boosting |

**Selected Model**: **Ridge Regression Pipeline** (serialized to `models/yield_model.joblib`). It delivers the lowest error (RMSE: 5.08 ton/ha), highest explained variance ($R^2 = 0.9821$), and minimal latency for real-time serving.

---

### Task 2: Multiclass Crop Recommendation (Dataset A)
I evaluated 5 candidate classification models across 70 crop varieties with stratified 5-fold cross-validation:

| Model Candidate | 5-Fold CV Accuracy | Test Accuracy | Precision (Weighted) | Recall (Weighted) | F1-Score (Weighted) |
|---|---:|---:|---:|---:|---:|
| **Logistic Regression** | 71.77% | 73.07% | 0.7224 | 0.7307 | 0.7187 |
| **Decision Tree Classifier** | 93.84% | 93.00% | 0.9316 | 0.9300 | 0.9265 |
| **Random Forest Classifier (Selected)** | **96.23%** | **95.86%** | **0.9593** | **0.9586** | **0.9573** |
| **Gradient Boosting Classifier** | 93.41% | 94.00% | 0.9436 | 0.9400 | 0.9399 |
| **XGBoost Classifier** | 95.48% | 95.50% | 0.9565 | 0.9550 | 0.9547 |

**Selected Model**: **Random Forest Classifier** (serialized to `models/crop_recommendation_model.joblib`). Achieved 95.86% test accuracy and 0.9573 weighted F1-score with probability estimation (`predict_proba`).

---

## 4. Analytics Modules & Reporting

1. **Weather Analytics (`src/analytics/weather_analytics.py`)**:
   - Analyzes statistical distributions for Temperature, Humidity, and Rainfall.
   - Calculates optimal climatic envelopes (min, max, mean) for major crop species.
   - Output: [`artifacts/weather_analytics_report.md`](file:///c:/Users/user/Downloads/AI-Powered-Crop-Yield-Prediction-and-Agricultural-Productivity-Intelligence-Platform/artifacts/weather_analytics_report.md).
2. **Soil Analysis (`src/analytics/soil_analysis.py`)**:
   - Implements USDA soil pH categorization (Strongly Acidic to Strongly Alkaline) and agricultural treatment guidelines.
   - Computes empirical yield benchmarks across soil texture classes (Clay, Loam, Sandy).
   - Output: [`artifacts/soil_analysis_report.md`](file:///c:/Users/user/Downloads/AI-Powered-Crop-Yield-Prediction-and-Agricultural-Productivity-Intelligence-Platform/artifacts/soil_analysis_report.md).
3. **Agricultural Insights Engine (`src/analytics/agricultural_insights.py`)**:
   - Generates multi-tier insights clearly distinguishing:
     - `MODEL PREDICTION`
     - `DATA-DRIVEN INSIGHT`
     - `GENERAL AGRICULTURAL GUIDANCE`
     - `RISK ALERTS` (e.g., monoculture rotation risks, excess fertilizer thresholds).
   - Output: [`artifacts/agricultural_insights_report.md`](file:///c:/Users/user/Downloads/AI-Powered-Crop-Yield-Prediction-and-Agricultural-Productivity-Intelligence-Platform/artifacts/agricultural_insights_report.md).
4. **Prediction Reports Generator (`src/analytics/prediction_report.py`)**:
   - Compiles farm details, agronomic parameters, ML forecasts, and actionable advice into exportable JSON and Markdown reports.
   - Output: [`artifacts/prediction_report_design.md`](file:///c:/Users/user/Downloads/AI-Powered-Crop-Yield-Prediction-and-Agricultural-Productivity-Intelligence-Platform/artifacts/prediction_report_design.md).

---

## 5. Backend API Services Integration

I integrated the trained models into the existing FastAPI backend (`src/api/`):
- `POST /api/predict/yield`: Live yield regression inference + automated insights generation.
- `POST /api/predict/recommendation`: Multiclass crop classification returning top 5 candidates with probability confidence bars.
- `GET /api/analytics/weather`: Weather statistical summaries and crop climate envelopes.
- `GET /api/analytics/soil`: Soil pH profiling and soil texture performance benchmarks.
- `POST /api/analytics/report`: Full standardized prediction report generator.
- Added FastAPI CORS middleware (`CORSMiddleware`) for frontend connectivity.

---

## 6. Frontend Dashboard Integration

I updated `frontend/src/app/page.tsx` with a modern, responsive UI built with Tailwind CSS:
- **Tab 1: Yield Forecasting**: Interactive 12-parameter form, live prediction card, model version badge, and multi-tier insight cards.
- **Tab 2: Crop Recommendation**: Climate sliders (Temperature, Humidity, pH, Rainfall), top recommended crop display, and probability bars for candidate alternatives.
- **Tab 3: Weather & Soil Analytics**: Visual cards presenting crop climate envelopes and soil texture performance benchmarks.
- **Tab 4: Prediction Reports**: One-click generation and preview of official agronomic reports.

---

## 7. Testing & Verification

I created and ran an automated pytest test suite in [`tests/test_milestone2.py`](file:///c:/Users/user/Downloads/AI-Powered-Crop-Yield-Prediction-and-Agricultural-Productivity-Intelligence-Platform/tests/test_milestone2.py):
- `test_ml_models_loadable`: **PASSED**
- `test_yield_model_inference`: **PASSED**
- `test_crop_recommendation_inference`: **PASSED**
- `test_weather_and_soil_analytics`: **PASSED**
- `test_api_root`: **PASSED**
- `test_api_yield_prediction_endpoint`: **PASSED**
- `test_api_yield_invalid_input`: **PASSED**
- `test_api_recommendation_endpoint`: **PASSED**
- `test_api_analytics_and_report_endpoints`: **PASSED**

**Result**: 9/9 tests passed (100% success rate).  
**Frontend Build**: Next.js production build (`npm run build`) succeeded with 0 errors.

---

## 8. Known Limitations & Future Improvements

1. **Absence of Soil N/P/K in Static Datasets**: The current static project datasets do not contain Nitrogen, Phosphorus, or Potassium columns. Soil nutrient analysis is reserved for future IoT sensor telemetry.
2. **Static Historical Data**: Weather analytics are calculated from historical datasets. Live weather forecasting requires third-party API integration in future milestones.
3. **Simulated Nature of Dataset B**: While Ridge regression achieved an $R^2$ of 0.9821 on Dataset B, real-world deployment on heterogeneous plots will require retraining on field sensor data.
