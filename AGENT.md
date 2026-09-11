# 🤖 AGENT.md — YieldSense AI Agent Instructions

> This file provides context, conventions, and instructions for any AI agent (Antigravity, Copilot, Claude, etc.) working on the **YieldSense AI** codebase. Read this before making any changes.

---

## 🗺️ Repository at a Glance

```
YieldSense-AI/
├── backend/app.py             # Flask REST API (Python)
├── frontend/index.html        # Crop prediction web UI (HTML + Vanilla JS)
├── notebooks/EDA.ipynb        # Jupyter EDA notebook
├── dataset/                   # CSV datasets (git-ignored)
├── models/                    # Trained model files (.pkl / .joblib, git-ignored)
└── report/                    # Docs / slides
```

**Primary language:** Python 3.9+ (backend & ML), HTML/JS (frontend)  
**Framework:** Flask + flask-cors  
**ML libraries (planned):** scikit-learn, pandas, numpy, joblib  

---

## ⚙️ Environment Setup

```bash
# Activate virtual environment (Windows)
venv\Scripts\activate

# Core dependencies
pip install flask flask-cors pandas numpy scikit-learn matplotlib seaborn joblib
```

The virtual environment is in `venv/` (git-ignored). Do **not** modify or delete it.

---

## 🧠 Project Context

- **Domain:** AgriTech — Indian state-level crop yield prediction (1997–2020).
- **Problem type:** Supervised regression — predict yield (production/area) from features.
- **Key features:** crop type, state, district, season, cultivated area, annual rainfall, temperature, soil type.
- **Primary dataset:** `dataset/crop_yield.csv` (large file, git-ignored — do not attempt to commit it).

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
- CORS is enabled globally via `flask_cors.CORS(app)`.
- API routes are prefixed with `/api/`.
- Prediction routes must validate inputs before calling the model.
- Use `app.run(debug=True)` only in development; production must set `debug=False`.

### HTML / JavaScript (Frontend)

- Vanilla JS only — no frameworks or bundlers.
- All interactive elements must have unique `id` attributes.
- Backend URL is hard-coded to `http://127.0.0.1:5000` during development.
- Use `async/await` with `try/catch` for all `fetch()` calls.

---

## 🔒 What NOT to Change Without Review

1. **`.gitignore`** — Do not remove `dataset/`, `models/*.pkl`, or `venv/` exclusions.
2. **CORS configuration** in `backend/app.py` — Any tightening of CORS policy must be documented in `DECISION.md`.
3. **Dataset files** — Never commit raw CSVs to the repository.
4. **Model binaries** — `.pkl` and `.joblib` files are git-ignored; store them locally or in object storage.

---

## 🧪 Testing Guidance

- **Backend:** Manually `curl` or use a browser to verify Flask routes before and after changes.
  ```bash
  curl http://127.0.0.1:5000/
  curl http://127.0.0.1:5000/api/status
  ```
- **Frontend:** Open `frontend/index.html` in a browser; ensure the "Predict Yield" button calls the backend and displays a result or error gracefully.
- **Notebooks:** Re-run all cells from top to bottom; confirm no cells error out.

---

## 🚧 Current Development State

| Component | Status | Notes |
|-----------|--------|-------|
| Flask backend | ✅ Running | Predict, report, and recommend routes live |
| Frontend UI | ✅ Running | Full form with all crops/states, styled dashboard |
| EDA Notebook | ✅ Complete | Feature engineering + merge with weather/soil done |
| ML Model | ✅ Complete | Random Forest selected (R²=0.975), saved via joblib |
| `/api/predict` route | ✅ Complete | Returns predicted yield from trained model |
| Model serialisation | ✅ Complete | crop_yield_model.joblib, encoders.joblib, feature_cols.joblib in models/ |
| `/api/report` route | ✅ Complete | Weather + soil analytics per state |
| `/api/recommend` route | ✅ Complete | Gemini-generated farmer recommendation |

---

## 🛠️ Recommended Next Steps for Agents

1. **Data cleaning:** Load `dataset/crop_yield.csv` in `notebooks/EDA.ipynb`, handle missing values, and engineer features (e.g., yield = production / area).
2. **Model training:** Train a baseline regression model (LinearRegression → RandomForest → XGBoost). Save with `joblib.dump(model, '../models/crop_yield_model.joblib')`.
3. **Prediction endpoint:** In `backend/app.py`, add a `POST /api/predict` route that loads the model and returns a yield estimate.
4. **Frontend integration:** Wire the "Predict Yield" button to call `/api/predict` with crop, area, and state inputs.
5. **Styling:** Enhance `frontend/index.html` with CSS for a polished UI.

---

## 🔑 External Services

Google Gemini API (gemini-3.6-flash) is used in `/api/recommend` via the `google-genai` SDK. The API key is currently a plaintext constant in `backend/app.py` — move to an environment variable before any deployment.

---

## 📎 Related Files

- [`PROJECT.md`](./PROJECT.md) — Full project overview & roadmap
- [`DECISION.md`](./DECISION.md) — Architecture & design decision log
