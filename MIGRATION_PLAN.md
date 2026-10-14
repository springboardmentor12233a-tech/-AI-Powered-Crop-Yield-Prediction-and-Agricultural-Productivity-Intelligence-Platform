# Migration Plan

## Phase 2: Hosting Selection
- **Frontend:** Vercel (Free)
- **Backend:** Render (Free Web Service)
- **Constraints:** `app.db` will be ephemeral on Render.

## Phase 3: Frontend Migration
- Add `.env.example` with `VITE_API_URL`.
- Ensure `VITE_API_URL` is correctly used in `App.jsx` (already implemented).

## Phase 4: Backend Migration
- Ensure `requirements.txt` is updated.
- Add a `.env.example` for the backend (`GEMINI_API_KEY`).

## Phase 5 & 6: Security and Verification
- Verify `champion_agri_model.pkl` loading.
- Verify Gemini key handling in `advisory_service.py` (already uses `os.environ` implicitly, but can be made explicit).
- Ensure `.gitignore` ignores `.env` and `app.db`.

## Phase 7: Deployment Files
- `render.yaml` is already present. We will refine it.
- Update `README.md` with instructions.
