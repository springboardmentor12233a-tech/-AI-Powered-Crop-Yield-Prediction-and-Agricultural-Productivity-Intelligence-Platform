# YieldSense AI — Comprehensive Milestone 1 & Milestone 2 Completion Report

## Executive Summary

This report documents the successful completion of **Milestone 1 (Data Engineering, Dataset Preprocessing & EDA)** and **Milestone 2 (Machine Learning Model Development, Backend API Integration & Frontend Dashboard)** for the **YieldSense AI** platform. The system successfully integrates automated machine learning inference with a secure full-stack web application.

---

## Milestone 1: Data Engineering, Exploration & Preprocessing

### 1. Dataset Acquisition & Schema Profile

* **Source File**: `Crop_recommendation.csv`
* **Total Records**: 2,200 agricultural samples
* **Total Features**: 8 columns (7 numerical telemetry features and 1 categorical target class)
* **Data Integrity**: Verified 0 missing values and 0 duplicate records across the entire dataset.

### 2. Exploratory Data Analysis (EDA) Highlights

* **Class Balance**: Perfectly balanced target distribution comprising **22 unique crop types** (e.g., rice, maize, cotton, coffee, jute, apple, orange), with exactly 100 samples per class.
* **Soil Macronutrients (`N`, `P`, `K`)**:
* Nitrogen ($N$) ranges from **0.0 to 140.0** (mean: 50.55).
* Phosphorus ($P$) ranges from **5.0 to 145.0** (mean: 53.36).
* Potassium ($K$) ranges from **5.0 to 205.0** (mean: 48.15), displaying right-skewness for high-demand potassium crops like bananas and grapes.


* **Environmental & Climate Indicators**:
* Temperature ranges from **8.83°C to 43.68°C** (mean: 25.62°C).
* Humidity spans **14.26% to 99.98%** (mean: 71.48%).
* Rainfall spans **20.21 mm to 298.56 mm** (mean: 103.46 mm).


* **Soil Acidity (`ph`)**: Centered around neutral agronomic ranges, spanning **3.50 to 9.94** (mean: 6.47).

---

## Milestone 2: Machine Learning Model, Backend API & Frontend Integration

### 1. Machine Learning Inference Engine

* **Algorithm**: Scikit-Learn `RandomForestClassifier` configured with 100 estimators.
* **Training Pipeline**: Developed `train_model.py` to ingest the dataset, split training/testing matrices (80/20 ratio), execute model fitting, and evaluate classification performance.
* **Artifact Serialization**: Exported the trained model via **Joblib** to `backend/models/crop_recommendation_model.pkl`.

### 2. FastAPI Backend Architecture

* **Framework & Routing**: Built using **FastAPI** and served via **Uvicorn** on port `8000`, equipped with CORS middleware for seamless local integration.
* **Security & Authorization**: Implemented stateless token-based security via **PyJWT** (`OAuth2PasswordBearer`) and secure password hashing via **passlib** (`bcrypt`).
* **Production Endpoints**:
* `POST /register`: Handles new user profile onboarding and credential encryption.
* `POST /login`: Processes user authentication and returns a signed `Bearer` access token.
* `POST /predict`: Secure inference route that parses JSON payloads (`N`, `P`, `K`, `temperature`, `humidity`, `ph`, `rainfall`), executes model prediction, and outputs the optimal crop recommendation.



### 3. Next.js Frontend Dashboard & Client Portal

* **Framework & Styling**: Built using **Next.js** (React) and styled with **Tailwind CSS**.
* **User Interface Modules**:
* **Authentication Portal (`/login`)**: Secure client-side sign-in interface communicating via `application/x-www-form-urlencoded` forms.
* **Farmer Dashboard (`/`)**: Protected route checking local storage tokens, featuring real-time telemetry inputs for soil and weather conditions, and a glassmorphic response container displaying the AI-powered crop recommendation.



---

## Summary of Completed Technology Stack

| Development Tier | Technologies & Libraries Used | Status |
| --- | --- | --- |
| **Data & EDA** | Python, Pandas, NumPy, Seaborn, Matplotlib | ✅ Completed |
| **Machine Learning** | Scikit-Learn (Random Forest), Joblib | ✅ Completed |
| **Backend API** | FastAPI, Uvicorn, SQLAlchemy, PyJWT, Passlib | ✅ Completed |
| **Frontend UI** | Next.js, React, Tailwind CSS, Turbopack | ✅ Completed |
| **Database** | PostgreSQL (Neon DB), SQLAlchemy ORM | ✅ Completed |