# Milestone 2 Testing & Quality Assurance Report

**Project**: YieldSense AI — Crop Yield Prediction & Agricultural Productivity Intelligence Platform  
**Milestone**: Milestone 2 (Weeks 3 & 4) — Yield Prediction & Agricultural Analysis  
**Branch**: `maniraj`  
**Execution Date**: September 3, 2026  
**QA Engineer**: AI Automated Verification Suite  
**Final Verdict**: **PASS (100% Verified)**  

---

## 1. Test Environment
- **Operating System**: Windows (AMD64)
- **Python Version**: `3.11.9`
- **Node Version**: `v24.18.0` (npm: `11.5.2`)
- **Key Python Packages**:
  - `scikit-learn`: `1.5.0`
  - `pandas`: `2.2.2`
  - `numpy`: `1.26.4`
  - `joblib`: `1.5.3`
  - `xgboost`: `2.0.3`
  - `fastapi`: `0.111.0`
  - `uvicorn`: `0.30.1`
  - `pytest`: `9.1.1`
- **Frontend Stack**: Next.js `16.3.3` (Turbopack), React `19.2.8`, Tailwind CSS `@tailwindcss/postcss` `^4`

---

## 2. Test Summary Matrix

| Area | Status | Evidence |
|------|:---:|----------|
| **Yield ML (Regression)** | **PASS** | Evaluated Dummy, Linear, Ridge, RF, GBDT, XGBoost on Dataset B. Ridge Regression ($R^2 = 0.9821$, $\text{RMSE} = 5.08\text{ ton/ha}$, $\text{MAE} = 4.08\text{ ton/ha}$) serialized to `models/yield_model.joblib`. Zero target leakage. |
| **Crop Recommendation ML (Classification)** | **PASS** | Evaluated Logistic Regression, Decision Tree, RF, GBDT, XGBoost across 70 balanced crop species in Dataset A. Random Forest Classifier ($\text{Accuracy} = 95.86\%$, $\text{F1} = 0.9573$) serialized to `models/crop_recommendation_model.joblib`. Strictly limited to [Temperature, Humidity, pH, Rainfall] (No N/P/K). |
| **Model Registry** | **PASS** | `src/ml/models/registry.py` provides cached singleton loading, handles inference dataframes, formats top-k probabilities, and guards against missing models. |
| **Weather Analytics** | **PASS** | `src/analytics/weather_analytics.py` calculates statistical profiling across 17,000 combined records and generates optimal climatic envelopes for 10 major crops. Output: `artifacts/weather_analytics_report.md`. |
| **Soil Analysis** | **PASS** | `src/analytics/soil_analysis.py` implements USDA pH classifications and empirical yield benchmarks across Clay, Loam, and Sandy soil textures. Clearly documents the absence of N/P/K from static datasets. Output: `artifacts/soil_analysis_report.md`. |
| **Agricultural Insights** | **PASS** | `src/analytics/agricultural_insights.py` separates predictions into `MODEL PREDICTION`, `DATA-DRIVEN INSIGHT`, `GENERAL AGRICULTURAL GUIDANCE`, and `RISK ALERTS`. Output: `artifacts/agricultural_insights_report.md`. |
| **Prediction Reports** | **PASS** | `src/analytics/prediction_report.py` builds complete JSON and Markdown prediction reports with timestamps and input parameter audits. Output: `artifacts/prediction_report_design.md`. |
| **FastAPI Backend** | **PASS** | `src/api/main.py` registered all routers with CORS middleware. All 8 endpoints verified via pytest and live TestClient suite with 100% success on valid inputs and proper HTTP 400/422 on invalid/out-of-bound inputs. |
| **Frontend Dashboard** | **PASS** | `frontend/src/app/page.tsx` compiled with zero TypeScript/build errors via `npm run build` in 19.3s. Verified live in browser subagent across all 4 interactive tabs. |
| **End-to-End Workflows** | **PASS** | Workflows A, B, C, and D verified end-to-end from datasets to live browser UI presentation. |

---

## 3. Automated Tests Executed

### Command 1: Pytest Test Suite
* **Command**: `python -m pytest tests/test_milestone2.py -v`
* **Result**: **PASS (9/9 passed in 3.94s)**
* **Output Details**:
  * `test_ml_models_loadable`: **PASSED** (Verified `.joblib` loading for 70 classes)
  * `test_yield_model_inference`: **PASSED** (Numeric finite yield in [20, 250] range)
  * `test_crop_recommendation_inference`: **PASSED** (Top candidate probabilities sum to 1.0)
  * `test_weather_and_soil_analytics`: **PASSED** (Weather profiles and USDA pH classifications)
  * `test_api_root`: **PASSED** (HTTP 200 health check)
  * `test_api_yield_prediction_endpoint`: **PASSED** (HTTP 200 live inference + insights)
  * `test_api_yield_invalid_input`: **PASSED** (HTTP 400 rejection for invalid category)
  * `test_api_recommendation_endpoint`: **PASSED** (HTTP 200 top candidate probabilities)
  * `test_api_analytics_and_report_endpoints`: **PASSED** (HTTP 200 weather, soil, and report generation)

### Command 2: Deep ML & Model Registry Verification
* **Command**: `python scratch/verify_ml_analytics.py`
* **Result**: **PASS (All 4 verification stages passed)**
* **Output Details**:
  * Verified zero target leakage in Dataset B feature schema (`Yield_ton_per_ha` strictly excluded).
  * Verified probability calibration sums to 1.0 across all 70 classes for Random Forest.
  * Verified registry singleton caching (`get_yield_model()` and `get_crop_recommendation_artifact()`).
  * Verified USDA soil pH classification boundaries and guidance generation.

### Command 3: Deep FastAPI Edge-Case & Input Validation Verification
* **Command**: `python scratch/verify_api_deep.py`
* **Result**: **PASS (All 5 API verification stages passed)**
* **Output Details**:
  * Verified HTTP 400 rejection for invalid categories (`Crop`, `Region`, `Soil_Type`, `Irrigation`, `Previous_Crop`).
  * Verified HTTP 422 rejection for out-of-bounds numerics (e.g. `Soil_pH: -1.0`, `Soil_pH: 15.0`, `Humidity_pct: 105.0`, `Temperature: 95.0°C`).
  * Verified JWT authentication flow (`POST /api/auth/login` and `GET /api/auth/profile`).

### Command 4: Frontend Next.js Production Build
* **Command**: `npm run build` in `frontend/`
* **Result**: **PASS (Compiled in 19.3s with zero errors)**
* **Output Details**:
  * Next.js 16.3.3 (Turbopack) successfully compiled all routes (`/` and `/_not-found`).
  * TypeScript validation finished in 3.6s with 0 type errors.

---

## 4. Machine Learning Verification Details

### Crop Yield Regression (`models/yield_model.joblib`):
- **Training Status**: Successfully trained with 80/20 train/test split.
- **Cross-Validation**: 5-Fold Cross Validation $R^2 = 0.9825$, $\text{RMSE} = 5.08\text{ ton/ha}$, $\text{MAE} = 4.08\text{ ton/ha}$.
- **Selected Model**: **Ridge Regression Pipeline** (ColumnTransformer with OneHotEncoder and StandardScaler).
- **Test Metrics**: $R^2 = 0.9821$, $\text{RMSE} = 5.0806\text{ ton/ha}$, $\text{MAE} = 4.08\text{ ton/ha}$, $\text{MSE} = 25.81$.
- **Inference Verification**: Live test inference returned `113.78 ton/ha` for Wheat on Loam soil.
- **Model Storage**: Compact joblib artifact (`4,670 bytes`) with complete metadata JSON (`843 bytes`).

### Crop Recommendation Classification (`models/crop_recommendation_model.joblib`):
- **Training Status**: Successfully trained with 80/20 stratified train/test split.
- **Cross-Validation**: 5-Fold Stratified Cross Validation $\text{Accuracy} = 96.23\%$, $\text{Weighted F1} = 0.9612$.
- **Selected Model**: **Random Forest Classifier Pipeline** (StandardScaler + RandomForestClassifier with 100 trees).
- **Test Metrics**: $\text{Accuracy} = 95.86\%$, $\text{Weighted Precision} = 0.9593$, $\text{Weighted Recall} = 0.9586$, $\text{Weighted F1} = 0.9573$, $\text{Macro F1} = 0.9573$.
- **Inference Verification**: Live test inference returned calibrated probabilities across 70 classes (e.g. Pumpkin 39.1%, Coriander 23.8%, Green Chillies 12.0%).
- **Model Storage**: Joblib artifact (`37,411,491 bytes`) with metadata JSON (`695 bytes`).

---

## 5. API Verification Matrix

| Method | Endpoint Path | Test Input Scenario | HTTP Status | Verification Result |
|---|---|---|:---:|---|
| `GET` | `/` | Health check | `200 OK` | Returned project status "Online" and model version strings |
| `GET` | `/docs` | OpenAPI documentation | `200 OK` | Swagger UI rendered with 8 interactive endpoints |
| `POST` | `/api/predict/yield` | Valid 12-feature payload | `200 OK` | Returned `predicted_yield_ton_per_ha: 113.78` and insights object |
| `POST` | `/api/predict/yield` | Invalid `Crop="InvalidCrop"` | `400 Bad Request` | Rejected with detailed category error message |
| `POST` | `/api/predict/yield` | Out-of-bounds `Soil_pH=15.0` | `422 Unprocessable` | Rejected by Pydantic schema validation |
| `POST` | `/api/predict/recommendation` | Valid 4-feature climate payload | `200 OK` | Returned recommended crop and top 5 probability candidates |
| `POST` | `/api/predict/recommendation` | Out-of-bounds `Temperature=95.0` | `422 Unprocessable` | Rejected by Pydantic schema validation |
| `GET` | `/api/analytics/weather` | Analytics fetch | `200 OK` | Returned temperature, humidity, rainfall ranges and 10 crop profiles |
| `GET` | `/api/analytics/soil` | Analytics fetch | `200 OK` | Returned pH statistics and Clay/Loam/Sandy yield performance benchmarks |
| `POST` | `/api/analytics/report` | Farm report request | `200 OK` | Generated `report_id: REP-20260903200437` and complete formatted markdown |
| `POST` | `/api/auth/login` | Valid credentials | `200 OK` | Returned Bearer JWT token |
| `GET` | `/api/auth/profile` | Authorized Bearer header | `200 OK` | Returned authenticated user profile and role claims |

---

## 6. Frontend & Browser Verification

### Verification Method:
Automated Browser Subagent execution on `http://localhost:3000` with visual snapshot recording: `frontend_verification_1788445870866.webp`.

### Workflow Results:
1. **Header & Badges**: Verified `YieldSense AI`, `Milestone 2` badge, and live `API Status: Online (FastAPI v2.0.0)` indicator.
2. **Tab 1: Crop Yield Forecasting**:
   - Filled agricultural parameters form.
   - Clicked `Forecast Crop Yield Output`.
   - Verified output card showing **113.78 ton/ha** with `Ridge Regression Pipeline (R²: 0.9821)` badge.
   - Verified multi-tier intelligence cards: `[DATA-DRIVEN] Soil pH Status: Neutral`.
3. **Tab 2: Crop Recommendation**:
   - Adjusted climate sliders.
   - Clicked `Find Best-Suited Crops`.
   - Verified recommended crop card (**Pumpkin, 39.1% confidence**) and probability progress bars (**Coriander 23.8%**, **Green Chillies 12.0%**, **Corn 9.1%**, **Ashwagandha 4.5%**).
4. **Tab 3: Weather & Soil Analytics**:
   - Switched to Analytics tab.
   - Verified 10 crop climatic envelope cards (Rice, Maize, Banana, Jute, Tea, Coffee, Cotton, Chickpea, Apple, Mango).
   - Verified soil texture benchmark cards (**Clay: 117.3 ton/ha**, **Loam: 117.9 ton/ha**, **Sandy: 118.47 ton/ha**).
5. **Tab 4: Prediction Reports**:
   - Clicked `Generate & Preview Report`.
   - Verified full rendered Markdown report with Report ID `REP-20260903200437`, farm parameters table, forecast summary, and agricultural advice.

---

## 7. End-to-End Workflow Verification

- **WORKFLOW A (Dataset B -> Yield Model -> Registry -> API -> Frontend)**:  
  `data/processed/smart_crop_yield_cleaned.csv` -> trained `RidgeRegression` -> `models/yield_model.joblib` -> `src/ml/models/registry.py` -> `POST /api/predict/yield` -> Frontend Yield Tab (**113.78 ton/ha displayed**). **STATUS: VERIFIED**
- **WORKFLOW B (Dataset A -> Recommendation Classifier -> Registry -> API -> Frontend)**:  
  `data/processed/crop_recommendation_cleaned.csv` -> trained `RandomForestClassifier` -> `models/crop_recommendation_model.joblib` -> `src/ml/models/registry.py` -> `POST /api/predict/recommendation` -> Frontend Recommendation Tab (**Top crop + candidate probabilities displayed**). **STATUS: VERIFIED**
- **WORKFLOW C (Datasets -> Analytics Modules -> API -> Frontend)**:  
  Datasets A & B -> `src/analytics/weather_analytics.py` & `soil_analysis.py` -> `GET /api/analytics/*` -> Frontend Analytics Tab (**Climatic envelopes & soil benchmarks displayed**). **STATUS: VERIFIED**
- **WORKFLOW D (Farm Query -> Prediction Report -> API -> Frontend)**:  
  Farm parameters -> `src/analytics/prediction_report.py` -> `POST /api/analytics/report` -> Frontend Reports Tab (**Full agronomic report generated and formatted**). **STATUS: VERIFIED**

---

## 8. Issues Found & Resolutions

| Issue ID | Severity | Description | Root Cause | Resolution |
|---|:---:|---|---|---|
| **ISS-01** | Low | Pydantic warning on `model_version` field | Pydantic v2 reserves `model_` namespace | Added `ConfigDict(protected_namespaces=())` to response schemas in `predictions.py` and `recommendations.py`. |
| **ISS-02** | Low | Unicode checkmark characters in test script | Windows default cp1252 console encoding | Replaced unicode symbols with ASCII `[OK]` in test output. |
| **ISS-03** | Low | Popular crops list in analytics | Dataset A contains `Rice`, `Maize`, `Tea`, `Coffee`, etc., but not `Wheat` | Updated `popular_crops` list in `weather_analytics.py` to match exact Dataset A crop labels. |

---

## 9. Known Project Limitations

1. **Dataset A Feature Scope**: Dataset A strictly contains `Temperature`, `Humidity`, `pH`, and `Rainfall`. It **does NOT contain Nitrogen (N), Phosphorus (P), or Potassium (K)**. Soil nutrient analysis is explicitly documented as a future IoT sensor feature.
2. **Static Historical Data**: Weather and soil analytics are calculated from historical project datasets. Real-time live weather feeds require third-party meteorological API integration.
3. **Simulated Nature of Dataset B**: While Ridge regression achieved an $R^2$ of 0.9821 on Dataset B, real-world farm deployment will require continuous retraining on heterogeneous field telemetry.
4. **Correlation vs. Causation**: Management correlations (e.g. fertilizers vs. yield) reflect simulated associations and should be interpreted within agronomic safety bounds.

---

## 10. Final Milestone 2 Verdict: **PASS**

### Rationale:
Every requirement, model, pipeline, analytics module, API endpoint, frontend view, and documentation deliverable for Milestone 2 has been executed, rigorously tested, and verified with 100% test passing rate and zero build errors. The system is fully operational and demonstration-ready.
