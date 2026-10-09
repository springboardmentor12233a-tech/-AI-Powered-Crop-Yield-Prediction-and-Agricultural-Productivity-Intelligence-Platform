# 🤖 AGENT.md — YieldSense AI Agent Instructions

> This file provides context, conventions, and instructions for any AI agent (Antigravity, Copilot, Claude, etc.) working on the **YieldSense AI** codebase. Read this before making any changes.

---

## 🗺️ Repository at a Glance

```
YieldSense-AI/
├── backend/
│   ├── app.py                  # Flask REST API — all routes live here
│   └── report_generator.py     # PDF report builder (ReportLab)
├── frontend/
│   ├── index.html              # Main crop prediction dashboard (HTML + Vanilla JS)
│   ├── login.html              # Login / registration page
│   └── admin.html              # Admin analytics dashboard (Chart.js)
├── notebooks/EDA.ipynb         # Jupyter EDA notebook
├── dataset/                    # CSV datasets (git-ignored)
├── models/                     # Trained model files (.joblib, git-ignored)
│   ├── crop_yield_model.joblib # Trained Random Forest model (~268 MB)
│   ├── encoders.joblib         # Label encoders for crop / state / season
│   └── feature_cols.joblib     # Ordered list of feature column names
├── users.db                    # SQLite user database (git-ignored)
├── report/                     # Docs / slides
├── .env                        # Environment variables (never commit)
└── .gitignore
```

**Primary language:** Python 3.9+ (backend & ML), HTML/JS (frontend)  
**Framework:** Flask + flask-cors  
**Auth:** Flask sessions + SQLite (`users.db`) via `werkzeug.security`  
**ML libraries:** scikit-learn, pandas, numpy, joblib  
**External APIs:** Google Gemini (gemini-3.6-flash, fallback gemini-2.5-flash)  

---

## ⚙️ Environment Setup

```bash
# Activate virtual environment (Windows)
venv\Scripts\activate

# Core dependencies
pip install flask flask-cors pandas numpy scikit-learn matplotlib seaborn joblib \
            google-genai python-dotenv reportlab werkzeug
```

The virtual environment is in `venv/` (git-ignored). Do **not** modify or delete it.

### Environment Variables (`.env`)

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Google Gemini API key for `/api/recommend` and `/api/chat` |
| `FLASK_SECRET_KEY` | Flask session signing key — **must be changed before deployment** |

Never commit `.env` to version control.

---

## 🧠 Project Context

- **Domain:** AgriTech — Indian state-level crop yield prediction (1997–2020).
- **Problem type:** Supervised regression — predict yield (production/area) from features.
- **Key features:** crop type, state, season, cultivated area, fertilizer, pesticide, annual rainfall, temperature, humidity, soil N/P/K/pH.
- **Primary dataset:** `dataset/crop_yield.csv` (large file, git-ignored — do not commit it).
- **Authentication:** Cookie-based Flask sessions; roles are `farmer` and `admin`.

---

## 📋 Coding Conventions

### Python (Backend & Notebooks)

| Convention | Rule |
|------------|------|
| Style | PEP 8; 4-space indentation |
| Naming | `snake_case` for variables/functions, `PascalCase` for classes |
| Imports | Standard library → third-party → local (separated by blank line) |
| Docstrings | Use Google-style docstrings for all public functions |
| Type hints | Add type hints to all new function signatures |
| Error handling | Use try/except with meaningful messages; return JSON errors from Flask routes |

### Flask API

- All routes return `jsonify(...)`.
- CORS is scoped to `http://127.0.0.1:5500` and `http://localhost:5500` (VS Code Live Server origin) with `supports_credentials=True`.
- API routes are prefixed with `/api/`.
- Protected routes use the `@login_required()` decorator; pass `role="admin"` to restrict to admins.
- Prediction routes must validate inputs before calling the model.
- Use `app.run(debug=True)` only in development; production must set `debug=False`.

### HTML / JavaScript (Frontend)

- Vanilla JS only — no frameworks or bundlers.
- All interactive elements must have unique `id` attributes.
- Backend URL is `http://127.0.0.1:5000`; all `fetch()` calls include `credentials: 'include'` for session cookies.
- Use `async/await` with `try/catch` for all `fetch()` calls.
- Authentication state is checked on page load via `/api/me`; unauthenticated users are redirected to `login.html`.

---

## 🔒 What NOT to Change Without Review

1. **`.gitignore`** — Do not remove `dataset/`, `models/*.joblib`, `users.db`, or `venv/` exclusions.
2. **CORS configuration** in `backend/app.py` — Origins are intentionally restricted; any change must be documented in `DECISION.md`.
3. **Dataset files** — Never commit raw CSVs to the repository.
4. **Model binaries** — `.joblib` files are git-ignored; do not commit the 268 MB model file.
5. **`.env`** — Never commit API keys or secret keys.

---

## 🧪 Testing Guidance

- **Backend:** Use `curl` or a REST client to verify Flask routes.
  ```bash
  # Unauthenticated health check
  curl http://127.0.0.1:5000/
  curl http://127.0.0.1:5000/api/status

  # Register then login (session cookie required for protected routes)
  curl -c cookies.txt -X POST http://127.0.0.1:5000/api/login \
       -H "Content-Type: application/json" \
       -d '{"username":"test","password":"pass"}'
  ```
- **Frontend:** Open via VS Code Live Server (`http://127.0.0.1:5500/frontend/login.html`). Login → dashboard → predict → report.
- **Admin dashboard:** Log in with a user with `role=admin`, then open `admin.html`.
- **PDF report:** After a prediction, click "Download PDF Report" — should trigger a file download from `/api/report/pdf`.
- **Notebooks:** Re-run all cells from top to bottom; confirm no cells error out.

---

## 🚧 Current Development State

| Component | Status | Notes |
|-----------|--------|-------|
| Flask backend | ✅ Running | All routes live |
| Frontend UI (`index.html`) | ✅ Running | Full form, styled dashboard, PDF download, AI chat |
| Login / Registration (`login.html`) | ✅ Running | Cookie-based session auth, role selection |
| Admin Dashboard (`admin.html`) | ✅ Running | Chart.js charts, analytics from `/api/admin/analytics` |
| EDA Notebook | ✅ Complete | Feature engineering + merge with weather/soil done |
| ML Model | ✅ Complete | Random Forest selected (R²=0.975), saved via joblib |
| `/api/predict` | ✅ Complete | Auth-protected; returns predicted yield |
| `/api/report` | ✅ Complete | Weather + soil analytics + risk assessment per state |
| `/api/report/pdf` route | ✅ Complete | Generates a downloadable PDF report via reportlab (report_generator.py) |
| `/api/recommend` | ✅ Complete | Gemini-generated farmer recommendation (retry + fallback) |
| `/api/chat` route | ✅ Complete | Chatbot with retry + model fallback (gemini-3.6-flash → gemini-2.5-flash) for Gemini 503 errors |
| `/api/register` | ✅ Complete | User registration with hashed passwords |
| `/api/login` & `/api/logout` | ✅ Complete | Session-based login/logout |
| `/api/me` | ✅ Complete | Returns current session user info |
| `/api/admin/analytics` | ✅ Complete | Admin-only; dataset statistics for charts |
| Risk assessment | ✅ Complete | Rule-based rainfall/temperature/soil risk scoring in /api/report |
| Route-level authentication | ✅ Complete | /api/predict, /api/report, /api/report/pdf, /api/recommend, /api/chat all require login |
| Security hardening | ✅ Complete | Flask secret key moved to .env, users.db confirmed git-ignored |
| Deployment | ⬜ Not started | Docker / cloud hosting pending |
| Final report & documentation | ⬜ Not started | Pending |

---

## 🛠️ Notes for Agents

- **Auth flow:** `login.html` → POST `/api/login` → session cookie → all subsequent API calls use `credentials: 'include'`. Unauthenticated requests to protected routes return `401`.
- **Admin-only routes:** Decorated with `@login_required(role="admin")`; farmer sessions receive `403`.
- **Gemini retry logic:** `call_gemini_with_retry()` in `app.py` tries `gemini-3.6-flash` first, falls back to `gemini-2.5-flash`, with exponential back-off on 503 errors.
- **PDF generation:** `backend/report_generator.py` uses ReportLab to build a multi-section PDF; returns a `BytesIO` buffer consumed by `/api/report/pdf`.
- **Risk assessment:** `assess_risk()` compares input rainfall/temp against historical averages and checks soil N/P/K/pH thresholds, returning a severity level (`Low` / `Moderate` / `High`) with human-readable reasons.

---

## 🔑 External Services

| Service | Usage | Config |
|---------|-------|--------|
| Google Gemini (gemini-3.6-flash / gemini-2.5-flash) | `/api/recommend`, `/api/chat` | `GEMINI_API_KEY` in `.env` |

Google Gemini API (gemini-3.6-flash, falling back to gemini-2.5-flash on repeated 503 errors) is used in /api/recommend and /api/chat via the google-genai SDK. The API key and Flask secret key are both loaded from environment variables via python-dotenv; .env is git-ignored.

---

## 📎 Related Files

- [`PROJECT.md`](./PROJECT.md) — Full project overview & roadmap
- [`DECISION.md`](./DECISION.md) — Architecture & design decision log
