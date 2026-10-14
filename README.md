# Yield Prediction Application

## Overview
This is a comprehensive, production-ready full-stack application that provides machine-learning-based agricultural yield prediction along with AI-driven agronomic advisory using Gemini.

## Migration and Free Tier Deployment

The application has been audited and prepared for free-tier deployment on **Vercel** (Frontend) and **Render** (Backend).

### Local Setup

#### Backend
1. Ensure Python 3.10+ is installed.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy `.env.example` to `.env` and insert your Gemini API Key.
4. Run the backend server:
   ```bash
   uvicorn app:app --host 0.0.0.0 --port 8000
   ```

#### Frontend
1. Ensure Node.js 18+ is installed.
2. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy `frontend/.env.example` to `frontend/.env.local` for local development if needed, though Vite defaults to `http://localhost:8000/api` natively in dev mode.
5. Run the frontend:
   ```bash
   npm run dev
   ```

### Production Deployment Instructions

#### 1. Backend (Render Free Web Service)
- Create a new Web Service on Render and link to your GitHub repository.
- **Environment:** Python
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app:app --host 0.0.0.0 --port $PORT`
- **Environment Variables:**
  - `PYTHON_VERSION`: `3.14.7` (or preferred version)
  - `GEMINI_API_KEY`: Your secure Gemini API Key.
- *Note on Free Tier:* The instance will spin down after inactivity, causing a cold start on the next request. The SQLite DB (`app.db`) will be reset upon spin-down.

#### 2. Frontend (Vercel)
- Create a new project on Vercel and link your GitHub repository.
- Set the root directory to `frontend`.
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:**
  - `VITE_API_URL`: The URL of your deployed Render backend (e.g., `https://agri-backend-xxxx.onrender.com`).
- Deploy the frontend.

## Limitations & Free Tier Restrictions
- **Ephemeral Database:** Local SQLite databases are not persisted across instance restarts on Render's free tier. Past predictions and user queries will be reset periodically. For permanent storage, configure a hosted PostgreSQL database (like Neon or Supabase) and update the `app.py` SQLite references.
- **Cold Starts:** Expect 10-30 seconds of loading time for the first visit after a period of inactivity.
