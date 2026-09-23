import random
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware

from database import (
    check_database_connection,
    get_user_by_email,
    create_user,
    create_agricultural_record,
    get_agricultural_records,
    delete_agricultural_record,
    use_mongo
)
from schemas import (
    PredictionRequest,
    PredictionResponse,
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserResponse,
    UserProfileUpdate,
    AgriculturalRecordCreate,
    AgriculturalRecordResponse,
    SoilAnalysisRequest,
    YieldReportRequest
)
from auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
    get_optional_current_user
)
from ml_engine.predictor import predict_crop_yield_ml, get_model_metrics
from weather_service import get_live_weather
from soil_service import analyze_soil_health

app = FastAPI(
    title="CropCast Precision AgTech API",
    description="AI-Powered Crop Yield Prediction & Agricultural Productivity Intelligence Platform API",
    version="2.5.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "CropCast AgTech Platform API",
        "version": "2.5.0",
        "db_mode": "MongoDB" if use_mongo else "SQLite (Active)",
        "ml_engine": "XGBoost, RandomForest, GradientBoosting",
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    db_ok = check_database_connection()
    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "database_engine": "MongoDB" if use_mongo else "SQLite",
        "ml_models": "trained & active",
        "weather_service": "active"
    }


# ==========================================
# 1. USER MANAGEMENT MODULE & RBAC
# ==========================================

@app.post("/api/auth/register", response_model=TokenResponse)
def register_user(request: UserRegisterRequest):
    existing_user = get_user_by_email(request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    hashed_pwd = get_password_hash(request.password)
    user = create_user(
        email=request.email,
        full_name=request.full_name,
        hashed_password=hashed_pwd,
        role=request.role or "farmer"
    )

    access_token = create_access_token(data={"sub": user["id"], "email": user["email"]})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user)
    )

@app.post("/api/auth/login", response_model=TokenResponse)
def login_user(request: UserLoginRequest):
    user = get_user_by_email(request.email)
    if not user or not verify_password(request.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    access_token = create_access_token(data={"sub": user["id"], "email": user["email"]})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            role=user.get("role", "farmer"),
            farm_name=user.get("farm_name"),
            state=user.get("state"),
            primary_crop=user.get("primary_crop"),
            farm_size_hectares=user.get("farm_size_hectares"),
            created_at=user.get("created_at", "")
        )
    )

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        role=current_user.get("role", "farmer"),
        farm_name=current_user.get("farm_name"),
        state=current_user.get("state"),
        primary_crop=current_user.get("primary_crop"),
        farm_size_hectares=current_user.get("farm_size_hectares"),
        created_at=current_user.get("created_at", "")
    )


# ==========================================
# 2. AI & ML FORECASTING & EVALUATION MODULE
# ==========================================

@app.post("/api/predict", response_model=PredictionResponse)
def predict_crop_yield(request: PredictionRequest):
    """
    Real-time ML prediction using trained XGBoost / RandomForest pipelines
    incorporating climate and soil chemistry telemetry.
    """
    try:
        result = predict_crop_yield_ml(
            crop_type=request.crop,
            region=request.state,
            season=request.season,
            area=request.area,
            rainfall=request.rainfall,
            temperature=request.temperature,
            fertilizer=request.fertilizer or 120.0,
            pesticide=request.pesticide or 1.5,
            soil_ph=request.soil_ph or 6.8,
            soil_moisture=request.soil_moisture or 35.0,
            nitrogen=request.nitrogen or 1.8,
            phosphorus=request.phosphorus or 1.1,
            potassium=request.potassium or 1.3,
            model_choice=request.model_choice or "xgboost"
        )
        return PredictionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ml/metrics")
def get_ml_performance_metrics():
    """
    Returns model evaluation metrics: R2 score, MAE, RMSE, and Top Feature Importances.
    """
    return get_model_metrics()


# ==========================================
# 3. WEATHER ANALYTICS MODULE
# ==========================================

@app.get("/api/weather")
def get_weather_analytics(region: str = "Punjab"):
    """
    Get 7-day agro-meteorological forecast, GDD index, and rainfall trends.
    """
    return get_live_weather(region=region)


# ==========================================
# 4. SOIL ANALYSIS WORKFLOW MODULE
# ==========================================

@app.post("/api/soil/analyze")
def analyze_soil(request: SoilAnalysisRequest):
    """
    Evaluate soil chemical balance (pH, NPK, moisture), health score,
    and generate custom fertilizer prescriptions.
    """
    return analyze_soil_health(
        soil_ph=request.soil_ph,
        nitrogen_ppm=request.nitrogen_ppm,
        phosphorus_ppm=request.phosphorus_ppm,
        potassium_ppm=request.potassium_ppm,
        moisture_percent=request.moisture_percent,
        organic_matter_percent=request.organic_matter_percent or 1.8,
        target_crop=request.target_crop or "Wheat"
    )


# ==========================================
# 5. AGRICULTURAL INTELLIGENCE & REPORTING MODULE
# ==========================================

@app.post("/api/reports/yield")
def generate_yield_report(report: YieldReportRequest):
    """
    Generate an official, structured agricultural intelligence & yield forecast report.
    """
    report_id = f"AGR-{random.randint(10000, 99999)}"
    generated_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    # Benchmarks & calculations
    potential_revenue_estimate = round(report.total_production * 270.0, 2)  # Avg benchmark $270/ton
    productivity_index = "High Productivity" if report.yield_per_hectare > 4.5 else "Standard Productivity"

    return {
        "report_id": report_id,
        "title": report.report_title,
        "generated_at": generated_at,
        "farmer_name": report.farmer_name,
        "farm_details": {
            "state": report.state,
            "crop": report.crop,
            "season": report.season,
            "area_hectares": report.area
        },
        "environmental_metrics": {
            "rainfall_mm": report.rainfall,
            "temperature_celsius": report.temperature,
            "soil_ph": report.soil_ph,
            "soil_moisture_percent": report.soil_moisture
        },
        "ai_prediction_summary": {
            "model_engine": report.model_used,
            "yield_per_hectare": report.yield_per_hectare,
            "total_harvest_tonnes": report.total_production,
            "confidence_score": report.confidence,
            "risk_assessment": report.risk_level,
            "productivity_rating": productivity_index
        },
        "economic_estimates": {
            "estimated_commercial_value_usd": potential_revenue_estimate,
            "recommended_harvest_window": "30-45 days post maturity index"
        },
        "agronomic_advisory": report.advisory
    }


# ==========================================
# 6. DATA COLLECTION & FARM RECORDS MANAGEMENT
# ==========================================

@app.post("/api/records", response_model=AgriculturalRecordResponse)
def create_record(
    record: AgriculturalRecordCreate,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    user_id = current_user["id"] if current_user else "guest_session"
    created = create_agricultural_record(user_id, record.dict())
    return AgriculturalRecordResponse(**created)

@app.get("/api/records", response_model=List[AgriculturalRecordResponse])
def get_records(current_user: Optional[dict] = Depends(get_optional_current_user)):
    user_id = current_user["id"] if current_user else None
    records = get_agricultural_records(user_id=user_id)
    return [AgriculturalRecordResponse(**r) for r in records]

@app.delete("/api/records/{record_id}")
def delete_record(record_id: str, current_user: Optional[dict] = Depends(get_optional_current_user)):
    user_id = current_user["id"] if current_user else None
    deleted = delete_agricultural_record(record_id, user_id=user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Agricultural record not found.")
    return {"status": "success", "message": f"Record {record_id} deleted successfully."}

@app.get("/api/records/summary")
def get_records_summary(current_user: Optional[dict] = Depends(get_optional_current_user)):
    user_id = current_user["id"] if current_user else None
    records = get_agricultural_records(user_id=user_id)
    
    total_records = len(records)
    total_hectares = sum(r.get("area", 0) for r in records)
    total_production = sum(r.get("total_production", 0) for r in records)
    avg_yield = round(total_production / total_hectares, 2) if total_hectares > 0 else 0

    crops_count = {}
    for r in records:
        c = r.get("crop", "Unknown")
        crops_count[c] = crops_count.get(c, 0) + 1

    return {
        "total_records": total_records,
        "total_hectares": round(total_hectares, 2),
        "total_production": round(total_production, 2),
        "avg_yield_per_hectare": avg_yield,
        "crops_distribution": crops_count
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
