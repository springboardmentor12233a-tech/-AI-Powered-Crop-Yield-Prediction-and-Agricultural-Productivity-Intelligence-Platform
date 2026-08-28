from fastapi import FastAPI
from src.api.routers import auth, predictions, recommendations

app = FastAPI(
    title="YieldSense AI - Platform API",
    description="Backend API services for Crop Yield Prediction and Crop Recommendations.",
    version="1.0.0"
)

# Mount Routers
app.include_router(auth.router)
app.include_router(predictions.router)
app.include_router(recommendations.router)

@app.get("/")
def read_root():
    return {
        "project": "YieldSense AI",
        "stage": "Milestone 1 Data Foundation & Environment Setup",
        "status": "Online",
        "api_documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.api.main:app", host="127.0.0.1", port=8000, reload=True)
