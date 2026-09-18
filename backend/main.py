"""
YieldSense AI — FastAPI Application
Main entry point for the backend server.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os, sys

# Ensure imports work from this directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db.database import create_tables
from routes.auth import router as auth_router
from routes.predict import router as predict_router
from routes.insights import router as insights_router
from routes.weather import router as weather_router
from routes.soil import router as soil_router

# ─── App Initialization ───────────────────────────────────────────────────────
app = FastAPI(
    title="YieldSense AI",
    description=(
        "AI-powered crop yield prediction and agricultural productivity "
        "forecasting platform. Provides ML-based yield predictions, "
        "weather analysis, soil assessment, and AI-powered farming insights."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Create DB Tables on Startup ─────────────────────────────────────────────
@app.on_event("startup")
def startup_event():
    create_tables()
    print("[OK] Database tables created/verified")


# ─── Register Routers ─────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(predict_router)
app.include_router(insights_router)
app.include_router(weather_router)
app.include_router(soil_router)

# ─── Root Endpoint ────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "app": "YieldSense AI",
        "version": "1.0.0",
        "description": "Crop Yield Prediction & Agricultural Productivity Forecasting System",
        "docs": "/docs",
        "status": "running",
    }

@app.get("/health")
def health():
    return {"status": "healthy", "service": "YieldSense AI Backend"}
