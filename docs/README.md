# YieldSense AI
## Crop Yield Prediction & Agricultural Productivity Forecasting System

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Project Objectives](#3-project-objectives)
4. [Key Features](#4-key-features)
5. [Dataset](#5-dataset)
6. [Technology Stack](#6-technology-stack)
7. [System Architecture](#7-system-architecture)
8. [Project Folder Structure](#8-project-folder-structure)
9. [Machine Learning Workflow](#9-machine-learning-workflow)
10. [ML Models](#10-ml-models)
11. [Model Evaluation Results](#11-model-evaluation-results)
12. [Prediction Workflow](#12-prediction-workflow)
13. [Weather Analysis](#13-weather-analysis)
14. [Soil Analysis](#14-soil-analysis)
15. [Groq AI Insights](#15-groq-ai-insights)
16. [Backend APIs](#16-backend-apis)
17. [Frontend Pages](#17-frontend-pages)
18. [Authentication](#18-authentication)
19. [Testing](#19-testing)
20. [How to Run the Project](#20-how-to-run-the-project)
21. [Environment Variables](#21-environment-variables)
22. [Current Project Status](#22-current-project-status)
23. [5-Minute Presentation Summary](#23-5-minute-presentation-summary)
24. [Important Concepts to Understand](#24-important-concepts-to-understand)

---

## 1. Project Overview

### What the project does
YieldSense AI is a web-based platform that uses machine learning to predict how much crop a farmer can expect to harvest (in **kg per acre**), based on inputs like soil quality, weather conditions, fertilizer usage, irrigation, and NPK nutrient levels.  
It also analyzes historical weather and soil data, and uses an AI language model (Groq) to generate practical agricultural advice based on the prediction.

### Why the project is needed
Farmers and agricultural organizations often struggle to plan ahead because crop yield is unpredictable. Traditional methods rely on guesswork and experience. A data-driven AI system can reduce uncertainty, help optimize resources, and improve decision-making before the growing season begins.

### Who can use it
- **Farmers** — to estimate yield and plan resources
- **Agricultural researchers** — to study the effect of soil/weather on crops
- **Government agriculture departments** — to forecast regional production
- **Agribusiness companies** — to plan procurement and supply chains

---

## 2. Problem Statement

Farmers face significant uncertainty when estimating how much crop they will produce in a season. Factors like rainfall, temperature, soil quality, fertilizer application, and irrigation all affect yield — but understanding how they interact is complex. Without data-driven tools, farmers are forced to rely on experience alone, leading to poor planning, wasted resources, and financial losses.

**YieldSense AI solves this by:**
- Accepting farm-specific input parameters
- Using trained machine learning models to predict crop yield (kg/acre)
- Analyzing weather and soil data for additional insight
- Providing AI-generated agricultural recommendations via Groq

---

## 3. Project Objectives

1. Build a multi-model machine learning pipeline to predict crop yield
2. Use GridSearchCV to tune each model and find optimal hyperparameters
3. Compare all models using R², MAE, and RMSE, and select the best one
4. Develop a REST API using FastAPI to serve predictions
5. Build a React frontend that connects to the backend
6. Add weather and soil analysis features using dataset statistics
7. Integrate the Groq LLM to generate agricultural insights from predictions
8. Implement secure user authentication using JWT tokens

---

## 4. Key Features

| Feature | Status |
|---|---|
| User registration and login with JWT authentication | ✅ Implemented |
| Crop yield prediction using a trained ML model | ✅ Implemented |
| 5 ML regression models trained | ✅ Implemented |
| GridSearchCV hyperparameter tuning for all models | ✅ Implemented |
| Model comparison table (R², MAE, RMSE) | ✅ Implemented |
| Best model selection and saving | ✅ Implemented |
| Weather analysis (statistics, correlations, charts) | ✅ Implemented |
| Soil analysis (NPK stats, pH categories, fertilizer impact) | ✅ Implemented |
| AI-generated agricultural insights via Groq LLM | ✅ Implemented |
| React frontend connected to FastAPI backend | ✅ Implemented |
| Protected routes (login required to access dashboard/predict) | ✅ Implemented |

---

## 5. Dataset

### File
`data/crop_yield.csv`

### Size
- **2200 rows** (records)
- **13 columns** (12 input features + 1 target)
- **0 missing values**

### Source
The dataset was **programmatically generated** for this project using `data/generate_dataset.py`.  
It is inspired by the structure of agricultural yield datasets but is not downloaded from any external source like Kaggle, FAOSTAT, or USDA.  
The generator uses realistic crop base yields, soil effects, weather effects, and NPK contributions to compute yield values with random variation.

### Target Variable
| Column | Description |
|---|---|
| `Yield_kg_per_acre` | Crop yield in kilograms per acre (the value we predict) |

### Input Features

**Categorical Features** (text/category values):

| Column | Description | Values |
|---|---|---|
| `Crop` | Type of crop grown | Rice, Wheat, Maize, Sugarcane, Cotton, Soybean, Barley, Sorghum |
| `Weather_Condition` | Overall weather during the season | Sunny, Rainy, Cloudy, Windy, Stormy |
| `Soil_Type` | Classification of the soil | Loamy, Sandy, Clay, Silty, Peaty, Chalky |
| `Region` | Geographic area of the farm | North, South, East, West, Central |

**Numerical Features** (number values):

| Column | Description | Range |
|---|---|---|
| `Rainfall_mm` | Annual rainfall in millimetres | ~100 – 2500 mm |
| `Temperature_C` | Average temperature in Celsius | ~10 – 45 °C |
| `Fertilizer_Used` | Whether fertilizer was applied (binary) | 0 = No, 1 = Yes |
| `Irrigation_Used` | Whether irrigation was used (binary) | 0 = No, 1 = Yes |
| `Nitrogen` | Nitrogen content in kg/ha | 40 – 140 |
| `Phosphorus` | Phosphorus content in kg/ha | 20 – 100 |
| `Potassium` | Potassium content in kg/ha | 30 – 120 |
| `Soil_pH` | pH level of the soil | 4.5 – 8.5 |

### Target Statistics (from actual dataset)
- Mean yield: **2669.5 kg/acre**
- Std Dev: **1102.1 kg/acre**
- Min: **514.5 kg/acre**
- Max: **5987.6 kg/acre**

### Data Preprocessing
- Dropped rows with null values (none found — dataset is clean)
- Categorical features encoded with **OneHotEncoder** (`handle_unknown="ignore"`)
- Numerical features scaled with **StandardScaler** (zero mean, unit variance)
- All preprocessing is done inside a scikit-learn `Pipeline` with `ColumnTransformer`

---

## 6. Technology Stack

| Technology | Version | Why it is used |
|---|---|---|
| **Python** | 3.12 | Main programming language for backend and ML |
| **Pandas** | 2.2.2 | Load the CSV dataset, compute statistics, group/aggregate data for analysis |
| **NumPy** | 1.26.4 | Numerical calculations (RMSE, array operations in prediction) |
| **Scikit-learn** | 1.5.0 | Train all 5 ML models, preprocessing pipeline, GridSearchCV, evaluation metrics |
| **GridSearchCV** | (part of scikit-learn) | Automatically finds the best hyperparameters for each model using 5-fold cross-validation |
| **joblib** | 1.4.2 | Save and load the trained model and preprocessor as `.pkl` files |
| **FastAPI** | 0.111.0 | Build the REST API backend — fast, modern, auto-generates Swagger docs |
| **Uvicorn** | 0.29.0 | ASGI server that runs the FastAPI application |
| **SQLAlchemy** | 2.0.30 | ORM to interact with the SQLite database for user accounts |
| **SQLite** | (built-in) | Lightweight database to store user accounts — no installation required |
| **bcrypt** | ≥4.0.0 | Securely hash user passwords before storing in the database |
| **python-jose** | 3.3.0 | Create and verify JWT tokens for authentication |
| **Groq** | 0.9.0 | Call the Groq LLM API to generate AI agricultural insights |
| **React** | 18.3.1 | Build the interactive frontend user interface |
| **Vite** | 5.3.4 | Development server and bundler for the React frontend |
| **React Router** | 6.26.0 | Handle page navigation (login, register, dashboard, predict) |
| **Axios** | 1.7.2 | Make HTTP requests from the frontend to the FastAPI backend |
| **Recharts** | 2.12.7 | Render charts on the dashboard (bar charts for weather/soil/model analysis) |

> **Note:** XGBoost is listed in `requirements.txt` but was not used in the 5 trained models. Only scikit-learn models were trained.

---

## 7. System Architecture

```
                        ┌─────────────────────────────────────────────┐
                        │           React Frontend (Vite)              │
                        │   LoginPage / RegisterPage / DashboardPage   │
                        │              / PredictPage                   │
                        └───────────────────┬─────────────────────────┘
                                            │ HTTP (Axios)
                                            ▼
                        ┌─────────────────────────────────────────────┐
                        │         FastAPI Backend (Python)             │
                        │   - JWT Authentication middleware            │
                        │   - Input validation (Pydantic)              │
                        ├──────────────┬──────────────┬───────────────┤
                        │  ML Pipeline │Weather/Soil  │  Groq LLM     │
                        │  (Scikit-    │  Analysis    │  API Call     │
                        │   learn)     │  (Pandas)    │               │
                        └──────┬───────┴──────┬───────┴───────┬───────┘
                               │              │               │
                     ┌─────────▼──────┐  ┌────▼────┐  ┌──────▼──────┐
                     │ best_model.pkl │  │ CSV     │  │ Groq API    │
                     │ (Linear Reg.)  │  │ Dataset │  │ (LLM)       │
                     └────────────────┘  └─────────┘  └─────────────┘
                               │
                        ┌──────▼──────┐
                        │  SQLite DB  │
                        │ (user data) │
                        └─────────────┘
```

**Flow:**
1. User opens the frontend in a browser
2. User registers/logs in → receives a JWT token
3. User fills in farm parameters → frontend sends them to FastAPI
4. FastAPI validates the input, runs the ML model → returns yield prediction
5. User can also request AI insights → FastAPI calls Groq → returns explanation
6. Dashboard fetches weather and soil analysis → FastAPI reads the CSV and returns statistics

---

## 8. Project Folder Structure

```
D:\2nd milestone\
│
├── data\
│   ├── crop_yield.csv            ← The training dataset (2200 rows)
│   └── generate_dataset.py       ← Script used to generate the dataset
│
├── backend\
│   ├── main.py                   ← FastAPI app entry point, registers all routes
│   ├── auth_utils.py             ← Password hashing (bcrypt) and JWT utilities
│   ├── config.py                 ← Loads settings from .env file
│   ├── requirements.txt          ← Python package dependencies
│   ├── test_api.py               ← API test script (10 tests)
│   ├── test_groq.py              ← Groq live test script
│   ├── .env                      ← Environment variables (NOT committed to Git)
│   ├── .env.GROQ_API_KEY         ← Template for environment variables
│   │
│   ├── db\
│   │   └── database.py           ← SQLAlchemy User model + SQLite connection
│   │
│   ├── models\
│   │   └── schemas.py            ← Pydantic schemas for API requests/responses
│   │
│   ├── routes\
│   │   ├── auth.py               ← POST /auth/register, /auth/login, GET /auth/me
│   │   ├── predict.py            ← POST /predict, GET /model-info, /model-comparison
│   │   ├── insights.py           ← POST /ai-insights (Groq LLM)
│   │   ├── weather.py            ← GET /weather/analysis
│   │   └── soil.py               ← GET /soil/analysis
│   │
│   ├── ml\
│   │   ├── train.py              ← Training pipeline: 5 models + GridSearchCV
│   │   └── predictor.py          ← Loads saved model and runs predictions
│   │
│   └── saved_models\
│       ├── best_model.pkl        ← Saved Linear Regression pipeline
│       ├── preprocessor.pkl      ← Saved ColumnTransformer
│       ├── model_comparison.json ← All 5 model results (R², MAE, RMSE)
│       └── training_metadata.json ← Feature names, categories, best model info
│
├── frontend\
│   ├── package.json              ← npm dependencies
│   ├── vite.config.js            ← Vite configuration (proxy to backend)
│   └── src\
│       ├── main.jsx              ← React entry point
│       ├── App.jsx               ← Router with protected route logic
│       ├── index.css             ← Global CSS design system
│       ├── components\
│       │   └── Layout.jsx        ← Sidebar navigation layout
│       ├── pages\
│       │   ├── LoginPage.jsx     ← Login form page
│       │   ├── RegisterPage.jsx  ← Registration form page
│       │   ├── DashboardPage.jsx ← Weather/Soil/Model analytics page
│       │   └── PredictPage.jsx   ← Yield prediction + AI insights page
│       └── services\
│           └── api.js            ← Axios service layer with JWT interceptor
│
└── docs\
    └── README.md                 ← This file
```

---

## 9. Machine Learning Workflow

```
Step 1 — Load Dataset
  └── Read crop_yield.csv (2200 rows, 13 columns)

Step 2 — Data Preprocessing
  ├── Drop rows with null values (none found)
  ├── Separate features (X) and target (y = Yield_kg_per_acre)
  ├── OneHotEncode categorical features (Crop, Weather_Condition, Soil_Type, Region)
  └── StandardScale numerical features (Rainfall, Temp, N, P, K, pH, etc.)

Step 3 — Train/Test Split
  └── 80% train (1760 rows) | 20% test (440 rows), random_state=42

Step 4 — Build sklearn Pipeline for Each Model
  └── Pipeline([("preprocessor", ColumnTransformer), ("model", estimator)])

Step 5 — GridSearchCV (5-fold cross-validation)
  └── Find the best hyperparameters for each of the 5 models
      scoring="r2", n_jobs=-1

Step 6 — Evaluate on Test Set
  └── Calculate R², MAE, RMSE for each model

Step 7 — Compare Models
  └── Sort by R² score descending

Step 8 — Select Best Model
  └── Linear Regression (R²=0.9772) selected as best

Step 9 — Save Artifacts
  ├── best_model.pkl          (complete pipeline)
  ├── preprocessor.pkl        (fitted ColumnTransformer)
  ├── model_comparison.json   (all results)
  └── training_metadata.json  (column names, categories)

Step 10 — Prediction via API
  └── POST /predict → load best_model.pkl → preprocess → predict → return kg/acre
```

---

## 10. ML Models

All 5 models are embedded in a full scikit-learn `Pipeline` with the same preprocessing steps.

| Model | Description |
|---|---|
| **Linear Regression** | The simplest regression model. It finds a straight-line relationship between input features and yield. Works very well here because the dataset was designed with additive linear effects. |
| **Decision Tree Regressor** | Splits data into branches based on feature thresholds. Easy to interpret but can overfit. Tuned with max_depth and min_samples parameters. |
| **Random Forest Regressor** | Builds many decision trees and averages their predictions. More robust than a single tree. Tuned with n_estimators and max_depth. |
| **Gradient Boosting Regressor** | Builds trees sequentially, where each tree corrects errors of the previous one. Strong performer. Tuned with learning_rate, n_estimators, and max_depth. |
| **Extra Trees Regressor** | Similar to Random Forest but splits are chosen more randomly, making it faster to train. Tuned with n_estimators and max_depth. |

---

## 11. Model Evaluation Results

> All values below are **actual results** from running `ml/train.py` on the test set (440 rows).  
> These numbers are stored in `saved_models/model_comparison.json` and `training_metadata.json`.

| Model | R² Score | MAE (kg/acre) | RMSE (kg/acre) | CV Score |
|---|---|---|---|---|
| 🏆 **Linear Regression** | **0.9772** | **132.42** | **169.50** | 0.9807 |
| Gradient Boosting | 0.9753 | 139.93 | 176.58 | 0.9771 |
| Random Forest | 0.9576 | 187.61 | 231.35 | 0.9579 |
| Extra Trees | 0.9563 | 187.52 | 234.75 | 0.9545 |
| Decision Tree | 0.9349 | 229.15 | 286.61 | 0.9314 |

### Best Model: Linear Regression

**Why Linear Regression won:**  
The dataset was generated with additive linear effects — fertilizer adds a fixed amount, irrigation adds a fixed amount, NPK levels scale linearly with yield. This means the true relationship in the data is close to linear, making Linear Regression the ideal model.

**What the metrics mean:**
- **R² = 0.9772** → The model explains 97.72% of the variation in crop yield
- **MAE = 132.42 kg/acre** → On average, the prediction is off by 132 kg/acre
- **RMSE = 169.50 kg/acre** → Gives higher penalty to large errors

**Best hyperparameters found:** `fit_intercept = False`

---

## 12. Prediction Workflow

When a user submits farm parameters through the frontend:

```
1. User fills the Prediction Form:
   Crop=Rice, Rainfall=950mm, Temperature=28°C,
   Fertilizer=Yes, Irrigation=Yes, Weather=Sunny,
   Soil=Loamy, Region=South, N=90, P=55, K=65, pH=6.8

2. Frontend sends a POST /predict request with JWT token

3. FastAPI validates the input (Pydantic schema)

4. predictor.py loads best_model.pkl (Linear Regression Pipeline)

5. Input is converted to a DataFrame matching the training column order

6. The Pipeline automatically:
   a. OneHotEncodes: Rice → [0,0,0,1,0,0,0,0], Sunny → [0,0,0,1,0], etc.
   b. StandardScales: Rainfall, Temp, N, P, K, pH

7. Linear Regression predicts: e.g., 3707.56 kg/acre

8. Response returned to frontend:
   {
     "predicted_yield_kg_per_acre": 3707.56,
     "model_used": "Linear Regression",
     "prediction_confidence": "high"
   }

9. User optionally clicks "Get AI Insights" → Groq LLM explains the result
```

---

## 13. Weather Analysis

**Endpoint:** `GET /weather/analysis` (requires login)

The weather analysis reads all 2200 rows from `crop_yield.csv` and computes:

| What is calculated | Description |
|---|---|
| **Rainfall statistics** | Count, mean, std, min, max of Rainfall_mm |
| **Temperature statistics** | Count, mean, std, min, max of Temperature_C |
| **Average yield by weather condition** | e.g., Sunny vs Stormy — which gives better yield? |
| **Average rainfall by weather condition** | Rainfall distribution across weather types |
| **Average temperature by crop** | Which crops grow in which temperature range? |
| **Average yield by crop** | Which crop has the highest average yield? |
| **Yield by rainfall category** | Very Low / Low / Medium / High / Very High rainfall bins |
| **Yield by irrigation** | Irrigated vs non-irrigated average yield |
| **Correlation: Rainfall vs Yield** | Pearson r = 0.0879 |
| **Correlation: Temperature vs Yield** | Pearson r computed from dataset |
| **Interpretation text** | Human-readable explanation of each correlation |

This data is displayed on the Dashboard page as bar charts using Recharts.

---

## 14. Soil Analysis

**Endpoint:** `GET /soil/analysis` (requires login)

The soil analysis reads all 2200 rows from `crop_yield.csv` and computes:

| What is calculated | Description |
|---|---|
| **Nitrogen statistics** | Mean, std, min, max of Nitrogen (kg/ha) |
| **Phosphorus statistics** | Mean, std, min, max of Phosphorus (kg/ha) |
| **Potassium statistics** | Mean, std, min, max of Potassium (kg/ha) |
| **Soil pH statistics** | Mean, std, min, max of Soil_pH |
| **Average yield by soil type** | Which soil type (Loamy, Sandy, Clay, etc.) gives highest yield? |
| **Top soil type by yield** | Silty soil shows highest average yield |
| **Average yield by pH category** | Acidic / Slightly Acidic / Neutral / Alkaline |
| **Average yield by fertilizer use** | Fertilized vs non-fertilized comparison |
| **Average NPK by soil type** | NPK breakdown per soil classification |
| **NPK–Yield correlations** | N vs yield (r=0.0239), P vs yield, K vs yield, pH vs yield |
| **High-yield vs low-yield NPK** | Average NPK for above-median vs below-median yield crops |
| **Interpretation text** | Explanation of each nutrient's role |

This data is displayed on the Dashboard page as bar charts.

---

## 15. Groq AI Insights

**Endpoint:** `POST /ai-insights` (requires login)

### Why an LLM is used
The ML model only returns a number (yield in kg/acre). Farmers need to understand **why** that number was predicted and **what they can do** about it. A large language model (LLM) can take the full agricultural context and generate human-readable, actionable recommendations.

### What information is sent to Groq
The following is sent as a structured prompt:
- Crop type and region
- Soil type, soil pH, NPK values
- Rainfall, temperature, weather condition
- Whether fertilizer and irrigation were used
- The predicted yield from the ML model

The prompt explicitly tells the LLM **not to change or contradict** the ML prediction value.

### What type of insight is generated
The Groq LLM (model: `qwen/qwen3.8-27b`) returns a structured analysis with 5 sections:
1. **Prediction Explanation** — Why this yield was predicted
2. **Soil Assessment** — Evaluation of pH and NPK levels
3. **Weather Impact** — How rainfall, temperature, and conditions affect the crop
4. **Farming Recommendations** — Practical steps to improve yield
5. **Risk Observations** — Challenges or risks under current conditions

### How the API key is stored securely
- The key is stored in `backend/.env` as `GROQ_API_KEY=...`
- It is loaded at runtime using `python-dotenv` and `pydantic-settings`
- It is **never hardcoded** in any Python file
- The `.env` file must never be committed to GitHub

### What happens if the Groq API key is unavailable
If `GROQ_API_KEY` is missing or the API call fails, the endpoint **does not crash**. It returns a graceful message:
```
"AI insights temporarily unavailable. Your ML prediction result is still valid."
```
The crop yield prediction continues to work normally without Groq.

---

## 16. Backend APIs

Base URL: `http://127.0.0.1:8000`  
Interactive docs: `http://127.0.0.1:8000/docs`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | `/` | No | Returns API name and version info |
| GET | `/health` | No | Returns `{"status": "healthy"}` — use to check if backend is running |
| GET | `/docs` | No | Auto-generated Swagger UI to test all endpoints |
| POST | `/auth/register` | No | Create a new user account. Accepts username, email, password, role, farm details |
| POST | `/auth/login` | No | Login with username and password. Returns a JWT access token |
| GET | `/auth/me` | Yes | Returns the profile of the currently logged-in user |
| POST | `/predict` | Yes | Accepts 12 farm parameters. Returns predicted yield in kg/acre |
| GET | `/model-info` | Yes | Returns the best model name, R² score, and training details |
| GET | `/model-comparison` | Yes | Returns R², MAE, RMSE for all 5 trained models |
| POST | `/ai-insights` | Yes | Sends farm data + ML prediction to Groq → returns AI agricultural analysis |
| GET | `/weather/analysis` | Yes | Returns weather statistics and correlations from the dataset |
| GET | `/soil/analysis` | Yes | Returns soil/NPK statistics and correlations from the dataset |

---

## 17. Frontend Pages

The frontend is built with **React 18 + Vite** and runs at `http://localhost:5173`.

### Login Page (`/login`)
- A form with username and password fields
- Calls `POST /auth/login`
- On success, saves the JWT token in `localStorage` and redirects to the dashboard
- Shows error messages if credentials are wrong

### Register Page (`/register`)
- A form with fields: username, full name, email, password, confirm password, role (farmer/researcher/admin), farm name, farm location
- Calls `POST /auth/register`, then automatically logs in
- Redirects to dashboard after successful registration

### Dashboard Page (`/`)
- Protected route — requires login
- Has 3 tabs:
  - **Weather Analysis** — bar charts showing yield by weather condition, yield by crop, rainfall statistics, temperature correlations
  - **Soil Analysis** — bar charts showing yield by soil type, NPK correlation with yield
  - **Model Comparison** — table and bar charts showing R², MAE, RMSE for all 5 models
- Data is fetched from `/weather/analysis`, `/soil/analysis`, and `/model-comparison`

### Predict Page (`/predict`)
- Protected route — requires login
- A form with all 12 input fields (Crop, Region, Rainfall, Temperature, Weather Condition, Soil Type, NPK values, Soil pH, Fertilizer toggle, Irrigation toggle)
- Click **"Predict Crop Yield"** → calls `POST /predict` → shows predicted yield (kg/acre)
- Click **"Get AI Agricultural Insights"** → calls `POST /ai-insights` → shows Groq's analysis

---

## 18. Authentication

The system uses **JWT (JSON Web Token)** based authentication.

### How it works:
1. **Registration** (`POST /auth/register`):
   - User submits username, email, and password
   - Password is hashed using **bcrypt** before storing in the database
   - User account is saved in SQLite database (`yieldsense.db`)
   - Supported roles: `farmer`, `researcher`, `admin`

2. **Login** (`POST /auth/login`):
   - User submits username and password
   - Backend fetches the user from the database
   - Password is verified using bcrypt (`checkpw`)
   - If correct, a **JWT token** is created and returned
   - Token expires after 60 minutes (configurable)

3. **Protected endpoints**:
   - All prediction, analysis, and insights endpoints require the JWT token
   - Token is sent in the `Authorization: Bearer <token>` header
   - FastAPI verifies the token on every protected request using `Depends(get_current_user)`

4. **Frontend**:
   - Token is stored in `localStorage` under the key `ys_token`
   - Axios automatically adds the token to all API requests via an interceptor
   - If no token is found, the user is redirected to `/login`

---

## 19. Testing

A test script (`backend/test_api.py`) was run against the live backend.

### Test Results — All 10 Tests Passed

```
=== 1. HEALTH CHECK ===       [PASS]  status=healthy
=== 2. REGISTER ===           [PASS]  user created, status=201
=== 3. LOGIN ===              [PASS]  JWT token obtained, status=200
=== 4. AUTH /me ===           [PASS]  profile returned, status=200
=== 5. YIELD PREDICTION ===   [PASS]  3657.54 kg/acre (Rice, Loamy, Sunny), status=200
=== 6. MODEL INFO ===         [PASS]  Linear Regression, R²=0.9772, status=200
=== 7. MODEL COMPARISON ===   [PASS]  5 models returned, status=200
=== 8. WEATHER ANALYSIS ===   [PASS]  2200 records, rain_corr=0.0879, status=200
=== 9. SOIL ANALYSIS ===      [PASS]  top_soil=Silty, status=200
=== 10. AI INSIGHTS ===       [PASS]  Groq provider, status=200

RESULTS: 10 passed, 0 failed
```

A separate Groq live test (`backend/test_groq.py`) confirmed that the Groq API returns detailed AI insights when `GROQ_API_KEY` is configured.

---

## 20. How to Run the Project

### Prerequisites
- Python 3.12 or higher installed
- Node.js 18 or higher installed
- A Groq API key (free at https://console.groq.com)

---

### Step 1 — Clone / open the project folder

```
D:\2nd milestone\
```

---

### Step 2 — Backend Setup

Open a terminal and run:

```powershell
cd "D:\2nd milestone\backend"
```

**Install Python packages:**
```powershell
pip install -r requirements.txt
```

**Create your .env file:**  
Copy the template and fill in your Groq key:
```powershell
copy .env.GROQ_API_KEY .env
```
Then open `.env` and set:
```
GROQ_API_KEY=your_actual_groq_api_key_here
```

**The ML model is already trained.** The saved files are in `backend/saved_models/`.  
You do NOT need to re-run training unless you want to retrain.

**Start the backend:**
```powershell
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Backend is now running at: **http://127.0.0.1:8000**  
Swagger API docs: **http://127.0.0.1:8000/docs**

---

### Step 3 — Frontend Setup

Open a **second terminal** and run:

```powershell
cd "D:\2nd milestone\frontend"
```

**If on Windows and node is not in PATH:**
```powershell
$env:PATH = "C:\Program Files\nodejs;$env:PATH"
```

**Install npm packages (first time only):**
```powershell
npm install
```

**Start the frontend:**
```powershell
npm run dev
```

Frontend is now running at: **http://localhost:5173**

---

### Step 4 — Use the Application

1. Open **http://localhost:5173** in your browser
2. Click **Create account** and register
3. Log in with your username and password
4. **Dashboard** → view weather analysis, soil analysis, and model comparison charts
5. **Yield Prediction** → fill in farm parameters → click **Predict Crop Yield**
6. Click **Get AI Agricultural Insights** (requires Groq key) to get AI farming advice

---

### Step 5 — Run Tests (Optional)

```powershell
cd "D:\2nd milestone\backend"
python test_api.py
```

---

## 21. Environment Variables

The file `backend/.env` must contain the following variables.  
**Never share or commit this file.** Only the variable names are shown below — not real values.

```env
# JWT Authentication
SECRET_KEY=your_long_random_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Database
DATABASE_URL=sqlite:///./yieldsense.db

# Groq LLM API Key — get free key at https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here

# Paths (relative to backend/)
DATASET_PATH=../data/crop_yield.csv
MODEL_DIR=./saved_models
```

---

## 22. Current Project Status

| Component | Status |
|---|---|
| **Milestone 1** — Project setup, authentication, database, frontend structure | ✅ Complete |
| **Milestone 2** — ML pipeline, GridSearchCV, model comparison, APIs, weather/soil analysis, Groq integration, frontend-backend integration | ✅ Complete |
| Milestone 3 | ❌ Not implemented (out of scope) |
| Milestone 4 | ❌ Not implemented (out of scope) |

### Completed deliverables:
- ✅ Dataset (`crop_yield.csv`, 2200 rows)
- ✅ 5 ML models trained with GridSearchCV
- ✅ Model saved: `best_model.pkl` (Linear Regression, R²=0.9772)
- ✅ FastAPI backend with 11 endpoints
- ✅ SQLite database with user authentication
- ✅ React frontend with 4 pages
- ✅ Groq LLM integration (model: `qwen/qwen3.8-27b`)
- ✅ 10/10 API tests passing
- ✅ Documentation

---

## 23. 5-Minute Presentation Summary

Use this as a speaking guide for your presentation:

---

**[0:00 – 0:30] Introduction**  
"Hello, my project is called **YieldSense AI** — a crop yield prediction and agricultural forecasting system. It uses machine learning and AI to help farmers estimate how much crop they will harvest before the season begins."

---

**[0:30 – 1:00] Problem**  
"Farmers face a major problem — they cannot predict crop yield accurately. They rely on experience and guesswork, which leads to wasted resources and financial losses. There was no simple, data-driven tool available to them."

---

**[1:00 – 1:30] Objective**  
"My goal was to build a complete AI-powered platform that takes farm parameters as input — like soil type, rainfall, NPK values, and weather condition — and predicts the expected crop yield in kg per acre. I also added weather analysis, soil analysis, and AI-generated farming recommendations."

---

**[1:30 – 2:00] Dataset**  
"I used a programmatically generated dataset of 2200 records with 12 features including crop type, rainfall, temperature, NPK values, soil type, and weather condition. The target variable is Yield in kg per acre, ranging from 514 to 5987 kg/acre."

---

**[2:00 – 2:45] ML Training**  
"I trained 5 regression models: Linear Regression, Decision Tree, Random Forest, Gradient Boosting, and Extra Trees. For each model, I used GridSearchCV with 5-fold cross-validation to find the best hyperparameters automatically. All models were built using a scikit-learn Pipeline with OneHotEncoding for categorical features and StandardScaling for numerical features."

---

**[2:45 – 3:00] Best Model Results**  
"After comparing all models on R², MAE, and RMSE, **Linear Regression came out best** with an R² of **0.9772**, meaning it explains 97.7% of the variation in yield. The average prediction error is just 132 kg/acre."

---

**[3:00 – 3:20] Weather and Soil Analysis**  
"The platform also provides weather analysis — showing how rainfall, temperature, and weather conditions affect yield — and soil analysis — showing how NPK levels, soil pH, and soil type relate to yield. These are computed from the actual dataset using Pandas."

---

**[3:20 – 3:45] Groq AI Insights**  
"When a prediction is made, the user can click 'Get AI Insights'. This sends the farm parameters and ML prediction to the Groq LLM, which generates a detailed agricultural analysis — explaining why that yield was predicted, assessing the soil, and recommending practical farming actions."

---

**[3:45 – 4:15] Frontend and Backend**  
"The backend is built with FastAPI in Python — it has 11 REST API endpoints including prediction, authentication, weather analysis, soil analysis, and AI insights. The frontend is built with React and Vite — it has 4 pages: Login, Register, Dashboard, and Predict. The frontend and backend are fully connected using Axios."

---

**[4:15 – 4:30] Testing**  
"I wrote an automated test script that tests all 10 API endpoints — registration, login, authentication, prediction, model comparison, weather analysis, soil analysis, and AI insights. All 10 tests passed."

---

**[4:30 – 5:00] Conclusion**  
"YieldSense AI successfully combines machine learning, data analysis, and AI language models into a practical agricultural tool. It helps farmers make data-driven decisions, reduce uncertainty, and improve crop planning. The system is fully functional with a working backend, frontend, and AI integration. Thank you."

---

## 24. Important Concepts to Understand

### Regression
Regression is a type of machine learning where the model **predicts a number** (not a category). In this project, we predict crop yield — a continuous number like 3657 kg/acre — which makes it a regression problem.

### R² (R-squared)
R² measures how well the model explains the variation in the target variable.  
- R² = 1.0 → perfect prediction  
- R² = 0.9772 → the model explains 97.72% of yield variation  
- Closer to 1 is better

### MAE (Mean Absolute Error)
MAE is the average difference between predicted and actual values, ignoring direction.  
- MAE = 132.42 kg/acre → on average, our prediction is off by 132 kg/acre  
- Lower is better

### RMSE (Root Mean Squared Error)
RMSE is similar to MAE but gives extra penalty to large errors.  
- RMSE = 169.50 kg/acre  
- Lower is better  
- If RMSE is much higher than MAE, it means there are some large prediction mistakes

### GridSearchCV
GridSearchCV automatically tests all combinations of hyperparameter values you specify and finds the best combination using cross-validation.  
Example: For Random Forest, it tests all combinations of {100 or 200 trees} × {depth 10, 20, or None} and picks the best.

### Hyperparameter
A hyperparameter is a setting you give to a model **before training** — like how many trees to use, or how deep each tree can grow. These are not learned from data; they must be chosen.

### Train/Test Split
We split the dataset into two parts:
- **Training set (80% = 1760 rows)** — the model learns patterns from this
- **Test set (20% = 440 rows)** — we evaluate the model on data it has never seen before

This ensures we measure real performance, not just memorization.

### FastAPI
FastAPI is a modern Python web framework for building REST APIs. It is fast, easy to use, and automatically generates documentation. We use it to build the backend server that handles all requests from the frontend.

### REST API
A REST API is a way for different software (like our frontend and backend) to communicate over HTTP. The frontend sends requests like `POST /predict` with farm data, and the backend responds with the predicted yield.

### LLM (Large Language Model)
An LLM is an AI model trained on massive amounts of text that can understand and generate human-like text. In this project, we use Groq's LLM to generate agricultural advice based on the farm parameters and ML prediction.

### Groq
Groq is a cloud service that provides fast access to open-source LLMs via an API. We use the model `qwen/qwen3.8-27b` through Groq to generate farming recommendations. The API key is stored securely in the `.env` file.

### Weather Analysis
In this project, weather analysis means computing **statistics from the dataset** — like average yield per weather condition, rainfall distribution, and how rainfall/temperature correlate with yield (using Pearson correlation). It does NOT fetch live weather data.

### Soil Analysis
Soil analysis means computing **statistics from the dataset** — like average yield per soil type, how NPK levels correlate with yield, and how soil pH categories affect production. It uses the Pandas `groupby` and `corr` functions on the CSV data. It does NOT connect to any soil sensors or external databases.
