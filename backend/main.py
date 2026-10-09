"""
YieldSense AI — FastAPI Application
Main entry point for the backend server.
Milestone 4: Added structured logging, improved health endpoint,
             and production-ready CORS configuration.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os, sys, logging

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("yieldsense")

# Ensure imports work from this directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db.database import create_tables
from routes.auth import router as auth_router
from routes.predict import router as predict_router
from routes.insights import router as insights_router
from routes.weather import router as weather_router
from routes.soil import router as soil_router
from routes.productivity import router as productivity_router
from routes.recommendation import router as recommendation_router
from routes.resources import router as resources_router
from routes.risk import router as risk_router
from routes.history import router as history_router
from routes.report import router as report_router
from routes.chatbot import router as chatbot_router

# ─── App Initialization ───────────────────────────────────────────────────────
app = FastAPI(
    title="YieldSense AI",
    description=(
        "AI-powered crop yield prediction and agricultural productivity "
        "forecasting platform. Provides ML-based yield predictions, "
        "weather analysis, soil assessment, crop recommendation, "
        "resource optimization, risk assessment, and AI-powered farming insights."
    ),
    version="4.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
# Read allowed origins from environment (comma-separated list)
_cors_origins_env = os.getenv("CORS_ORIGINS", "")
ALLOWED_ORIGINS = (
    [o.strip() for o in _cors_origins_env.split(",") if o.strip()]
    if _cors_origins_env
    else [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Create DB Tables on Startup ─────────────────────────────────────────────
@app.on_event("startup")
def startup_event():
    create_tables()
    logger.info("YieldSense AI v4.0.0 started")
    logger.info("Database tables created/verified")
    logger.info("CORS allowed origins: %s", ALLOWED_ORIGINS)


# ─── Register Routers ─────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(predict_router)
app.include_router(insights_router)
app.include_router(weather_router)
app.include_router(soil_router)
# Milestone 3 routers
app.include_router(productivity_router)
app.include_router(recommendation_router)
app.include_router(resources_router)
app.include_router(risk_router)
# M3 feature routers
app.include_router(history_router)
app.include_router(report_router)
app.include_router(chatbot_router)


# ─── Root Endpoint ────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "app": "YieldSense AI",
        "version": "4.0.0",
        "description": "Crop Yield Prediction & Agricultural Productivity Forecasting System",
        "docs": "/docs",
        "status": "running",
        "milestones": ["M1: Authentication & Prediction", "M2: Analytics & Insights",
                       "M3: Advanced Features", "M4: Testing & Deployment"],
    }


# ─── Health Endpoint ──────────────────────────────────────────────────────────
@app.get("/health")
def health():
    """
    Health check endpoint used by Docker HEALTHCHECK and load balancers.
    Returns HTTP 200 when the backend is running correctly.
    """
    import time
    from db.database import SessionLocal
    db_ok = False
    try:
        db = SessionLocal()
        db.execute(__import__("sqlalchemy").text("SELECT 1"))
        db.close()
        db_ok = True
    except Exception as e:
        logger.error("Health check DB error: %s", e)

    return {
        "status": "healthy" if db_ok else "degraded",
        "service": "YieldSense AI Backend",
        "version": "4.0.0",
        "database": "ok" if db_ok else "error",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
