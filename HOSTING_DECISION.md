# Hosting Decision

## 1. Frontend
- **Platform:** Vercel
- **Reason:** Vercel provides top-tier free static and React hosting. It natively supports Vite applications and environment variables.
- **Limits:** Generous free tier limits for hobby projects (100GB bandwidth, sufficient build minutes).

## 2. Backend
- **Platform:** Render (Free Web Service)
- **Reason:** The FastAPI backend and ML model can run comfortably within Render's free 512MB RAM limit.
- **Constraints & Cold Starts:** Free tier services spin down after 15 minutes of inactivity. When a request wakes it up, there will be a cold start delay (10-30 seconds). The frontend has already been coded to ping the backend on startup.
- **Ephemeral Storage:** The local SQLite database (`app.db`) will be reset upon instance spin-down. We accept this limitation for the free tier, as migrating to an external PostgreSQL database would violate the requirement to minimize rewrites, or require a paid service.

## 3. Gemini API
- **Platform:** Google Gemini API
- **Management:** `GEMINI_API_KEY` will be configured securely in Render's environment variable dashboard. It will never be exposed to the client.

## 4. Overall Architecture
- Frontend on Vercel communicates with Backend on Render via REST over HTTPS.
- Backend loads local Scikit-Learn model and handles Gemini API calls internally.
- Complete free-tier compliance.
