# Milestone 2 Implementation Plan: Yield Prediction & Agricultural Analysis

**Platform**: YieldSense AI — AI-Powered Crop Yield Prediction & Agricultural Productivity Intelligence Platform  
**Milestone**: Milestone 2 (Weeks 3 & 4)  
**Author**: Lead Data & ML Engineer  
**Git Branch**: `maniraj`  

---

## 1. Current State & Existing Reusable Components

From Milestone 1, the repository contains a validated, production-grade foundation:
- **Clean Datasets**:
  - `data/processed/smart_crop_yield_cleaned.csv` (10,000 records, 13 columns, regression target: `Yield_ton_per_ha`, 0 missing values, `"Unknown"` imputation applied).
  - `data/processed/crop_recommendation_cleaned.csv` (7,000 records, 5 columns, multiclass target: `Label` with 70 balanced crops, 0 missing values).
- **Configuration & Validation**: `configs/datasets.yaml` and `src/data/validation.py` for boundary and range enforcement.
- **FastAPI Backend**: `src/api/` with modular routing (`auth.py`, `predictions.py`, `recommendations.py`), Pydantic validation schemas, and JWT/RBAC role authentication.
- **Next.js Frontend Scaffold**: `frontend/` App Router project with TypeScript and Tailwind CSS configured.
- **Documentation**: SQL DDL schemas (`docs/database_schema.md`), Data Dictionary (`docs/data_dictionary.md`), and UI wireframe specs (`docs/ui_layout.md`).

---

## 2. Machine Learning Tasks & Dataset-to-Module Mapping

```mermaid
graph TD
    subgraph Datasets
        DB[(Dataset B: Smart Crop Yield)] -->|10,000 rows| ML_Yield[Crop Yield ML Pipeline]
        DA[(Dataset A: Crop Recommendation)] -->|7,000 rows| ML_Rec[Crop Recommendation ML Pipeline]
    end

    subgraph "ML Engineering (src/ml/)"
        ML_Yield --> YieldModels[Linear, Random Forest, GBDT, XGBoost]
        ML_Rec --> RecModels[Logistic Reg, Decision Tree, Random Forest, XGBoost]
        YieldModels --> BestYieldModel[Saved: models/yield_model.joblib]
        RecModels --> BestRecModel[Saved: models/crop_recommendation_model.joblib]
    end

    subgraph "Analytics & Insights (src/analytics/)"
        DB --> WeatherAnalytics[Weather Analytics Module]
        DB --> SoilAnalytics[Soil Analysis Module]
        DA --> WeatherAnalytics
        DA --> SoilAnalytics
        WeatherAnalytics --> InsightsEngine[Agricultural Insights Engine]
        SoilAnalytics --> InsightsEngine
        BestYieldModel --> InsightsEngine
        BestRecModel --> InsightsEngine
    end

    subgraph "API Layer (src/api/)"
        BestYieldModel --> API_Yield[/api/predict/yield]
        BestRecModel --> API_Rec[/api/predict/recommendation]
        InsightsEngine --> API_Analytics[/api/analytics/insights]
        InsightsEngine --> API_Report[/api/analytics/report]
    end

    subgraph "Frontend UI (frontend/)"
        API_Yield --> UI_Yield[Yield Prediction View]
        API_Rec --> UI_Rec[Crop Recommendation View]
        API_Analytics --> UI_Analytics[Weather & Soil Analytics]
        API_Report --> UI_Report[Prediction Reports Generator]
    end
```

---

## 3. Detailed Component Implementation Plan

### Phase 1: Crop Yield Prediction (Dataset B - Regression)
- **Features**:
  - *Categorical* (5): `Crop`, `Region`, `Soil_Type`, `Irrigation`, `Previous_Crop` (One-Hot Encoded).
  - *Numerical* (7): `Soil_pH`, `Rainfall_mm`, `Temperature_C`, `Humidity_pct`, `Fertilizer_Used_kg`, `Pesticides_Used_kg`, `Planting_Density` (StandardScaler).
- **Target**: `Yield_ton_per_ha` (continuous numeric).
- **Train/Test Strategy**: 80/20 train/test split with fixed random seed (`random_state=42`). Preprocessing transformers fitted strictly on training split to prevent leakage.
- **Model Candidates Evaluated**:
  1. *Baseline*: DummyRegressor (Mean) & Linear Regression (Ridge/Lasso)
  2. *Tree Ensembles*: Random Forest Regressor, Gradient Boosting Regressor
  3. *Extreme Gradient Boosting*: XGBoost Regressor
- **Evaluation Metrics**: MAE, MSE, RMSE, $R^2$, 5-Fold Cross Validation.
- **Deliverables**:
  - `src/ml/pipelines/train_yield_model.py`
  - `models/yield_model.joblib` + `models/yield_model_metadata.json`
  - `artifacts/yield_model_comparison.md`
  - `artifacts/yield_model_selection.md`

### Phase 2: Crop Recommendation (Dataset A - Multiclass Classification)
- **Features**: `Temperature`, `Humidity`, `pH`, `Rainfall` (Numerical features, scaled).
- **Target**: `Label` (70 unique crop categories, Label Encoded).
- **Train/Test Strategy**: 80/20 stratified train/test split (`stratify=y`).
- **Model Candidates Evaluated**:
  1. *Baseline*: Logistic Regression
  2. *Decision Tree*: DecisionTreeClassifier
  3. *Ensembles*: Random Forest Classifier, Gradient Boosting, XGBoost Classifier
- **Evaluation Metrics**: Accuracy, Precision (macro & weighted), Recall, F1-Score, 5-Fold Stratified CV, Confusion Matrix.
- **Deliverables**:
  - `src/ml/pipelines/train_crop_recommendation.py`
  - `models/crop_recommendation_model.joblib` + `models/crop_recommendation_metadata.json`
  - `artifacts/crop_recommendation_model_comparison.md`

### Phase 3: Weather Analytics & Soil Analysis Modules
- **Weather Analytics (`src/analytics/weather_analytics.py`)**:
  - Statistical profiling of Temperature, Humidity, and Rainfall distributions across datasets.
  - Optimal climatic envelopes per crop type.
  - Sensitivity analysis of weather factors vs. crop yields.
  - *Deliverable*: `artifacts/weather_analytics_report.md`
- **Soil Analysis (`src/analytics/soil_analysis.py`)**:
  - pH classification (Acidic < 6.0, Neutral 6.0–7.5, Alkaline > 7.5).
  - Soil texture suitability (Sandy, Loam, Clay) correlated with crop yield outputs.
  - Explicit documentation that N/P/K are future sensor telemetry and absent from current static datasets.
  - *Deliverable*: `artifacts/soil_analysis_report.md`

### Phase 4: Agricultural Insights & Prediction Reports
- **Agricultural Insights Engine (`src/analytics/agricultural_insights.py`)**:
  - Combines model predictions with agronomic rules.
  - Clearly segregates:
    1. `DATA-DRIVEN INSIGHT` (derived from historical dataset statistics).
    2. `MODEL PREDICTION` (inferred from ML models).
    3. `GENERAL AGRICULTURAL GUIDANCE` (domain agronomic best practices).
  - *Deliverable*: `artifacts/agricultural_insights_report.md`
- **Prediction Reports Generator (`src/analytics/prediction_report.py`)**:
  - Generates comprehensive, exportable prediction reports containing input parameters, forecasted yield, recommended alternative crops, weather risk factors, soil suitability assessments, and action recommendations.
  - *Deliverable*: `artifacts/prediction_report_design.md`

### Phase 5: FastAPI Backend Services Integration
- Connect live `.joblib` models to FastAPI routers:
  - `POST /api/predict/yield`: Runs live inference on `yield_model.joblib`, returns yield and confidence interval.
  - `POST /api/predict/recommendation`: Runs live inference on `crop_recommendation_model.joblib`, returns top-k recommended crops with probability scores.
  - `GET /api/analytics/weather`: Returns weather statistical analytics and optimal crop ranges.
  - `GET /api/analytics/soil`: Returns soil pH and texture performance summaries.
  - `POST /api/analytics/report`: Generates and returns a comprehensive agricultural prediction report.
- Enable FastAPI CORS middleware for local frontend communication (`http://localhost:3000`).

### Phase 6: Next.js Frontend Dashboard Integration
- Build a responsive agricultural dashboard in `frontend/src/app/page.tsx` and modular components:
  1. **Yield Forecasting Calculator**: Interactive inputs for all 12 parameters with live API prediction display.
  2. **Crop Recommendation Matcher**: Environmental inputs with interactive top-recommended crops and confidence indicators.
  3. **Weather & Soil Intelligence Tab**: Visual data charts and optimal condition cards.
  4. **Prediction Report Generator**: Formatted report preview with download/print functionality.

---

## 4. Verification & Testing Plan

1. **ML Pipeline Tests**:
   - Verify reproducible training scripts execute without errors.
   - Verify models serialize and deserialize correctly via `joblib`.
   - Verify inference generates expected output shapes and types on test data.
2. **Backend API Integration Tests**:
   - Test endpoints with valid payloads, verify live ML inference results.
   - Test validation handling (invalid categories, out-of-bound numbers) to ensure proper HTTP 400/422 responses.
   - Verify CORS headers.
3. **Frontend-to-Backend Integration**:
   - Verify frontend successfully communicates with backend on `http://127.0.0.1:8000`.
4. **Deliverable Reports**:
   - `artifacts/milestone2_verification_report.md`
   - `artifacts/milestone2_status.md`
   - `docs/milestone2_sprint_report.md`
