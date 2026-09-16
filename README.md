# YieldSense AI — AI-Based Crop Yield Prediction & Agricultural Recommendation Platform

> **Milestone 2 Platform Release** — An intuitive, farmer-facing decision-support application combining machine learning crop yield forecasting, environmental suitability matching, weather & soil analytics, farmer account management, and automated A4 PDF report generation.

---

## 🌾 Overview & Purpose

**YieldSense AI** is designed to provide practical, accessible agricultural intelligence to farmers, agronomists, and agricultural extension workers. The platform eliminates technical ML complexity, presenting simple, actionable insights:

1. **Crop Yield Forecasting**: Estimates expected crop harvest (`ton/ha`) using machine learning regression models evaluated across soil parameters, regional micro-climates, and farm management practices.
2. **Crop Suitability Analysis**: Recommends the optimal crop varieties matching local ambient temperature, relative humidity, soil pH, and precipitation.
3. **Farmer Accounts & Farm Persistence**: Supports farmer registration, secure authentication, profile management, and persistent farm specifications (supporting land sizes in **Acres** and **Hectares**).
4. **Exportable PDF Reports**: Generates downloadable, print-ready A4 PDF reports (`YieldSense_AI_Crop_Yield_Report_<report_id>.pdf`) with user data isolation.

---

## 🏗️ System Architecture

```
YieldSense AI
├── Backend (FastAPI + Python 3.10+)
│   ├── src/api/main.py             # FastAPI entrypoint & router mounts
│   ├── src/api/routers/            # Endpoints (auth, farmer, predictions, recommendations, analytics, reports)
│   ├── src/db/database.py          # SQLite database & thread-safe data access layer
│   ├── src/ml/pipelines/           # GridSearchCV ML model training pipelines
│   ├── src/ml/models/registry.py   # In-memory model artifact loader & inference engine
│   └── src/analytics/              # Agro-meteorological & soil analytics modules
│
├── Frontend (React 18 + Vite + TypeScript + Tailwind CSS)
│   ├── frontend/src/App.tsx        # Main application layout & state-based navigation
│   ├── frontend/src/components/   # Farmer-facing UI components (Dashboard, Forms, Reports, Auth)
│   └── frontend/src/services/api.ts# REST API client with bearer token authentication
│
├── Machine Learning Artifacts & Models
│   ├── models/yield_model.joblib
│   ├── models/crop_recommendation_model.joblib
│   └── models/yield_model_metadata.json
```

---

## ⚙️ Prerequisites

Before setting up YieldSense AI on any operating system (Windows, macOS, Linux), ensure you have installed:

- **Python**: `3.10` or higher (`python --version`)
- **Node.js**: `18.0` or higher (`node --version`)
- **npm**: `9.0` or higher (`npm --version`)
- **Git**: (`git --version`)

---

## 🚀 Step-by-Step Installation & Running Guide

Follow these simple instructions to set up and run the application on any device.

### 1. Clone the Repository
```bash
git clone https://github.com/your-repo/AI-Powered-Crop-Yield-Prediction-and-Agricultural-Productivity-Intelligence-Platform.git
cd AI-Powered-Crop-Yield-Prediction-and-Agricultural-Productivity-Intelligence-Platform
```

---

### 2. Backend Setup & Virtual Environment (`venv`)

#### Step 2.1: Create Python Virtual Environment
**On Windows (PowerShell / Command Prompt):**
```powershell
python -m venv .venv
.venv\Scripts\activate
```

**On macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

#### Step 2.2: Upgrade `pip` & Install Dependencies
```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

`requirements.txt` pins the ML runtime used to generate the checked-in model artifact. Install it before starting the API so scikit-learn model serialization remains compatible.

#### Step 2.3: Train Machine Learning Models (Optional - Pre-trained Models Included)
To retrain the ML pipelines using `GridSearchCV`:
```bash
# Train Yield Regressor
python src/ml/pipelines/train_yield_model.py

# Train Crop Classifier
python src/ml/pipelines/train_crop_recommendation.py
```

If an older checkout reports an error mentioning `sklearn` or `_RemainderColsList` when making a prediction, recreate the yield artifact once with the first command above. The pipeline now defaults to single-process training for reliable Windows execution; set `YIELDSENSE_TRAINING_N_JOBS` to a positive value if you explicitly want parallel retraining on a local machine.

#### Step 2.4: Start the Backend FastAPI Server
```bash
uvicorn src.api.main:app --reload --host 127.0.0.1 --port 8000
```
- API Server will run at: `http://127.0.0.1:8000`
- Interactive API Documentation (Swagger): `http://127.0.0.1:8000/docs`

---

### 3. Frontend Setup & Startup

Open a **second terminal window** and navigate to the `frontend/` directory:

```bash
cd frontend
```

#### Step 3.1: Install Node Dependencies
```bash
npm install
```

#### Step 3.2: Configure Environment Variables (Optional)
By default, the frontend connects to `http://127.0.0.1:8000`. To customize the backend URL, create `.env.local` inside `frontend/`:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

#### Step 3.3: Start the Vite Development Server
```bash
npm run dev
```
- Frontend application will run at: `http://localhost:3000`

---

## 🧪 Running Automated Tests

To verify backend endpoints, database persistence, and ML model inference:

```bash
python -m pytest tests/test_milestone2.py -v
```

To verify frontend TypeScript type safety and build:

```bash
cd frontend
npm run lint
npm run build
```

---

## 📊 Machine Learning Model Evaluation

YieldSense AI employs conventional, well-established scikit-learn algorithms tuned via `GridSearchCV` on the 80% training split:

### 1. Crop Yield Forecasting (Regression)
- **Algorithms Evaluated**: Linear Regression (Baseline), Decision Tree Regressor, Random Forest Regressor, Gradient Boosting Regressor.
- **Cross-Validation**: 5-Fold Cross-Validation on training split.
- **Evaluation Metrics**: $R^2$, $RMSE$ (ton/ha), $MAE$ (ton/ha).
- **Winning Production Model**: Selected dynamically based on lowest test $RMSE$ and highest test $R^2$.

### 2. Crop Suitability Analysis (Classification)
- **Algorithms Evaluated**: Logistic Regression, Decision Tree Classifier, Random Forest Classifier, Gradient Boosting Classifier.
- **Cross-Validation**: 5-Fold Stratified K-Fold.
- **Evaluation Metrics**: Accuracy, Precision, Recall, Weighted $F1$-score.

---

## 📡 Key API Endpoint Summary

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---:|
| `POST` | `/api/auth/register` | Register a new farmer account | No |
| `POST` | `/api/auth/login` | Sign in with email & password | No |
| `GET` | `/api/farmer/profile` | Get current farmer details | Yes |
| `PUT` | `/api/farmer/farm` | Update farm size (Acres/Ha), soil, irrigation | Yes |
| `POST` | `/api/predict/yield` | Run live crop yield prediction | Optional |
| `POST` | `/api/predict/recommendation` | Analyze crop environmental suitability | No |
| `GET` | `/api/reports/history` | Get farmer's saved report history | Yes |
| `GET` | `/api/reports/pdf/{report_id}` | Download real printable A4 PDF document | Yes |

---

## 📄 License & Documentation

YieldSense AI — Agricultural Decision Support System. Developed for Milestone 2 agricultural intelligence deliverables.
