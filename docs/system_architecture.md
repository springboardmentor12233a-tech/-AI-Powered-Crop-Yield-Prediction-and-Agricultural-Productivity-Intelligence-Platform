# YieldSense AI — Official Platform Architecture & Module Specification

## 1. Executive System Overview
**YieldSense AI** is an enterprise-grade, AI-powered Crop Yield Prediction and Agricultural Productivity Intelligence Platform. 

The architecture is built on a **3-Tier Modular Framework** (Presentation Layer, API Gateway & AI Pipeline Layer, and Data/Storage Layer) adhering strictly to the official platform blueprint.

---

## 2. Master System Architecture Diagram

```mermaid
graph TD
    subgraph Layer1 ["1. USERS LAYER"]
        U1["Farmers"]
        U2["Agriculture Department"]
        U3["Agri Consultants"]
        U4["Researchers"]
        U5["Administrators"]
    end

    subgraph Layer2 ["2. WEB & MOBILE APPLICATION LAYER"]
        A1["Home Dashboard"]
        A2["Yield Predictor Engine"]
        A3["Weather Analytics"]
        A4["Soil Health Analysis"]
        A5["Dataset Explorer & Reports"]
    end

    subgraph Layer3 ["3. API GATEWAY & SECURITY LAYER"]
        G1["Authentication (JWT)"]
        G2["Request Routing"]
        G3["Role-Based Access Control"]
        G4["Pydantic V2 Schema Validation"]
    end

    subgraph Layer4 ["4. AI & DATA PROCESSING PIPELINE (MODULES 1 - 7)"]
        P1["Module 1: Data Collection<br/>(Crop info, Historical Yield, Soil, Weather)"]
        P2["Module 2: Data Preprocessing<br/>(Cleaning, Outliers, OneHotEncoder, StandardScaler)"]
        P3["Module 3: Weather Analysis<br/>(Rainfall adequacy, Temp stress, Humidity balance)"]
        P4["Module 4: Soil Analysis<br/>(Crop-aware pH, Moisture, Soil Health Index)"]
        P5["Module 5: Yield Prediction Model<br/>(XGBoost, Random Forest, LightGBM, Linear/Ridge)"]
        P6["Module 6: Prediction Outputs<br/>(Yield kg/ha, Productivity & Risk ratings)"]
        P7["Module 7: AI Recommendations & LLM<br/>(Groq Llama-3 LLM, Fertilizer & Irrigation advice)"]

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
        S3["Analytics JSON Storage (weather & soil json)"]
    end

    Users --> Layer2
    Layer2 --> Layer3
    Layer3 --> Layer4
    Layer4 --> Layer5
    Layer4 --> Layer6
```

---

## 3. Mandatory 7-Module Mapping & Code Reference

Every feature and milestone modification MUST align with the following 7 core processing modules:

### Module 1: Data Collection
- **Function**: Ingests agricultural telemetry, soil chemistry, weather conditions, and historical yield attributes.
- **Code Mapping**: `datasets/raw/Smart_Farming_Crop_Yield_2024.csv`, `datasets/processed/cleaned_crop_yield.csv`.

### Module 2: Data Preprocessing
- **Function**: Handles missing values, cleans categorical strings, scales numerical features via `StandardScaler()`, and encodes categorical variables via `OneHotEncoder(handle_unknown='ignore')`.
- **Code Mapping**: `scripts/preprocess_data.py`, `models/preprocessor.pkl`.

### Module 3: Weather Analysis
- **Function**: Computes regional rainfall adequacy scores, temperature stress risks, humidity balance, sunlight exposure, and overall regional weather scores across global agricultural regions.
- **Code Mapping**: `scripts/weather_analytics.py`, `backend/app/services/weather_service.py`, `backend/app/api/weather.py`, `frontend/src/components/WeatherAnalyticsView.tsx`.

### Module 4: Soil Analysis
- **Function**: Calculates crop-specific soil pH suitability (Rice: 5.5-6.8, Wheat: 6.0-7.5, Maize: 5.8-7.2, Soybean: 6.0-7.0, Cotton: 5.8-7.5), moisture sufficiency, NDVI index, and Soil Health Index (0.0-1.0).
- **Code Mapping**: `scripts/soil_analytics.py`, `backend/app/services/soil_service.py`, `backend/app/api/soil.py`, `frontend/src/components/SoilAnalysisView.tsx`.

### Module 5: Yield Prediction Model
- **Function**: Executes multi-model training and `GridSearchCV` hyperparameter tuning across 6 regression models (Linear Regression, Ridge, Random Forest, XGBoost, LightGBM, Dummy Mean Baseline), evaluating test RMSE/MAE/R²/Latency to save production model artifacts.
- **Code Mapping**: `scripts/train_models.py`, `models/best_model.pkl`, `models/model_performance_metrics.json`.

### Module 6: Prediction Outputs
- **Function**: Validates 14 input features via Pydantic V2, executes `ml_service.py` inference, and calculates Productivity Ratings (`Low` <3500, `Medium` 3500-4800, `High` >4800) and Risk Ratings.
- **Code Mapping**: `backend/app/services/ml_service.py`, `backend/app/api/predictions.py`, `frontend/src/components/YieldPredictor.tsx`.

### Module 7: AI Recommendations & LLM Insights
- **Function**: Integrates live **Groq LLM API** (`groq/compound-mini` / Llama-3 open source models) and Gemini AI to generate real-time AI yield summary insights, active crop risk flags, and step-by-step fertilizer/irrigation management advice.
- **Code Mapping**: `backend/app/services/llm_service.py`, `POST /api/predict/insights`, AI Insights Panel in `frontend/src/components/YieldPredictor.tsx`.

---

## 4. Development & Modification Directive
> **STRICT RULE**: All past, present, and future milestone developments (Milestones 1, 2, 3, and 4) MUST reference and preserve this 7-Module Architectural Specification. No code modification shall break or bypass these module contracts.
