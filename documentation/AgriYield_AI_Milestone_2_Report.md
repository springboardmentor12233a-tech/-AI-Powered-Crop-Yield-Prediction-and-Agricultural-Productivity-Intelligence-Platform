---
title: "AgriYield AI"
subtitle: "Milestone 2 Report — Machine Learning Model and Backend Integration"
author: "OVS VARUN"
date: "September 2026"
lang: en-IN
geometry: margin=1in
fontsize: 11pt
---

\vspace*{4cm}

# AI-Based Agricultural Crop-Yield Prediction System

## Milestone 2: Model Development, Evaluation and API Deployment

**Submitted by:** OVS VARUN  
**Email:** orugantivarun.2007@gmail.com

\vfill

**Project:** AgriYield AI  
**Model:** XGBoost Regressor  
**Backend:** FastAPI

\newpage

# 1. Executive Summary

AgriYield AI is a crop-yield prediction and decision-support system built from historical district-level agricultural data. Milestone 2 converts the data preparation work from Milestone 1 into a working machine-learning workflow and an API-ready backend.

The project reshapes the district-level source dataset into crop-wise observations, creates previous-year agricultural features, and evaluates several regression algorithms using a chronological train/test split. The selected production model is an XGBoost regressor. Its final test performance is **MAE = 237.72 kg/ha**, **RMSE = 583.04 kg/ha**, and **R² = 0.8540** for the held-out 2010–2017 period.

The trained pipeline is saved as a Joblib artifact and served through FastAPI. The API validates the request, generates a numerical prediction with the XGBoost model, and can request a constrained natural-language interpretation from Groq. The language-model component is explicitly instructed not to change the machine-learning prediction or fabricate unavailable farm conditions.

# 2. Objectives of Milestone 2

This milestone aimed to:

- convert the wide agricultural source dataset into a crop-level modelling table;
- create historical lag features for each district and crop;
- train and compare multiple regression models;
- use a time-based split to simulate prediction on unseen future years;
- tune Random Forest and XGBoost candidate models;
- save the selected XGBoost production pipeline and its metadata; and
- expose prediction and supporting-data endpoints through a validated FastAPI backend.

# 3. Dataset and Modelling Table

The modelling source is `datasets/ICRISAT_District_Level_Data.csv`. It contains 12,418 district-year records, 80 columns, 20 states, and 311 district names. Agricultural values are stored in a wide format, with separate area, production, and yield columns for individual crops.

The notebook identifies **23 yield columns** ending with `YIELD (Kg per ha)`. For every eligible crop, the related area and production fields are aligned and renamed to create a crop-wise table.

| Item | Result |
|---|---:|
| Source district-year records | 12,418 |
| Crop-wise records before lag creation | 285,614 |
| Records after removing missing previous-year yield | 278,461 |
| Crops modelled | 23 |
| Year range after lag creation | 1979–2017 |
| States | 20 |
| District names | 311 |

Each model record represents one crop in one district in one year. The core fields are district code, year, state, district, crop, area, production, yield, and historical values.

## 3.1 Feature Engineering

Records are sorted by `Dist Code`, `Crop`, and `Year`. The notebook then uses grouped one-period shifts to create the following historical features:

- `Previous_Year_Yield`
- `Previous_Year_Area`
- `Previous_Year_Production`

Rows without a previous-year yield are dropped because the lag cannot be calculated for them. The prediction target is **Yield** in kilograms per hectare.

The final input feature set is:

| Type | Features |
|---|---|
| Numerical | Year, Area, Previous_Year_Yield, Previous_Year_Area, Previous_Year_Production |
| Categorical | State Name, Dist Name, Crop |
| Target | Yield |

# 4. Training Methodology

## 4.1 Time-Aware Evaluation

The unique years are ordered chronologically and split at 80%. Earlier years are used for training and later years are reserved for testing. This avoids using later data to assess an earlier prediction scenario.

| Partition | Period | Records |
|---|---|---:|
| Training | 1979–2009 | 221,329 |
| Testing | 2010–2017 | 57,132 |

The notebook checks that the latest training year is earlier than the first test year, confirming that the partitions do not overlap temporally.

## 4.2 Preprocessing Pipeline

The preprocessing is part of a scikit-learn `Pipeline`, ensuring the same transformation is used during training and API prediction.

```text
Input features
     |
     +-- Numerical features --> StandardScaler
     |
     +-- Categorical features --> OneHotEncoder(handle_unknown="ignore")
     |
     +-- ColumnTransformer --> Regression model --> Yield (kg/ha)
```

Numerical values are standardised with `StandardScaler`. State, district, and crop names are one-hot encoded. `handle_unknown="ignore"` makes categorical transformation more robust if a value not seen during model fitting reaches the pipeline; the API additionally prevents unsupported state, district, crop, and year values through dataset-based validation.

## 4.3 Candidate Models

The notebook trains the following regressors under the same preprocessing structure:

- Linear Regression
- Decision Tree Regressor
- Random Forest Regressor
- Extra Trees Regressor
- Gradient Boosting Regressor
- XGBoost Regressor

Models are assessed using mean absolute error (MAE), root mean squared error (RMSE), and coefficient of determination (R²). Lower MAE and RMSE indicate lower prediction error; higher R² indicates that the model explains more variation in the held-out yield values.

# 5. Tuning and Final Model

Grid search with three-fold cross-validation is configured for Random Forest and XGBoost. The Random Forest search explores the number of estimators and maximum depth. The XGBoost search explores `n_estimators` (200, 300), `max_depth` (4, 6), and `learning_rate` (0.05, 0.1), for eight parameter combinations.

The production pipeline uses the selected XGBoost configuration:

| Hyperparameter | Value |
|---|---:|
| Objective | `reg:squarederror` |
| Learning rate | 0.05 |
| Maximum depth | 4 |
| Estimators | 200 |
| Random state | 42 |

The complete preprocessing-and-model pipeline is fitted on the training partition and saved as `backend/models/agri_yield_xgboost.joblib`. Associated metadata is retained in `backend/models/model_metadata.json` so the deployed model configuration, feature set, and test results remain traceable.

## 5.1 Final Test Results

The saved model metadata records the following performance on the untouched test period (2010–2017):

| Metric | Result |
|---|---:|
| MAE | 237.72 kg/ha |
| RMSE | 583.04 kg/ha |
| R² | 0.8540 |

An R² of 0.8540 means that, on this held-out historical test set, the model accounts for approximately 85.4% of the observed variation in yield. RMSE is higher than MAE because it assigns greater weight to larger errors. These results show strong predictive performance for the defined dataset and feature scenario, but they do not guarantee any individual future farm outcome.

# 6. Backend System Design

The backend is implemented with FastAPI. The application creates three services at startup:

```text
React client
    |
    v
FastAPI application (`app.py`)
    |
    +--> DatasetService: allowed states, districts, crops, years
    |
    +--> YieldPredictor: saved XGBoost pipeline prediction
    |
    +--> GroqService: constrained explanatory analysis
    |
    v
Structured JSON response
```

## 6.1 Prediction Flow

The `/api/predict` POST endpoint performs the following sequence:

1. Pydantic validates the request’s data types and numerical ranges.
2. `DatasetService` checks that the supplied state, district, crop, and year occur in the configured ICRISAT dataset.
3. `YieldPredictor` builds a one-row DataFrame with the exact model feature names and calls the saved pipeline.
4. The numerical prediction is rounded to two decimal places.
5. `GroqService` receives the supplied inputs and the ML output, then returns a concise explanation.
6. FastAPI returns a typed `PredictionResponse` in JSON.

The prediction is returned in **kg per ha**, with `model` identified as `XGBoost`.

## 6.2 Request and Response Contract

`PredictionRequest` requires these fields:

| Field | Validation |
|---|---|
| Year | Integer from 1900 to 2100; additionally checked against dataset years |
| State_Name, Dist_Name, Crop | Non-empty strings; additionally checked against dataset values |
| Area | Number greater than 0 |
| Previous_Year_Yield | Number greater than or equal to 0 |
| Previous_Year_Area | Number greater than or equal to 0 |
| Previous_Year_Production | Number greater than or equal to 0 |

The response contains `success`, request context fields, `predicted_yield`, `unit`, `model`, and `ai_analysis`. Intentional input problems receive HTTP 400 responses. Unexpected failures are converted into HTTP 500 responses with a failure detail.

## 6.3 Supporting Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /` | Backend status and version |
| `GET /api/health` | Health message and model/AI identifiers |
| `GET /api/states` | Valid state list |
| `GET /api/districts/{state}` | Districts for a state |
| `GET /api/crops` | Crop list inferred from dataset columns |
| `GET /api/years` | Valid years |
| `POST /api/predict` | Validated yield prediction and analysis |

Cross-Origin Resource Sharing (CORS) middleware is enabled so that the frontend can call the API during integration.

# 7. AI Explanation Layer and Responsible Use

Groq is used as an explanatory layer, not as the yield-prediction engine. The configured model defaults to `llama-3.3-70b-versatile`, while the API key is loaded from the environment using `python-dotenv` rather than being embedded in source code.

The Groq prompt applies important safeguards:

- XGBoost’s numerical result is authoritative and must not be recalculated or replaced.
- Only supplied data may be used.
- Missing factors such as rainfall, temperature, soil, irrigation, fertiliser, pests, prices, and local practices must be identified as unavailable rather than assumed.
- The response must distinguish ML prediction, interpretation, and general recommendations.
- It must state that the estimate is not guaranteed.

This design reduces the risk of presenting generated text as unsupported location-specific agricultural fact.

# 8. Technology Stack and Dependencies

| Area | Technologies used |
|---|---|
| Notebook and data manipulation | Python, pandas, NumPy |
| Preprocessing and evaluation | scikit-learn |
| Production model | XGBoost |
| Model persistence | Joblib |
| API framework and validation | FastAPI, Pydantic, Uvicorn |
| AI explanation | Groq Python SDK |
| Configuration | python-dotenv |
| Frontend integration | React client calling `/api/health` |

Dependencies are pinned in `backend/requirements.txt`, including FastAPI 0.141.1, pandas 3.0.5, scikit-learn 1.7.2, XGBoost 3.4.1, Joblib 1.6.0, and Groq 1.7.0.

# 9. Limitations and Future Work

The present model is an evidence-based historical-data predictor, not a complete farm simulator. Important limitations are:

- Predictions rely on historical district-level observations and the selected input features.
- Weather, soil characteristics, irrigation, seed variety, fertilizer application, pests, and market conditions are not model inputs.
- Lag values supplied to the API must be accurate and use the same units and meaning as training data.
- The API currently validates against available source-data categories, which protects consistency but limits predictions to supported values.
- Broad `allow_origins=["*"]` CORS is convenient during development; a production deployment should restrict approved frontend origins.
- Groq API configuration is required when AI analysis is enabled; operational deployment should include secure secret management and graceful handling of external AI-service failures.

Recommended next steps are to add automated tests, versioned model/data artifacts, authenticated access, structured logging, a richer prediction form and dashboard, and retraining/evaluation with newly validated agricultural data. Feature additions should be supported by matching historical training data and assessed with the same time-aware evaluation discipline.

# 10. Conclusion

Milestone 2 delivers the core predictive capability of AgriYield AI. The project successfully transforms district-level agricultural data into a crop-wise regression dataset, creates previous-year features, evaluates multiple algorithms, and selects a tuned XGBoost pipeline. The reported held-out test result of R² = 0.8540 demonstrates that the model is suitable as a strong decision-support baseline within its dataset scope.

The backend operationalises this model through a validated FastAPI interface, provides endpoints for valid agricultural selections, and adds a carefully constrained AI explanation layer. Together, these components establish a practical foundation for a user-facing crop-yield forecasting application.

\vfill

**Submitted by:** OVS VARUN  
**Email:** orugantivarun.2007@gmail.com
