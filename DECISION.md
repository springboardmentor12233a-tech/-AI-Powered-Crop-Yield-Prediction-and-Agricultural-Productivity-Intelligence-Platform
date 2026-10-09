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
- **Status:** ✅ Accepted (see ADR-008 for outcome)

**Context:**  
Multiple regression algorithms are candidates for crop yield prediction. The best choice depends on data characteristics (non-linearity, interactions, outliers).

**Planned Evaluation Order:**

| Phase | Algorithm | Rationale |
|-------|-----------|-----------|
| 1 | Linear Regression | Interpretable baseline; establishes minimum performance floor |
| 2 | Random Forest Regressor | Handles non-linearity, feature interactions, robust to outliers |
| 3 | XGBoost / LightGBM | State-of-the-art tabular regression; expected best performance |

**Decision:** Implement in order; compare using RMSE, MAE, and R² on a held-out test set. Choose the model with the best generalisation performance.

**Outcome:** All three phases were executed. Random Forest was selected (R²=0.975). See ADR-008.

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

---

### ADR-010: API Key Management — Move to Environment Variable

- **Date:** 2026-10-07
- **Status:** ✅ Accepted

**Context:**
The Gemini API key was initially stored as a plaintext constant in `backend/app.py`. This was flagged as a security risk in ADR-009's trade-offs.

**Decision:** Load the Gemini API key (and Flask secret key) from a `.env` file via `python-dotenv`. The `.env` file is git-ignored.

**Rationale:**
- Eliminates the risk of accidentally committing secrets to version control.
- Follows the 12-factor app methodology for configuration.
- `load_dotenv()` at startup with `os.environ.get()` is the standard Python pattern.

**Trade-offs:**
- ⚠️ New contributors must create their own `.env` file (documented in `AGENT.md`).

---

### ADR-011: CORS — Restrict to Live Server Origin

- **Date:** 2026-10-07
- **Status:** ✅ Accepted (supersedes ADR-002 development behaviour)

**Context:**
ADR-002 accepted globally open CORS for development. With the addition of session-based authentication, open CORS is incompatible with `credentials: 'include'` — browsers require an explicit origin allowlist when cookies are involved.

**Decision:** Replace `CORS(app)` with `CORS(app, supports_credentials=True, origins=["http://127.0.0.1:5500", "http://localhost:5500"])`. These are the origins used by VS Code Live Server.

**Rationale:**
- `supports_credentials=True` is required to allow cookies in cross-origin `fetch()` calls.
- A wildcard (`*`) origin cannot be used with `supports_credentials=True` (browser security constraint).
- Locking to Live Server origins is a pragmatic development-time restriction that will be replaced with the production domain before deployment.

**Trade-offs:**
- ⚠️ Frontend must be served via Live Server (or another server on port 5500) — opening `index.html` directly as a `file://` URL will break CORS.
- Before production deployment, update the origin list to the actual hosted domain.

---

### ADR-012: Authentication — Flask Sessions + SQLite with Role-Based Access

- **Date:** 2026-10-07
- **Status:** ✅ Accepted

**Context:**
The platform needed to distinguish between farmer users (who can predict and get recommendations) and admin users (who can view dataset analytics). This required a lightweight authentication system.

**Options Considered:**

| Option | Pros | Cons |
|--------|------|------|
| Flask sessions + SQLite | Simple, no external service, built-in to Flask | Not horizontally scalable without sticky sessions |
| JWT tokens | Stateless, scalable | Adds complexity; requires token refresh strategy |
| OAuth (Google/GitHub) | Delegates auth to trusted provider | Overkill for a portfolio/student project |

**Decision:** Cookie-based Flask sessions backed by a SQLite `users.db` table. Passwords are hashed via `werkzeug.security.generate_password_hash`. Roles (`farmer`, `admin`) are stored in the `users` table and enforced by a `@login_required(role=...)` decorator.

**Rationale:**
Flask's built-in session mechanism is the simplest path to authenticated routes for a student project. SQLite requires no additional infrastructure. The `@login_required` decorator cleanly separates auth logic from business logic.

**Trade-offs:**
- ⚠️ Sessions are server-side in-memory (not persisted across restarts unless a persistent session store is configured).
- ⚠️ `FLASK_SECRET_KEY` must be a strong random value in production; the default fallback in `app.py` is for development only.

---

### ADR-013: Admin Analytics Endpoint

- **Date:** 2026-10-07
- **Status:** ✅ Accepted

**Context:**
Admin users needed visibility into dataset statistics (crop distribution, yearly yield trends, state coverage, season breakdown) without exposing raw data.

**Decision:** Added `GET /api/admin/analytics` route protected by `@login_required(role="admin")`. The route reads `crop_yield.csv` (already loaded at startup into `crop_df`) and returns aggregated statistics as JSON consumed by Chart.js in `admin.html`.

**Rationale:**
- Aggregating on the server avoids sending large CSV data to the browser.
- Filtering extreme outlier-scale crops (yield > 100) before returning top crops improves chart readability.
- Reusing the already-loaded `crop_df` dataframe is efficient (no repeated disk reads).

**Trade-offs:**
- ⚠️ `crop_df` is loaded globally at startup; a large dataset increases initial startup time slightly.

---

### ADR-014: PDF Report Generation — ReportLab

- **Date:** 2026-10-07
- **Status:** ✅ Accepted

**Context:**
Farmers requested a downloadable summary of their prediction session (predicted yield, weather context, soil data, risk assessment, and Gemini recommendation) for offline use.

**Options Considered:**

| Option | Pros | Cons |
|--------|------|------|
| ReportLab | Pure Python, no external process, fine-grained control | Verbose API |
| WeasyPrint (HTML→PDF) | CSS-driven layout | Requires system-level dependencies (GTK, Pango) |
| Jinja2 + pdfkit (wkhtmltopdf) | Familiar HTML templating | Requires wkhtmltopdf binary |

**Decision:** Use ReportLab in `backend/report_generator.py`. The function `create_pdf_report(data)` accepts the full prediction + report JSON and returns a `BytesIO` buffer streamed to the client via Flask's `send_file()`.

**Rationale:**
ReportLab is a pure Python solution with no system dependencies, making it portable across environments. The `BytesIO` approach avoids writing temp files to disk.

**Trade-offs:**
- ⚠️ ReportLab's programmatic API is verbose; layout changes require code edits rather than CSS tweaks.

---

### ADR-015: Conversational AI Chat — Gemini Multi-Turn Assistant

- **Date:** 2026-10-07
- **Status:** ✅ Accepted

**Context:**
Beyond one-shot recommendations, farmers benefit from an interactive assistant to ask follow-up questions about their crops, weather, or platform usage.

**Decision:** Added `POST /api/chat` route. The frontend sends a `message` and a rolling `history` array (last 10 turns). The backend prepends a system context prompt and calls `call_gemini_with_retry()` with the full conversation contents list, returning the model reply.

**Rationale:**
- Reusing the existing `call_gemini_with_retry()` wrapper gives the chat route the same retry/fallback resilience as `/api/recommend`.
- Capping conversation history at 10 turns prevents unbounded token growth.
- A system context prompt scopes the assistant to farming and platform-usage questions.

**Trade-offs:**
- ⚠️ Each chat message makes a live Gemini API call; no response caching.
- ⚠️ Conversation history is maintained client-side; clearing the page clears history.

---

### ADR-010: Risk Assessment — Rule-Based Scoring

- **Date:** 2026-10-07
- **Status:** ✅ Accepted

**Context:**
Milestone 4 required a risk-assessment feature to accompany the yield prediction, identifying conditions that could threaten crop outcomes.

**Decision:** Implemented a rule-based risk scorer (assess_risk() in app.py) rather than a separate ML model. It checks rainfall deficit/surplus against the state's historical average, temperature deviation, and soil nutrient (N/P/K) and pH thresholds, producing a Low/Moderate/High level with specific reasons.

**Rationale:**
A rule-based approach is transparent, fast to implement, and easy to explain and justify in a report, compared to training a separate classifier with limited labelled risk data. It reuses data already available from /api/report (historical weather, soil info), so no new data pipeline was required.

**Trade-offs:**
- ⚠️ Thresholds (e.g. 25% rainfall deficit, N < 40) are heuristic rather than agronomically validated; a future iteration could calibrate these against domain expertise or outcome data.

---

### ADR-011: PDF Report Generation — ReportLab

- **Date:** 2026-10-07
- **Status:** ✅ Accepted

**Context:**
Milestone 4 asked for a complete, downloadable report covering the prediction, inputs, weather analysis, soil analysis, risk assessment, and AI recommendation, rather than only an on-screen dashboard view.

**Decision:** Implemented server-side PDF generation using the reportlab library (report_generator.py), exposed via a new POST /api/report/pdf endpoint. The frontend requests this endpoint with the full result data and triggers a browser download of the returned PDF via a Blob URL.

**Rationale:**
reportlab is a mature, well-documented Python PDF library that runs entirely server-side, avoiding any client-side PDF-rendering dependencies or print-to-PDF browser quirks. Generating the PDF from the same structured data already shown on the dashboard keeps the two views consistent.

**Trade-offs:**
- ⚠️ The PDF layout is maintained separately from the HTML dashboard layout, so a future UI change needs to be mirrored in report_generator.py by hand.

---

### ADR-012: Chatbot — Gemini with Retry and Model Fallback

- **Date:** 2026-10-07
- **Status:** ✅ Accepted

**Context:**
The mentor requested a chatbot feature for general farming Q&A and platform help. During testing, the Gemini API returned repeated 503 "model overloaded" errors on gemini-3.6-flash, a known, widely-reported issue affecting multiple Gemini model versions at the time of testing (October 2026), unrelated to this project's code or API key.

**Decision:** Added a new POST /api/chat endpoint and a floating chat widget on the farmer dashboard, reusing the existing Gemini client. Wrapped all Gemini calls (chat and recommend) in a shared call_gemini_with_retry() helper that retries briefly on 503 errors and falls back to gemini-2.5-flash if gemini-3.6-flash remains unavailable.

**Rationale:**
Retry-with-fallback is the standard mitigation recommended by Google's own API documentation and developer community for transient model-overload errors. Sharing one helper between /api/chat and /api/recommend avoids duplicating retry logic.

**Trade-offs:**
- ⚠️ Adds up to a few seconds of extra latency on worst-case requests (multiple retries before falling back).
- ⚠️ Model behaviour/quality may differ slightly between gemini-3.6-flash and the gemini-2.5-flash fallback.

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
