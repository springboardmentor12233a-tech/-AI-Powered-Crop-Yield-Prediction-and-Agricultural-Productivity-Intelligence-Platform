from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import health, auth

app = FastAPI(
    title="YieldSense AI API",
    description="Crop Yield Prediction and Agricultural Productivity Intelligence Platform",
    version="1.0.0"
)

# Configure CORS for frontend development
# Allow requests from Vite dev server (port 5173) and local origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(auth.router)


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