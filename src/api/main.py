from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from src.db.database import init_db
from src.ml.models.registry import get_yield_model, get_crop_recommendation_artifact
from src.api.routers import (
    predictions,
    recommendations,
    analytics,
    auth,
    farmer,
    reports_router,
    admin,
    chat
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI Lifespan Manager:
    - Initializes SQLite database tables with Milestone 3 schema & admin seeding
    - Pre-warms ML models into memory to guarantee near-instantaneous inference (<20ms).
    """
    print("Starting YieldSense AI Backend Server (Milestone 3)...")
    init_db()
    # Pre-warm ML models once at startup
    try:
        get_yield_model()
        get_crop_recommendation_artifact()
        print("ML Models cached into memory successfully.")
    except Exception as e:
        print(f"Warning during model pre-warm: {e}")
    yield
    print("Shutting down YieldSense AI Backend Server...")

app = FastAPI(
    title="YieldSense AI — Agricultural Intelligence Platform API",
    description="Backend API services for Crop Yield Forecasting, Crop Suitability Analysis, Farmer & Admin Accounts, LLM Reporting, Risk Assessment, and Agricultural AI Assistant.",
    version="3.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend web application communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth.router)
app.include_router(farmer.router)
app.include_router(admin.router)
app.include_router(chat.router)
app.include_router(predictions.router)
app.include_router(recommendations.router)
app.include_router(analytics.router)
app.include_router(reports_router.router)

@app.get("/")
def read_root():
    """System status and API health summary endpoint."""
    return {
        "project": "YieldSense AI",
        "title": "AI-Based Crop Yield Prediction & Agricultural Recommendation Platform",
        "milestone": "Milestone 3 — Agricultural Intelligence, Dashboards & Recommendations",
        "status": "Online",
        "services": {
            "yield_forecasting": "Active",
            "crop_suitability": "Active",
            "weather_analytics": "Active",
            "soil_analysis": "Active",
            "farmer_accounts": "Active",
            "admin_management": "Active",
            "ai_agricultural_assistant": "Active",
            "pdf_report_engine": "Active"
        },
        "api_documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.api.main:app", host="127.0.0.1", port=8000, reload=True)
