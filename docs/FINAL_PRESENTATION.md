# YieldSense AI — Final Project Presentation
## Milestone 4: Testing, Deployment & Documentation

> **Presentation Duration:** 5–7 minutes  
> **Project:** AI-Powered Crop Yield Prediction & Agricultural Productivity Intelligence Platform  
> **Team/Author:** [Your Name]  
> **Institution:** [Your College Name]

---

## Slide 1 — Title

**YieldSense AI**  
*Crop Yield Prediction & Agricultural Productivity Forecasting System*

- Full-stack AI-powered agricultural platform
- Machine Learning + Groq LLM + FastAPI + React
- Milestones 1–4 completed

---

## Slide 2 — Problem Statement

### The Problem

Agriculture is the backbone of the Indian economy, yet farmers face:

- **Unpredictable crop yields** due to weather, soil, and input variability
- **No data-driven decision tools** accessible at the field level
- **Post-harvest losses** caused by poor planning and resource misuse
- **Lack of AI-driven guidance** for fertilizer, irrigation, and risk management

**Key question:** *How can AI and data help farmers predict yield and make smarter decisions before planting?*

---

## Slide 3 — Objective

### Project Goals

1. Build an **ML-powered crop yield prediction** system (R² = 0.9772)
2. Provide **agricultural analytics** — weather, soil, productivity, risk
3. Enable **AI-generated farming insights** using Groq LLM
4. Create an **interactive AI agriculture chatbot**
5. Generate **downloadable PDF prediction reports**
6. Ensure **secure, deployable, tested** platform (Milestone 4)

---

## Slide 4 — System Architecture

```
Browser (React Frontend)
         │  JWT Bearer Token
         ▼
FastAPI Backend (Python)
    ├── Authentication (JWT + bcrypt)
    ├── ML Prediction (scikit-learn)
    ├── Agricultural Analytics
    ├── Groq AI Integration
    ├── PDF Report Generation (reportlab)
    └── SQLite Database (SQLAlchemy)
```

**Technology Stack:**

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, Axios, Recharts |
| Backend | FastAPI 0.111, Python 3.11, uvicorn |
| Database | SQLite + SQLAlchemy 2.0 |
| ML Model | scikit-learn, pandas, numpy, joblib |
| AI | Groq LLM API (llama3-8b-8192) |
| Reports | reportlab |
| Auth | JWT (python-jose) + bcrypt |
| Deploy | Docker + docker-compose |

---

## Slide 5 — Main Features

### Implemented Features (Milestones 1–4)

| # | Feature | Status |
|---|---|---|
| 1 | User registration & login (JWT) | ✅ Done |
| 2 | Crop yield prediction (ML) | ✅ Done |
| 3 | Weather analysis dashboard | ✅ Done |
| 4 | Soil nutrient analysis | ✅ Done |
| 5 | AI agricultural insights (Groq) | ✅ Done |
| 6 | Productivity analysis | ✅ Done |
| 7 | Crop recommendation (ML) | ✅ Done |
| 8 | Resource optimization | ✅ Done |
| 9 | Agricultural risk assessment | ✅ Done |
| 10 | Prediction history (per-user) | ✅ Done |
| 11 | PDF report generation | ✅ Done |
| 12 | Agriculture AI chatbot (Groq) | ✅ Done |
| 13 | Model validation & testing | ✅ Done |
| 14 | Docker containerization | ✅ Done |

---

## Slide 6 — Machine Learning Model

### Dataset

- **Source:** Agricultural crop yield dataset
- **Records:** 2,200 rows
- **Features:** Crop, Region, Weather Condition, Soil Type, Rainfall, Temperature, N/P/K, Soil pH, Fertilizer, Irrigation
- **Target:** Yield (kg per acre)
- **Split:** 80% training (1,760 rows) / 20% testing (440 rows)

### Training Pipeline

```
Raw CSV
  │
  ▼
Feature Engineering
  ├── OneHotEncoder (Crop, Region, Weather, Soil)
  └── StandardScaler (numerical features)
  │
  ▼
GridSearchCV (5-fold CV)
  ├── Linear Regression
  ├── Decision Tree
  ├── Random Forest
  ├── Gradient Boosting
  └── Extra Trees
  │
  ▼
Best Model → saved as best_model.pkl
```

---

## Slide 7 — Model Evaluation

### All Models Compared (GridSearchCV Results)

| Model | R² | MAE (kg/acre) | RMSE (kg/acre) | CV R² |
|---|---|---|---|---|
| **Linear Regression** ✅ | **0.9772** | **132.42** | **169.50** | **0.9807** |
| Gradient Boosting | 0.9753 | 139.93 | 176.58 | 0.9771 |
| Random Forest | 0.9576 | 187.61 | 231.35 | 0.9579 |
| Extra Trees | 0.9563 | 187.52 | 234.75 | 0.9545 |
| Decision Tree | 0.9349 | 229.15 | 286.61 | 0.9314 |

### Milestone 4 Final Validation (independent test set)

| Metric | Value |
|---|---|
| R² Score | **0.9772** |
| MAE | **132.42 kg/acre** |
| RMSE | **169.50 kg/acre** |
| CV R² (5-fold) | **0.9800 ± 0.0022** |
| Inference (single row) | **~6.6 ms** |

> **Interpretation:** The model explains 97.72% of variance in crop yield. Average prediction error is ±132 kg/acre, which is acceptable for agricultural planning purposes.

---

## Slide 8 — Agricultural Analytics

Six data-driven analytics modules powered by the crop dataset:

### 1. Weather Analysis (`/weather/analysis`)
- Rainfall vs. yield correlation
- Temperature vs. yield correlation
- Yield by weather condition
- Seasonal patterns

### 2. Soil Analysis (`/soil/analysis`)
- Best performing soil types
- NPK correlation with yield
- Soil pH impact

### 3. Productivity Analysis (`/productivity/analysis`)
- Crop-by-crop yield comparison
- Region-wise performance
- Input effectiveness (fertilizer, irrigation)

### 4. Crop Recommendation (`/recommendation/crop`)
- Top 3 crops for given conditions
- Suitability scoring
- Historical yield data backing

### 5. Resource Optimization (`/resources/optimize`)
- Optimal NPK ratios
- Fertilizer and irrigation recommendations
- Optimization score

### 6. Risk Assessment (`/risk/assess`)
- Weather risk
- Soil risk
- Input risk
- Overall risk level (Low/Medium/High)

---

## Slide 9 — AI Features

### AI Agricultural Insights (Groq LLM)
- **Endpoint:** `POST /ai-insights`
- **Model:** llama3-8b-8192 (via Groq Cloud)
- **Input:** Crop parameters + predicted yield
- **Output:** Actionable farming recommendations
- **Fallback:** Analytical fallback if key unavailable

### Agriculture AI Chatbot
- **Endpoint:** `POST /chatbot/ask`
- **Multi-turn:** Maintains last 10 messages
- **System prompt:** Agricultural expert context
- **Topics:** Crop cultivation, soil health, fertilizer, irrigation, pest control
- **Fallback:** Static helpful response if Groq unavailable

---

## Slide 10 — Prediction History & Reports

### Prediction History
- Every successful prediction auto-saved to SQLite
- User-specific — no cross-user data access
- Filterable, sortable history table
- Direct link to download any historical report

### PDF Reports
- **Live generation:** `POST /report/generate`
- **By ID:** `GET /report/{id}`
- **Contents:**
  - YieldSense AI branded header with green theme
  - All input parameters
  - Predicted yield in large typography
  - Confidence level
  - Input summary table
  - Generation timestamp

---

## Slide 11 — Testing (Milestone 4)

### Model Validation
- ✅ Independent test set validation (440 rows)
- ✅ 5-fold cross-validation
- ✅ Inference time measured (~6.6 ms/row)
- ✅ `final_validation.json` report generated

### API Testing (`test_m4_api.py`)
- ✅ 35+ automated API tests
- ✅ Health check
- ✅ Auth (register/login/invalid/unauthorized)
- ✅ Prediction (valid/invalid/unauthenticated)
- ✅ All 6 analysis endpoints
- ✅ AI features (insights + chatbot)
- ✅ Prediction history (save/retrieve/user isolation)
- ✅ PDF report (generate/download)
- ✅ Security validation

### Frontend Build
- ✅ Production build: `npm run build`
- ✅ 900 modules compiled — 0 errors

---

## Slide 12 — Docker Deployment

### Dockerization

```bash
# One command to run the entire platform:
docker compose up --build
```

**Services:**

| Service | Image | Port |
|---|---|---|
| backend | python:3.11-slim + FastAPI | 8000 |
| frontend | node:20 build → nginx:alpine | 3000 |

**Features:**
- ✅ SQLite persistence via named volume
- ✅ Backend health check before frontend starts
- ✅ All secrets via environment variables
- ✅ `VITE_API_URL` configurable at build time
- ✅ SPA routing via nginx
- ✅ Static asset caching

---

## Slide 13 — Performance

*All values measured during Milestone 4 test run on local machine.*

| Operation | Time |
|---|---|
| ML inference (single row) | ~6.6 ms |
| Batch inference (440 rows) | ~8.2 ms |
| `POST /predict` API | ~50–150 ms |
| `GET /weather/analysis` | ~200–500 ms |
| `GET /productivity/analysis` | ~200–500 ms |
| `POST /ai-insights` (Groq) | ~1,000–3,000 ms |
| `POST /chatbot/ask` (Groq) | ~1,000–3,000 ms |
| `POST /report/generate` (PDF) | ~200–600 ms |
| Frontend production bundle | 686 KB JS (195 KB gzip) |

> Groq API latency depends on external network conditions.

---

## Slide 14 — Security

| Aspect | Implementation |
|---|---|
| Password storage | bcrypt hash (never plain text) |
| Session management | Stateless JWT, 60-minute expiry |
| API key protection | Server-side only via `.env` |
| Git security | `.env` in `.gitignore` |
| User data isolation | All DB queries filter by `user_id` |
| Input validation | Pydantic v2 on all endpoints |
| CORS | Explicit allowed-origin list |
| Error responses | JSON errors — no stack traces to client |

---

## Slide 15 — Final Demo & Conclusion

### Live Demo Sequence
1. Login → Dashboard (analytics + model metrics)
2. Predict crop yield → View result + AI insights
3. Download PDF report
4. View prediction history
5. Ask agriculture chatbot
6. Show Productivity / Recommendation / Resources / Risk pages
7. Show Docker deployment

### Project Achievements
- ✅ Full-stack agricultural AI platform (14 features)
- ✅ ML model with R² = 0.9772 (97.72% accuracy)
- ✅ Groq LLM integration for AI insights and chatbot
- ✅ Complete test suite (35+ tests)
- ✅ Docker containerization
- ✅ Professional agricultural UI with real farm photography
- ✅ Secure, production-ready deployment

### Key Learning Outcomes
- End-to-end ML pipeline (training → deployment)
- RESTful API design with FastAPI
- React frontend with real-time API integration
- JWT authentication and security best practices
- Docker containerization
- Agricultural domain knowledge applied to AI

---

*YieldSense AI — Empowering farmers with data-driven intelligence*
