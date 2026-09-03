from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routers import auth, predictions, recommendations, analytics

app = FastAPI(
    title="YieldSense AI - Agricultural Intelligence Platform API",
    description="Backend API services for Crop Yield Forecasting, Crop Recommendation, Weather Analytics, and Agricultural Reporting.",
    version="2.0.0"
)

# Enable CORS for Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth.router)
app.include_router(predictions.router)
app.include_router(recommendations.router)
app.include_router(analytics.router)

@app.get("/")
def read_root():
    return {
        "project": "YieldSense AI",
        "stage": "Milestone 2 — Yield Prediction & Agricultural Analysis",
        "status": "Online",
        "models": {
            "yield_forecasting": "Ridge Regression Pipeline (R²: 0.9821, RMSE: 5.08 ton/ha)",
            "crop_recommendation": "Random Forest Classifier (Accuracy: 95.86%, 70 Crop Varieties)"
        },
        "api_documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.api.main:app", host="127.0.0.1", port=8000, reload=True)
