@echo off
echo ======================================================
echo Starting YieldSense AI Services...
echo ======================================================

:: 1. Start PostgreSQL
echo [DB] Starting local PostgreSQL server on port 5432...
cd postgres
bin\pg_ctl.exe start -D data -o "-p 5432" -l server.log
cd ..

:: Wait for DB to initialize and start
timeout /t 3 /nobreak > nul

:: 2. Start FastAPI Backend
echo [BACKEND] Starting FastAPI Server on http://127.0.0.1:8000...
start "FastAPI Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn app.main:app --port 8000 --host 127.0.0.1"

:: 3. Start React Frontend
echo [FRONTEND] Starting React Vite Server on http://127.0.0.1:3000...
start "React Frontend" cmd /k "cd frontend && npm run dev"

echo ======================================================
echo All services launched successfully!
echo - API documentation (Swagger): http://127.0.0.1:8000/docs
echo - Frontend Interface: http://127.0.0.1:3000
echo ======================================================
pause
