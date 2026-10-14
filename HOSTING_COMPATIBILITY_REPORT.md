# Hosting Compatibility Report

## Frontend Hosting: Vercel or Render
- Vercel is free, supports Vite, and has no issues with the current architecture.
- Cloudflare Pages is also an excellent free static hosting option.

## Backend Hosting: Render Web Service (Free Tier)
- Render Free Tier provides 512MB RAM and 0.1 CPU.
- FastAPI + Scikit-Learn model (690KB) + basic SQLite fits comfortably within 512MB.
- **Limitation - Ephemeral Filesystem:** Render free tier spins down after inactivity and does not persist local files. `app.db` will be wiped on restart.
- **Mitigation:** We will keep SQLite for simplicity to avoid introducing external database dependencies (like Neon/Supabase) which would require rewriting the SQLite queries. We will document this constraint.

## Model Hosting
- Model is small (690 KB). It can be loaded in memory easily.
