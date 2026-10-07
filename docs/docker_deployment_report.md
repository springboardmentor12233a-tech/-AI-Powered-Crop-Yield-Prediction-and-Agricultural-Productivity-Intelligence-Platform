# Docker Deployment Report

## 1. Docker Architecture
The system is dockerized using `docker-compose` to orchestrate three distinct services:
- **db**: PostgreSQL database configured with persistence via a named volume (`postgres_data`).
- **backend**: FastAPI service packaging the trained Random Forest model and providing the inference API.
- **frontend**: React Single Page Application (SPA) built dynamically with Vite and served statically through Nginx.

## 2. Containers
- `yieldsense-db`
- `yieldsense-backend`
- `yieldsense-frontend`

## 3. Images
- **PostgreSQL**: `postgres:15-alpine`
- **Backend**: Custom image based on `python:3.12-slim`
- **Frontend**: Custom multi-stage image (`node:20-alpine` for build, `nginx:alpine` for serving).

## 4. Ports
- **Frontend**: Exposed on host port `3000` (mapped to container port `80`).
- **Backend**: Exposed on host port `8000` (mapped to container port `8000`).
- **PostgreSQL**: Exposed on host port `5433` (mapped to container port `5432`) to avoid conflicts with existing local PostgreSQL installations.

## 5. Environment Variables
- Handled securely via Docker Compose and `.env` interpolation.
- Key variables included:
  - `DATABASE_URL` (dynamic routing to `db:5432` internally)
  - `VITE_API_BASE_URL` (build-time arg for the frontend pointing to `http://localhost:8000`)
  - `ALLOWED_ORIGINS` (dynamically configuring FastAPI CORS middleware)

## 6. PostgreSQL Volume
- Created a named volume `postgres_data` to ensure all user data and prediction history persist across container restarts and rebuilds.

## 7. Frontend Deployment
- Uses a multi-stage `Dockerfile`. 
- Incorporates a custom `nginx.conf` that uses `try_files $uri $uri/ /index.html;` to ensure React Router handles SPA routing correctly without throwing 404 errors on page refresh.

## 8. Backend Deployment
- Uses Python 3.12 slim.
- Copies the `requirements.txt` and correctly installs dependencies.
- Boots using the production ASGI server `uvicorn backend.app.main:app --host 0.0.0.0 --port 8000`.

## 9. ML Model Packaging
- The `backend/Dockerfile` explicitly copies the `models/` directory into the container to ensure `random_forest_yield_model.joblib` and `preprocessor.joblib` are correctly loaded by `prediction.py` on startup.

## 10. CORS Configuration
- Modified `backend/app/main.py` to ingest the `ALLOWED_ORIGINS` environment variable, ensuring that requests from `http://localhost:3000` (the Dockerized frontend) are properly authenticated and served while preserving existing credentials logic.

## 11. Build Result
- **Status**: FAILED (Docker Unavailable)
- **Reason**: The build could not proceed because the local Docker daemon is not running or not installed (`open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`).

## 12. Runtime Result
- **Status**: N/A (Could not start `docker compose up`).

## 13. End-to-End Verification
- **Status**: N/A (Cannot test endpoints within Docker at this time).

## 14. Known Limitations
- The deployment is fully prepared, orchestrated, and configured at the code level, but cannot be validated locally until Docker Desktop is started or installed on the host machine.
