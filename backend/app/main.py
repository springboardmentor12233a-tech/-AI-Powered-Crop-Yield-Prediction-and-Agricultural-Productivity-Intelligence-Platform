from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from backend.app.core.config import settings
from backend.app.api.auth import router as auth_router
from backend.app.api.data import router as data_router
from backend.app.api.analytics import router as analytics_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="YieldSense AI - Crop Yield Prediction & Agricultural Productivity Intelligence Platform API"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static EDA Plots Directory
plots_dir = "eda_plots"
os.makedirs(plots_dir, exist_ok=True)
app.mount("/eda_plots", StaticFiles(directory=plots_dir), name="eda_plots")

# Include API Routers
app.include_router(auth_router)
app.include_router(data_router)
app.include_router(analytics_router)

@app.get("/")
def root():
    return {
        "status": "online",
        "platform": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "documentation": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "YieldSense AI Backend"}
