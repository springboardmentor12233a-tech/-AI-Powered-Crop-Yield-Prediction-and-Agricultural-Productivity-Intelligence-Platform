from fastapi import FastAPI
from contextlib import asynccontextmanager
import logging

from backend.prediction import load_pipeline
from backend.weather_analysis import load_historical_weather_analysis
from backend.soil_analysis import load_historical_soil_analysis
from fastapi.middleware.cors import CORSMiddleware

from .api import health, auth, ml, notifications

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load the ML pipeline
    logger.info("Loading ML pipeline...")
    load_pipeline()
    logger.info("ML pipeline loaded successfully.")
    
    # Startup: Load the historical weather analysis
    logger.info("Loading historical weather analysis...")
    load_historical_weather_analysis()
    logger.info("Historical weather analysis loaded successfully.")
    
    # Startup: Load the historical soil analysis
    logger.info("Loading historical soil analysis...")
    load_historical_soil_analysis()
    logger.info("Historical soil analysis loaded successfully.")
    
    yield
    # Shutdown logic (if any) can go here
    logger.info("Shutting down API...")

app = FastAPI(
    title="YieldSense AI API",
    description="Crop Yield Prediction and Agricultural Productivity Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for frontend development and production
import os

allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000")
allowed_origins = [origin.strip().rstrip("/") for origin in allowed_origins_str.split(",") if origin.strip()]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    clean_url = frontend_url.strip().rstrip("/")
    if clean_url not in allowed_origins:
        allowed_origins.append(clean_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(ml.router)
app.include_router(notifications.router)


@app.get("/")
def root():
    return {
        "message": "YieldSense AI Backend is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }