# YieldSense AI — System Architecture

## Overview

YieldSense AI is a full-stack agricultural intelligence platform combining a React frontend, FastAPI backend, SQLite database, scikit-learn ML model, and Groq LLM integration.

---

## High-Level Architecture

```mermaid
flowchart TD
    User["👤 User (Browser)"]
    FE["⚛️ React Frontend\nVite + Axios\n:3000 / :5173"]
    BE["🐍 FastAPI Backend\nPython 3.11 + uvicorn\n:8000"]
    AUTH["🔐 Authentication\nJWT + bcrypt\n/auth/*"]
    ML["🤖 ML Prediction\nLinear Regression\nR² = 0.9772"]
    DB["🗄️ SQLite Database\nUsers + History"]
    AGRI["📊 Agricultural Analytics\nWeather, Soil, Productivity\nRecommendation, Resources, Risk"]
    GROQ["🧠 Groq LLM API\nAI Insights + Chatbot"]
    PDF["📄 PDF Report\nreportlab"]
    HIST["📋 Prediction History\nPer-user isolation"]

    User --> FE
    FE -->|"JWT Bearer token\nHTTP/JSON"| BE
    BE --> AUTH
    BE --> ML
    BE --> DB
    BE --> AGRI
    BE --> GROQ
    ML --> PDF
    ML --> HIST
    HIST --> DB
    AUTH --> DB
```

---

## Component Details

### Frontend — React (Vite)

| Item | Detail |
|---|---|
| Framework | React 18 + Vite 5 |
| HTTP Client | Axios with JWT interceptor |
| API Base | `import.meta.env.VITE_API_URL` (configurable) |
| Routing | React Router v6 |
| Charts | Recharts |
| Auth | JWT stored in localStorage |

**Pages:**
- `LoginPage`, `RegisterPage` — authentication
- `DashboardPage` — analytics overview, model comparison
- `PredictPage` — crop yield prediction form + AI insights
- `HistoryPage` — prediction history table
- `ChatbotPage` — Agriculture AI Assistant (Groq)
- `ProductivityPage` — condition-based yield analysis
- `RecommendationPage` — ML-based crop recommendation
- `ResourcesPage` — NPK and irrigation optimization
- `RiskPage` — agricultural risk assessment

---

### Backend — FastAPI

| Item | Detail |
|---|---|
| Framework | FastAPI 0.111 |
| Server | uvicorn (ASGI) |
| Auth | JWT (python-jose) + bcrypt password hashing |
| ORM | SQLAlchemy 2.0 |
| Validation | Pydantic v2 |
| Config | pydantic-settings + `.env` |

**API Routes:**

| Router | Prefix | Description |
|---|---|---|
| auth | `/auth` | Register, Login, /me |
| predict | `/predict` | Crop yield prediction |
| insights | `/ai-insights` | Groq AI farming insights |
| weather | `/weather` | Weather-yield correlations |
| soil | `/soil` | Soil nutrient analysis |
| productivity | `/productivity` | Crop productivity analytics |
| recommendation | `/recommendation` | ML crop recommendation |
| resources | `/resources` | Resource optimization |
| risk | `/risk` | Agricultural risk assessment |
| history | `/history` | Prediction history CRUD |
| report | `/report` | PDF report generation |
| chatbot | `/chatbot` | Agriculture AI chatbot |

---

### Machine Learning — scikit-learn

| Item | Detail |
|---|---|
| Best Model | Linear Regression (`fit_intercept=False`) |
| R² Score | 0.9772 |
| MAE | 132.42 kg/acre |
| RMSE | 169.50 kg/acre |
| CV R² | 0.9800 ± 0.0022 |
| Dataset | 2,200 records, 80/20 split |
| Preprocessing | scikit-learn Pipeline (OHE + StandardScaler) |
| Selection | GridSearchCV across 5 models |

**Models compared:**

| Model | R² | MAE | RMSE |
|---|---|---|---|
| **Linear Regression** ✅ | **0.9772** | **132.42** | **169.50** |
| Gradient Boosting | 0.9753 | 139.93 | 176.58 |
| Random Forest | 0.9576 | 187.61 | 231.35 |
| Extra Trees | 0.9563 | 187.52 | 234.75 |
| Decision Tree | 0.9349 | 229.15 | 286.61 |

---

### Database — SQLite

**Tables:**

```
users
  id, username, email, full_name, hashed_password,
  role, farm_name, farm_location, is_active, created_at

prediction_history
  id, user_id, created_at,
  crop, region, rainfall_mm, temperature_c, weather_condition,
  soil_type, soil_ph, nitrogen, phosphorus, potassium,
  fertilizer_used, irrigation_used,
  predicted_yield_kg_per_acre, model_used, prediction_confidence
```

---

### AI Integration — Groq LLM

- **AI Insights** (`POST /ai-insights`): Sends crop parameters + predicted yield to Groq. Returns actionable farming recommendations. Gracefully falls back if key is missing.
- **Chatbot** (`POST /chatbot/ask`): Multi-turn agricultural Q&A. Maintains conversation history (last 10 messages). Falls back to a helpful static response if Groq is unavailable.

---

## Data Flow Diagrams

### Prediction Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as React Frontend
    participant BE as FastAPI Backend
    participant ML as ML Model
    participant DB as SQLite DB

    U->>FE: Fill prediction form
    FE->>BE: POST /predict (JWT)
    BE->>BE: Validate JWT token
    BE->>ML: predict_yield(input_data)
    ML->>ML: Preprocess + infer
    ML-->>BE: {yield, model, confidence}
    BE-->>FE: JSON response
    FE->>BE: POST /history/save
    BE->>DB: INSERT prediction_history
    FE->>U: Show result + save confirmation
```

### AI Insight Flow

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as FastAPI
    participant GROQ as Groq API

    FE->>BE: POST /ai-insights (crop data + yield)
    BE->>GROQ: Chat completion request
    GROQ-->>BE: AI-generated farming advice
    BE-->>FE: {insights, provider}
    Note over BE: If Groq unavailable: returns rule-based fallback
```

### PDF Report Flow

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as FastAPI
    participant DB as SQLite

    FE->>BE: GET /report/{id}
    BE->>DB: Fetch prediction by ID
    DB-->>BE: Prediction data
    BE->>BE: reportlab → generate PDF bytes
    BE-->>FE: application/pdf (binary)
    FE->>U: Browser download dialog
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as FastAPI
    participant DB as SQLite

    U->>FE: Enter username + password
    FE->>BE: POST /auth/login
    BE->>DB: Query user by username
    DB-->>BE: User record (hashed_password)
    BE->>BE: bcrypt.verify(plain, hashed)
    BE->>BE: jwt.encode({sub: username, exp})
    BE-->>FE: {access_token, user}
    FE->>FE: localStorage.setItem('ys_token')
    Note over FE,BE: All subsequent requests include<br/>Authorization: Bearer <token>
```

---

## Docker Architecture

```mermaid
flowchart LR
    subgraph Docker["Docker Compose Network: yieldsense_net"]
        FE_C["frontend container\nnginx:1.25-alpine\nport 3000→80"]
        BE_C["backend container\npython:3.11-slim\nport 8000→8000"]
        VOL["yieldsense_db volume\nSQLite persistence"]
        DATA["./data (bind mount)\ncrop_yield.csv read-only"]
    end
    Browser["🌐 Browser"] --> FE_C
    FE_C -->|"HTTP API calls\nVITE_API_URL"| BE_C
    BE_C --> VOL
    BE_C --> DATA
    BE_C -->|"GROQ_API_KEY\n(env var)"| GROQ_EXT["☁️ Groq Cloud API"]
```

---

## Security Design

| Concern | Implementation |
|---|---|
| Passwords | bcrypt hash (never stored plain) |
| Sessions | Stateless JWT (HS256, 60 min expiry) |
| Secrets | `.env` file (gitignored) — never hardcoded |
| API keys | Server-side only (`GROQ_API_KEY`) |
| User isolation | All history queries filter by `user_id` |
| Input validation | Pydantic v2 schemas on all endpoints |
| CORS | Explicit allowed origins list |
