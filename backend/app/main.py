from fastapi import FastAPI

app = FastAPI(
    title="YieldSense AI API",
    description="Crop Yield Prediction and Agricultural Productivity Intelligence Platform",
    version="1.0.0"
)


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