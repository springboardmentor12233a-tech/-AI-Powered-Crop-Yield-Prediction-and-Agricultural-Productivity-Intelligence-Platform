# YieldSense AI

YieldSense AI is an agricultural decision-support platform that predicts crop yield and recommends suitable crops from soil, weather, and farm-management inputs. It combines a FastAPI backend, a React/Vite dashboard, scikit-learn pipelines, analytics, farmer accounts, reports, and an optional AI assistant.

## Problem and objectives

Farmers often need to combine weather, soil, management, and historical information before making planting decisions. YieldSense AI turns those inputs into an indicative yield estimate, ranked crop recommendations, risk and soil insights, and downloadable reports.

The project objectives are to:

- estimate `Yield_ton_per_ha` as a supervised regression task;
- recommend crops as a 70-class classification task;
- expose validated prediction and analytics APIs;
- provide a farmer-facing dashboard, accounts, history, and reports; and
- document a reproducible path from local development to cloud deployment.

## Features

- Crop-yield regression with categorical preprocessing and numerical scaling.
- Crop suitability ranking from temperature, humidity, pH, and rainfall.
- Weather profiles, soil-pH classification, risk assessment, and agronomic guidance.
- Farmer registration, login, farm profile, prediction history, and PDF reports.
- Admin endpoints for farmer management and optional LLM provider configuration.
- Rule-based assistant fallback when no external LLM is configured.

## Architecture and stack

```text
Browser
  └─ React 18 + TypeScript + Vite + Tailwind
       └─ HTTP/JSON (VITE_API_BASE_URL)
            └─ FastAPI + Uvicorn
                 ├─ scikit-learn model registry
                 ├─ analytics/report/PDF modules
                 └─ SQLite database (local deployment)
```

Python dependencies are listed in `requirements.txt`. Frontend dependencies are declared in `frontend/package.json` and locked in `frontend/package-lock.json`.

## Data and models

The checked-in processed datasets are:

- `data/processed/smart_crop_yield_cleaned.csv`: 10,000 rows; 12 input features and `Yield_ton_per_ha` as the continuous target.
- `data/processed/crop_recommendation_cleaned.csv`: 7,000 rows; four environmental inputs and 70 crop labels.

Recorded model metadata reports these holdout results:

| Task | Model | Reported result |
|---|---|---:|
| Yield regression | Linear Regression pipeline | R² 0.9821; MAE 4.0765 ton/ha; RMSE 5.0806 ton/ha |
| Crop recommendation | Random Forest classifier | Accuracy 0.9586; weighted precision 0.9593; weighted recall 0.9586; weighted F1 0.9573 |

These are supervised regression/classification results, not time-series forecasting. The datasets are project datasets and are not a substitute for local agronomic trials. Chemical-usage inputs may also represent a pre-season leakage risk if they are not known at prediction time.

## Repository layout

```text
src/api/                 FastAPI app and routers
src/ml/models/           Model loading and inference
src/ml/pipelines/        Reproducible training pipelines
src/analytics/           Insights, reports, risk, PDF, and LLM adapter
src/db/                  SQLite schema and persistence layer
data/processed/          Cleaned datasets used by analytics/training
models/                  Model metadata and runtime artifacts
frontend/src/            React dashboard and API client
tests/                   Backend verification suites
docs/                    Milestone and technical documentation
```

## Local setup

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Start the backend from the repository root:

```powershell
uvicorn src.api.main:app --host 0.0.0.0 --port 8000
```

Start the frontend in a second terminal:

```powershell
cd frontend
npm ci
npm run dev
```

The local API is normally available at `http://127.0.0.1:8000`; Swagger UI is at `/docs`. The Vite development server uses port 3000.

## Configuration

Copy `.env.example` to a local environment configuration and replace the placeholders; never commit the copy. The backend supports:

- `YIELDSENSE_ENV=development|production`
- `SECRET_KEY`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` (required in production)
- `CORS_ORIGINS` as a comma-separated list of allowed browser origins
- `PORT`, supplied by the hosting platform or defaulting to 8000 locally

The frontend reads `VITE_API_BASE_URL` at build time and falls back to `http://127.0.0.1:8000` for local development. Set it to the deployed backend URL for a hosted frontend. LLM provider keys are stored through the admin configuration workflow and must never be committed.


## Milestones

1. Dataset preparation and exploratory analysis.
2. Model training, analytics, API integration, and frontend workflows.
3. Accounts, admin controls, reports, risk assessment, and assistant fallback.
4. Final validation, deployment-readiness audit, and documentation.

## Author

Submitted by: **Maniraj Kyatham**
