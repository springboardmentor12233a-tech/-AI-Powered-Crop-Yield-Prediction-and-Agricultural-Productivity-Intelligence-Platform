# Project Audit

## 1. Frontend
- **Framework:** React with Vite
- **Dependencies:** React, React-DOM, Recharts, React-Markdown, Axios, Lucide-React
- **Styling:** TailwindCSS (v4)
- **API URL Configuration:** Already uses `import.meta.env.VITE_API_URL` with a fallback to `https://data-practice.onrender.com/api` for production.

## 2. Backend
- **Framework:** FastAPI
- **Entry Point:** `app.py`
- **Server Command:** `uvicorn app:app --host 0.0.0.0 --port $PORT`
- **Endpoints:**
  - `GET /` (Health check)
  - `POST /api/auth/signup`
  - `POST /api/auth/login`
  - `GET /api/users`
  - `DELETE /api/users/{user_id}`
  - `PUT /api/users/{user_id}`
  - `POST /api/predict`
  - `GET /api/predictions`
  - `POST /api/queries`
  - `GET /api/queries`
  - `POST /api/queries/{query_id}/reply`
- **Database:** SQLite (`app.db`), local persistence.

## 3. Dataset & Model
- **Model format:** Scikit-Learn (Ridge), saved as `champion_agri_model.pkl` (690 KB).
- **Other artifacts:** `scaler.pkl`, `model_columns.pkl`.
- **Dataset:** `agri_yield_dataset.csv` (1.9 MB). 
- **Inference memory requirement:** Low.

## 4. External Integrations
- **Gemini API:** Used in `advisory_service.py` (`gemini-3.5-flash-lite` model using `google-genai` SDK).
- Expects `GEMINI_API_KEY` in environment variables.

## 5. Potential Issues & Constraints
- **SQLite Database:** Uses local `app.db`. On ephemeral free-tier hosting (like Render free web service), local files are lost on restart.
