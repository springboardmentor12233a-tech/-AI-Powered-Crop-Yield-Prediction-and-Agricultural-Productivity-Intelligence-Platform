# YieldSense AI — Official Master Architecture & Module Specification

## 1. Executive System Overview
**YieldSense AI** is an enterprise-grade, AI-powered Crop Yield Prediction and Agricultural Productivity Intelligence Platform. 

The architecture is built on a **3-Tier Modular Framework** (Presentation Layer, API Gateway & Security Layer, AI Processing Pipeline, and Data/Storage Layer) fulfilling all requirements of Milestones 1, 2, 3, and 4.

---

## 2. Master System Architecture Diagram

```mermaid
graph TD
    subgraph Layer1 ["1. USERS & PERSONAS LAYER"]
        U1["Farmers / Agri Officers"]
        U2["Agricultural Departments"]
        U3["Agronomists & Consultants"]
        U4["Researchers"]
        U5["System Administrators"]
    end

    subgraph Layer2 ["2. WEB APPLICATION PRESENTATION LAYER"]
        A1["KPI Overview Dashboard"]
        A2["Yield Predictor Engine & Model Comparison"]
        A3["Weather Analytics & Climate Trends"]
        A4["Soil Analysis & Health Spectrum"]
        A5["Dataset Explorer (500 Records)"]
        A6["EDA Analytics & Performance Reports"]
    end

    subgraph Layer3 ["3. API GATEWAY & RBAC SECURITY LAYER"]
        G1["JWT / Session Authentication"]
        G2["Role-Based Access Control (Farmer / Agronomist / Admin)"]
        G3["API Request Routing (FastAPI)"]
        G4["Pydantic V2 Input Schema Validation"]
    end

    subgraph Layer4 ["4. AI & DATA PROCESSING PIPELINE (MODULES 1 - 7)"]
        P1["Module 1: Data Collection & Ingestion<br/>(Crop info, Historical Yield, Soil, Weather)"]
        P2["Module 2: Data Preprocessing & Pipeline<br/>(Cleaning, Outliers, OneHotEncoder, StandardScaler)"]
        P3["Module 3: Weather & Climate Analysis<br/>(Rainfall adequacy, Temp stress, Humidity balance)"]
        P4["Module 4: Soil Health & Fertility Analysis<br/>(Crop-aware pH suitability, Moisture, Soil Health Index)"]
        P5["Module 5: Yield Prediction Model & GridSearchCV<br/>(XGBoost, Random Forest, LightGBM, Linear/Ridge)"]
        P6["Module 6: Prediction Outputs & Analytics Dashboard<br/>(Yield kg/ha, Productivity & Risk ratings, EDA Reports)"]
        P7["Module 7: AI Recommendations & External LLM Insights<br/>(Groq Llama-3 LLM, Fertilizer & Irrigation advice)"]

        P1 --> P2 --> P3 --> P4 --> P5 --> P6 --> P7
    end

    subgraph Layer5 ["5. EXTERNAL DATA & AI INTEGRATIONS"]
        E1["Groq LLM API (groq/compound-mini)"]
        E2["Google Gemini AI API"]
        E3["Agronomic AI Expert Engine (Offline Fallback)"]
    end

    subgraph Layer6 ["6. DATA & STORAGE LAYER"]
        S1["Cleaned Dataset (cleaned_crop_yield.csv)"]
        S2["Model Weights (best_model.pkl & preprocessor.pkl)"]
        S3["Model Metrics JSON (model_performance_metrics.json)"]
    end

    Users --> Layer2
    Layer2 --> Layer3
    Layer3 --> Layer4
    Layer4 --> Layer5
    Layer4 --> Layer6
```

---

## 3. Core Processing Modules & Deliverable Reference

### Security & User Management: User Authentication & Role-Based Access Control (RBAC)
- **Function**: Gate access and manage user credentials with 3 defined personas: **Farmer / Agri Officer**, **Agronomist**, and **System Administrator**.
- **Code Mapping**: `frontend/src/components/AuthModal.tsx`, `Header.tsx`, `App.tsx`.

### Module 1: Data Collection & Ingestion
- **Function**: Ingests agricultural telemetry, soil chemistry, weather conditions, and historical yield attributes across 500 farm records.
- **Code Mapping**: `datasets/raw/Smart_Farming_Crop_Yield_2024.csv`, `datasets/processed/cleaned_crop_yield.csv`, `frontend/src/components/DataExplorer.tsx`.

### Module 2: Data Preprocessing & Pipeline
- **Function**: Imputes missing values, cleans categorical strings, scales numerical features via `StandardScaler()`, and encodes categorical variables via `OneHotEncoder(handle_unknown='ignore')`.
- **Code Mapping**: `scripts/preprocess_data.py`, `models/preprocessor.pkl`.

### Module 3: Weather Analysis & Climate Trends
- **Function**: Computes regional rainfall adequacy scores, temperature stress risks, humidity balance, sunlight exposure, and seasonal rainfall vs. temperature trend lines.
- **Code Mapping**: `scripts/weather_analytics.py`, `backend/app/services/weather_service.py`, `backend/app/api/weather.py`, `frontend/src/components/WeatherAnalyticsView.tsx`.

### Module 4: Soil Analysis & Health Spectrum
- **Function**: Calculates crop-specific soil pH suitability (Rice: 5.5-6.8, Wheat: 6.0-7.5, Maize: 5.8-7.2, Soybean: 6.0-7.0, Cotton: 5.8-7.5), moisture sufficiency, NDVI index, and Soil Health Index (0.0-1.0).
- **Code Mapping**: `scripts/soil_analytics.py`, `backend/app/services/soil_service.py`, `backend/app/api/soil.py`, `frontend/src/components/SoilAnalysisView.tsx`.

### Module 5: Yield Prediction Model & GridSearchCV Training
- **Function**: Executes multi-model training and `GridSearchCV` hyperparameter tuning across 6 regression models (Linear Regression, Ridge, Random Forest, XGBoost, LightGBM, Dummy Mean Baseline), evaluating test RMSE/MAE/R²/Latency to save production model artifacts.
- **Code Mapping**: `scripts/train_models.py`, `models/best_model.pkl`, `models/model_performance_metrics.json`.

### Module 6: Prediction Outputs & Analytics Reporting Dashboard
- **Function**: Validates 14 input features via Pydantic V2, executes `ml_service.py` inference, calculates Productivity Ratings (`Low` <3500, `Medium` 3500-4800, `High` >4800) and renders interactive EDA statistical charts.
- **Code Mapping**: `backend/app/services/ml_service.py`, `backend/app/api/predictions.py`, `frontend/src/components/YieldPredictor.tsx`, `frontend/src/components/EdaDashboard.tsx`.

### Module 7: AI Recommendations & External LLM Insights
- **Function**: Integrates live **Groq LLM API** (`groq/compound-mini` / Llama-3 open source models) and Gemini AI to generate real-time AI yield summary insights, active crop risk flags, and step-by-step fertilizer/irrigation management advice.
- **Code Mapping**: `backend/app/services/llm_service.py`, `POST /api/predict/insights`, AI Insights Panel in `frontend/src/components/YieldPredictor.tsx`.

---

## 4. Development & Evaluation Directive
> **AUTHORITATIVE SPECIFICATION**: This Master System Architecture document serves as the official, updated specification for all project evaluations. All milestone deliverables (Milestones 1, 2, 3, and 4) map directly to the modules above.
