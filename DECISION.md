# 📋 DECISION.md — YieldSense AI Architecture & Design Decision Log

> This document records key architectural, design, and technical decisions made throughout the project lifecycle. Each entry explains the **context**, **options considered**, **decision made**, and **rationale**. This log helps future contributors (human and AI) understand *why* the project is structured the way it is.

---

## Decision Log

---

### ADR-001: Framework Choice — Flask for the Backend API

- **Date:** 2026-09-07
- **Status:** ✅ Accepted

**Context:**  
We needed a Python web framework to expose ML model predictions over HTTP.

**Options Considered:**

| Option | Pros | Cons |
|--------|------|------|
| Flask | Lightweight, simple, widely used for ML APIs | No built-in ORM, async support limited |
| FastAPI | Async, auto-docs, type-safe | Steeper learning curve for beginners |
| Django REST Framework | Full-featured ORM, admin UI | Heavyweight for a simple prediction API |

**Decision:** Flask with `flask-cors`.

**Rationale:**  
Flask offers the simplest path to a working REST API for a student/portfolio project. The ML model serving use case does not require the full async/ORM capabilities of FastAPI or Django. Flask-CORS handles cross-origin requests from the frontend with minimal configuration.

---

### ADR-002: CORS — Enable Globally During Development

- **Date:** 2026-09-07
- **Status:** ✅ Accepted (Development Only)

**Context:**  
The frontend (`frontend/index.html`) is served from a different origin than the Flask backend (`http://127.0.0.1:5000`). The browser blocks cross-origin `fetch()` calls without CORS headers.

**Decision:** Apply `CORS(app)` globally in `backend/app.py`.

**Rationale:**  
Global CORS is acceptable for local development. Before any production deployment, CORS must be restricted to specific allowed origins (e.g., `CORS(app, origins=["https://yieldsense.example.com"])`). This will be revisited in ADR-XXX when deployment planning begins.

**Trade-offs:**  
- ✅ Zero friction during development
- ⚠️ Security risk if deployed to production without scoping origins

---

### ADR-003: Frontend — Vanilla HTML/JS (No Framework)

- **Date:** 2026-09-07
- **Status:** ✅ Accepted

**Context:**  
The project needed a lightweight UI to demonstrate the prediction API. Options ranged from single-file HTML to full SPA frameworks.

**Options Considered:**

| Option | Pros | Cons |
|--------|------|------|
| Vanilla HTML/JS | Zero dependencies, instant load | Limited interactivity at scale |
| React / Vue | Component model, reactive | Requires build toolchain, overkill for prototype |
| Streamlit | Python-native, rapid ML dashboards | Not a production-grade web UI |

**Decision:** Vanilla HTML + JavaScript in `frontend/index.html`.

**Rationale:**  
The current scope is a working demonstration, not a production application. A single-file HTML approach removes all build/dependency overhead and keeps the focus on the ML pipeline. If the UI grows in complexity, a migration to a framework like React or Vue can be revisited.

---

### ADR-004: Dataset Management — Git-Ignore Raw Data Files

- **Date:** 2026-09-07
- **Status:** ✅ Accepted

**Context:**  
The primary dataset `crop_yield.csv` is ~1.4 MB and auxiliary files add additional size. Committing large binary/CSV files to Git degrades repository performance and risks exposing sensitive data.

**Decision:** Exclude `dataset/` entirely from version control via `.gitignore`.

**Rationale:**  
- Git is not optimised for large data files.
- Datasets should be distributed via shared drives, DVC, or object storage (e.g., S3, Google Drive).
- Keeps the repository lean and clone times fast.

**Trade-offs:**  
- ⚠️ New contributors must obtain datasets separately (documented in [`PROJECT.md`](./PROJECT.md)).
- Future consideration: adopt [DVC](https://dvc.org/) for dataset versioning.

---

### ADR-005: ML Model Storage — Serialise to `models/` (Git-Ignored)

- **Date:** 2026-09-07
- **Status:** ✅ Accepted (Pending Implementation)

**Context:**  
Trained scikit-learn models need to be persisted and loaded by the Flask backend at prediction time.

**Decision:** Use `joblib.dump()` to save models as `.joblib` files in the `models/` directory. The directory exists in the repository but model binaries are excluded via `.gitignore` (`models/*.pkl`, `models/*.joblib`).

**Rationale:**  
- `joblib` is the recommended serialiser for numpy-heavy scikit-learn models.
- Keeping the directory tracked (but files git-ignored) makes the structure discoverable without bloating the repo.
- In production, models should be stored in a model registry or object storage (MLflow, S3, etc.).

---

### ADR-006: ML Algorithm Selection Strategy — Start Simple, Iterate

- **Date:** 2026-09-07
- **Status:** 🔄 Planned

**Context:**  
Multiple regression algorithms are candidates for crop yield prediction. The best choice depends on data characteristics (non-linearity, interactions, outliers).

**Planned Evaluation Order:**

| Phase | Algorithm | Rationale |
|-------|-----------|-----------|
| 1 | Linear Regression | Interpretable baseline; establishes minimum performance floor |
| 2 | Random Forest Regressor | Handles non-linearity, feature interactions, robust to outliers |
| 3 | XGBoost / LightGBM | State-of-the-art tabular regression; expected best performance |

**Decision:** Implement in order; compare using RMSE, MAE, and R² on a held-out test set. Choose the model with the best generalisation performance.

**Success Metrics:**
- R² ≥ 0.80 on the test set
- MAE within acceptable domain range (to be defined after EDA)

---

### ADR-007: Notebook-First EDA Workflow

- **Date:** 2026-09-07
- **Status:** ✅ Accepted

**Context:**  
Data exploration and feature engineering decisions need to be reproducible and documented.

**Decision:** All EDA work happens in `notebooks/EDA.ipynb`. Reusable preprocessing logic extracted from notebooks will be refactored into helper modules later.

**Rationale:**  
Jupyter notebooks allow narrative-style documentation alongside code, making findings auditable. Cell-by-cell execution supports rapid iteration. Once stable, preprocessing steps will be extracted to Python modules for use in the Flask backend.

---

### ADR-008: ML Model Selection — Random Forest for Yield Prediction

- **Date:** 2026-09-11
- **Status:** ✅ Accepted

**Context:**
Milestone 2 required training and evaluating multiple regression models for crop yield prediction, using crop_yield.csv merged with state-level weather and soil data.

**Options Considered:**

| Model | R² | MAE | RMSE |
|-------|-----|-----|------|
| Linear Regression | 0.000 | 150.10 | 895.12 |
| Random Forest | 0.975 | 8.98 | 140.31 |
| XGBoost | 0.932 | 14.89 | 233.69 |

**Decision:** Random Forest Regressor, trained on crop/state/season (label-encoded), area, fertilizer, pesticide, weather (temperature/rainfall/humidity), and soil (N/P/K/pH) features.

**Rationale:**
Linear Regression collapsed to R²=0.000 due to extreme outliers in the yield column across crop types (e.g. coconut yields measured in a different unit than most crops, producing values orders of magnitude larger than the median). Tree-based models are far more robust to this kind of outlier since they split on ranges rather than fitting a single linear surface. Random Forest outperformed XGBoost on this dataset and was selected as the production model, saved via joblib and served through a Flask /api/predict endpoint.

**Trade-offs:**
- ⚠️ The high R² warrants a caveat: fertilizer/pesticide usage likely scales with area in the source data, so part of the model's accuracy may reflect that relationship rather than purely agronomic signal. Worth revisiting with a feature-importance analysis in a later milestone.

---

### ADR-009: LLM Integration — Google Gemini for Farmer Recommendations

- **Date:** 2026-09-11
- **Status:** ✅ Accepted

**Context:**
Beyond the numeric yield prediction, the platform needed to generate a plain-language recommendation for farmers, combining the predicted yield with weather and soil context.

**Decision:** Integrated Google Gemini (gemini-3.6-flash) via the google-genai Python SDK. A new Flask route, /api/recommend, sends the prediction, weather comparison, and soil data as a prompt and returns Gemini's generated advisory text, displayed in the frontend alongside the numeric prediction.

**Rationale:**
Gemini was chosen for its free tier and simple SDK integration, fitting the project's timeline and budget. The recommendation is generated per-request rather than cached, since inputs (crop, state, season, soil/weather values) vary per farmer.

**Trade-offs:**
- ⚠️ Adds external API dependency and per-request latency (~2-3 seconds) to the prediction flow.
- ⚠️ API key is currently stored as a plaintext constant in app.py — should move to an environment variable before any deployment (see ADR-002's CORS note for a similar development-only convention that needs revisiting pre-production).

---

## Template for New Decisions

```
### ADR-XXX: [Short Title]

- **Date:** YYYY-MM-DD
- **Status:** 🔄 Proposed | ✅ Accepted | ❌ Rejected | 🗄️ Superseded by ADR-XXX

**Context:**
[What situation or requirement prompted this decision?]

**Options Considered:**
[Table or list of alternatives evaluated]

**Decision:**
[What was decided?]

**Rationale:**
[Why was this the best option?]

**Trade-offs:**
[Known downsides or risks]
```

---

## Status Key

| Symbol | Meaning |
|--------|---------|
| 🔄 Proposed | Under discussion, not yet implemented |
| ✅ Accepted | Implemented and in effect |
| ❌ Rejected | Considered but not adopted |
| 🗄️ Superseded | Replaced by a newer decision (see reference) |
