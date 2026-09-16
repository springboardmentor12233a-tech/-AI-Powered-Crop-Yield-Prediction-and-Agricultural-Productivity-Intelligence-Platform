from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from src.db.database import init_db
from src.api.routers import predictions, recommendations, analytics, auth, farmer, reports_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI Lifespan Manager:
    Initializes SQLite database tables and verifies ML model readiness on startup.
    """
    print("Starting YieldSense AI Backend Server...")
    init_db()
    yield
    print("Shutting down YieldSense AI Backend Server...")

app = FastAPI(
    title="YieldSense AI — Agricultural Intelligence Platform API",
    description="Backend API services for Crop Yield Forecasting, Crop Suitability Analysis, Farmer Accounts, and Agronomic Reporting.",
    version="2.0.0",
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
        "status": "Online",
        "services": {
            "yield_forecasting": "Active",
            "crop_suitability": "Active",
            "weather_analytics": "Active",
            "soil_analysis": "Active",
            "farmer_accounts": "Active"
        },
        "api_documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.api.main:app", host="127.0.0.1", port=8000, reload=True)
