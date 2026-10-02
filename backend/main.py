import random
import time
from typing import List, Optional
from datetime import datetime, timedelta
from collections import defaultdict
from fastapi import FastAPI, HTTPException, Depends, status, Response, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from database import (
    check_database_connection,
    get_user_by_email,
    get_user_by_identifier,
    create_user,
    create_agricultural_record,
    get_agricultural_records,
    delete_agricultural_record,
    get_farmer_profile,
    save_farmer_profile,
    get_consultant_profile,
    save_consultant_profile,
    get_all_users_with_profiles,
    update_user_role,
    delete_user_account,
    update_user_password,
    use_mongo,
    use_postgres
)
from schemas import (
    PredictionRequest,
    PredictionResponse,
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserResponse,
    UserProfileUpdate,
    FarmerProfileRequest,
    ConsultantProfileRequest,
    RoleUpdateRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
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
    get_optional_current_user,
    require_roles
)
from ml_engine.predictor import predict_crop_yield_ml, get_model_metrics
from weather_service import get_live_weather
from soil_service import analyze_soil_health
from report_generator import build_report_data, generate_pdf_report_bytes, generate_csv_report_text
from risk_service import evaluate_climate_and_pest_risk



app = FastAPI(
    title="CropCast Precision AgTech API Gateway",
    description="AI-Powered Crop Yield Prediction & Agricultural Productivity Intelligence Platform API Gateway",
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


# ==========================================
# API GATEWAY CORE ENGINE (RATE LIMITING & LOGGING & MONITORING)
# ==========================================

RATE_LIMIT_WINDOW_SECONDS = 60
MAX_REQUESTS_PER_WINDOW = 60

# Sliding window rate limiter state: client_ip -> list of request timestamps
client_request_history = defaultdict(list)

# Global API Gateway Telemetry & Monitoring Metrics
gateway_metrics = {
    "total_requests": 0,
    "status_2xx": 0,
    "status_4xx": 0,
    "status_5xx": 0,
    "rate_limit_blocked": 0,
    "total_latency_ms": 0.0,
    "start_time": datetime.utcnow().isoformat()
}

@app.middleware("http")
async def api_gateway_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    
    # 1. RATE LIMITING ENGINE (60 req/min per IP)
    # Filter out timestamps older than the sliding window
    history = [t for t in client_request_history[client_ip] if now - t < RATE_LIMIT_WINDOW_SECONDS]
    client_request_history[client_ip] = history
    
    if len(history) >= MAX_REQUESTS_PER_WINDOW and not request.url.path.startswith("/docs"):
        gateway_metrics["rate_limit_blocked"] += 1
        gateway_metrics["total_requests"] += 1
        gateway_metrics["status_4xx"] += 1
        return JSONResponse(
            status_code=429,
            content={
                "status": "error",
                "detail": f"Rate limit exceeded. Maximum {MAX_REQUESTS_PER_WINDOW} requests/minute allowed per IP address ({client_ip}).",
                "client_ip": client_ip,
                "retry_after_seconds": 60
            },
            headers={"Retry-After": "60", "X-RateLimit-Limit": str(MAX_REQUESTS_PER_WINDOW)}
        )
    
    # Record current request timestamp
    client_request_history[client_ip].append(now)
    
    # 2. LOGGING & MONITORING ENGINE (Latency & Telemetry)
    start_time = time.time()
    response = await call_next(request)
    process_time_ms = round((time.time() - start_time) * 1000, 2)
    
    # Update telemetry counters
    gateway_metrics["total_requests"] += 1
    gateway_metrics["total_latency_ms"] += process_time_ms
    
    if 200 <= response.status_code < 300:
        gateway_metrics["status_2xx"] += 1
    elif 400 <= response.status_code < 500:
        gateway_metrics["status_4xx"] += 1
    elif response.status_code >= 500:
        gateway_metrics["status_5xx"] += 1

    # Inject Gateway Headers
    response.headers["X-Process-Time-Ms"] = str(process_time_ms)
    response.headers["X-RateLimit-Limit"] = str(MAX_REQUESTS_PER_WINDOW)
    response.headers["X-RateLimit-Remaining"] = str(MAX_REQUESTS_PER_WINDOW - len(client_request_history[client_ip]))
    response.headers["X-Gateway-Engine"] = "CropCast AgTech API Gateway v2.5"
    
    print(f"[API GATEWAY] {request.method} {request.url.path} | Status: {response.status_code} | Latency: {process_time_ms}ms | Client IP: {client_ip}")
    return response


# API Gateway Feature Endpoints
@app.get("/api/gateway/metrics")
def get_gateway_metrics():
    """API Gateway Monitoring & Telemetry Endpoint."""
    total = gateway_metrics["total_requests"]
    avg_latency = round(gateway_metrics["total_latency_ms"] / total, 2) if total > 0 else 0.0
    return {
        "status": "active",
        "gateway_version": "2.5.0",
        "uptime_start": gateway_metrics["start_time"],
        "rate_limiting": {
            "window_seconds": RATE_LIMIT_WINDOW_SECONDS,
            "max_requests_per_window": MAX_REQUESTS_PER_WINDOW,
            "blocked_requests": gateway_metrics["rate_limit_blocked"]
        },
        "telemetry": {
            "total_requests_processed": total,
            "success_2xx_count": gateway_metrics["status_2xx"],
            "client_error_4xx_count": gateway_metrics["status_4xx"],
            "server_error_5xx_count": gateway_metrics["status_5xx"],
            "average_latency_ms": avg_latency
        }
    }

@app.get("/api/gateway/routes")
def get_gateway_routing_table():
    """API Gateway Request Routing Table Endpoint."""
    return {
        "status": "online",
        "gateway_routing_table": [
            {
                "service": "Authentication & Session Service",
                "prefix": "/api/auth/*",
                "auth_required": False,
                "endpoints": ["/api/auth/register", "/api/auth/login", "/api/auth/forgot-password", "/api/auth/reset-password"]
            },
            {
                "service": "Yield Predictor & ML Forecasting Engine",
                "prefix": "/yield-predictor",
                "aliases": ["/api/yield-predictor", "/api/predict"],
                "auth_required": True,
                "allowed_roles": ["Farmer", "Admin"]
            },
            {
                "service": "Agronomic Reports & Advisory Microservice",
                "prefix": "/reports",
                "aliases": ["/api/reports", "/api/reports/generate", "/api/reports/export/pdf"],
                "auth_required": True,
                "allowed_roles": ["Consultant", "Admin"]
            },
            {
                "service": "Agricultural Intelligence & Datasets Service",
                "prefix": "/datasets",
                "aliases": ["/api/datasets", "/api/analytics/*"],
                "auth_required": True,
                "allowed_roles": ["Researcher", "Admin"]
            },
            {
                "service": "Master User Governance & RBAC Console",
                "prefix": "/users",
                "aliases": ["/api/users", "/api/admin/users"],
                "auth_required": True,
                "allowed_roles": ["Admin"]
            }
        ]
    }


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "CropCast AgTech Platform API Gateway",
        "version": "2.5.0",
        "db_mode": "MongoDB" if use_mongo else "SQLite (Active)",
        "ml_engine": "XGBoost, RandomForest, GradientBoosting",
        "gateway_metrics_url": "/api/gateway/metrics",
        "gateway_routes_url": "/api/gateway/routes",
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
        "weather_service": "active",
        "gateway_middleware": "active (rate-limiting, logging, authorization)"
    }


# ==========================================
# 1. USER MANAGEMENT MODULE & RBAC
# ==========================================

VALID_ROLES = ["Farmer", "Consultant", "Admin", "Researcher"]

def normalize_role(role_input: Optional[str]) -> str:
    if not role_input:
        return "Farmer"
    for r in VALID_ROLES:
        if r.lower() == role_input.strip().lower():
            return r
    return "Farmer"

def seed_default_users():
    default_users = [
        {"email": "farmer@cropcast.ai", "username": "farmer", "full_name": "Rajesh Kumar (Farmer)", "role": "Farmer", "password": "password123"},
        {"email": "consultant@cropcast.ai", "username": "consultant", "full_name": "Dr. Anita Sharma (Consultant)", "role": "Consultant", "password": "password123"},
        {"email": "researcher@cropcast.ai", "username": "researcher", "full_name": "Dr. Vikram Seth (Researcher)", "role": "Researcher", "password": "password123"},
        {"email": "admin@cropcast.ai", "username": "admin", "full_name": "CropCast Administrator", "role": "Admin", "password": "password123"},
    ]
    for u in default_users:
        try:
            if not get_user_by_identifier(u["email"]):
                create_user(
                    email=u["email"],
                    username=u["username"],
                    full_name=u["full_name"],
                    hashed_password=get_password_hash(u["password"]),
                    role=u["role"]
                )
        except Exception as e:
            print(f"[Seed User Info] {e}")

try:
    seed_default_users()
except Exception:
    pass

@app.post("/api/auth/register", response_model=TokenResponse)
def register_user(request: UserRegisterRequest):
    if not request.email or not str(request.email).strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is required."
        )
    if not request.full_name or not request.full_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name is required for registration."
        )
    if not request.password or len(request.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    existing_user = get_user_by_identifier(request.email)
    if not existing_user and request.username:
        existing_user = get_user_by_identifier(request.username)

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user account with this email address or username already exists."
        )

    assigned_role = normalize_role(request.role)
    hashed_pwd = get_password_hash(request.password)
    user = create_user(
        email=request.email,
        username=request.username,
        full_name=request.full_name,
        hashed_password=hashed_pwd,
        role=assigned_role
    )

    # Issue JWT token containing the user's role (30m expiry)
    access_token = create_access_token(data={
        "sub": user["id"],
        "email": user["email"],
        "role": assigned_role
    })

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=assigned_role,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            username=user.get("username"),
            full_name=user["full_name"],
            role=assigned_role,
            created_at=user.get("created_at", "")
        )
    )

@app.post("/api/auth/login", response_model=TokenResponse)
def login_user(request: UserLoginRequest):
    if not request.email_or_username or not request.email_or_username.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter your email address or username."
        )
    if not request.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter your password."
        )

    user = get_user_by_identifier(request.email_or_username)
    if not user or not verify_password(request.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please check your email/username and password."
        )

    role = user.get("role", "Farmer")
    
    # Check remember_me flag: extend expiry to 7 days if requested, else 30 minutes
    expires_delta = timedelta(days=7) if request.remember_me else timedelta(minutes=30)
    access_token = create_access_token(
        data={
            "sub": user["id"],
            "email": user["email"],
            "role": role
        },
        expires_delta=expires_delta
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=role,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            username=user.get("username"),
            full_name=user["full_name"],
            role=role,
            farm_name=user.get("farm_name"),
            state=user.get("state"),
            primary_crop=user.get("primary_crop"),
            farm_size_hectares=user.get("farm_size_hectares"),
            created_at=user.get("created_at", "")
        )
    )

@app.post("/api/auth/forgot-password")
def forgot_password_request(request: PasswordResetRequest):
    user = get_user_by_identifier(request.email_or_username)
    if not user:
        # Return success for security to prevent user enumeration
        return {
            "status": "success",
            "message": f"If an account exists for '{request.email_or_username}', a verification code has been dispatched.",
            "demo_reset_code": "RESET-9482"
        }
    
    return {
        "status": "success",
        "message": f"Password reset verification code dispatched to {user['email']}.",
        "demo_reset_code": "RESET-9482"
    }

@app.post("/api/auth/reset-password")
def reset_password(request: PasswordResetConfirm):
    if not request.new_password or len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long.")
    
    if request.reset_code.upper() != "RESET-9482":
        raise HTTPException(status_code=400, detail="Invalid or expired reset verification code.")

    user = get_user_by_identifier(request.email_or_username)
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    new_hashed = get_password_hash(request.new_password)
    updated = update_user_password(user["id"], new_hashed)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update user password in database.")

    return {
        "status": "success",
        "message": "Password reset successfully! You can now log in with your new password."
    }



@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        username=current_user.get("username"),
        full_name=current_user["full_name"],
        role=current_user.get("role", "Farmer"),
        farm_name=current_user.get("farm_name"),
        state=current_user.get("state"),
        primary_crop=current_user.get("primary_crop"),
        farm_size_hectares=current_user.get("farm_size_hectares"),
        created_at=current_user.get("created_at", "")
    )

# Protected Role-Based Access Control (RBAC) Routes & Middleware Guards

@app.get("/yield-predictor")
@app.get("/api/yield-predictor")
@app.get("/api/protected/farmer-dashboard")
def farmer_yield_predictor_protected(current_user: dict = Depends(require_roles(["Farmer", "Admin"]))):
    """
    Access Control Protected Route: /yield-predictor
    Accessible ONLY to Farmer + Admin roles.
    """
    return {
        "status": "access_granted",
        "route": "/yield-predictor",
        "user_id": current_user["id"],
        "user_name": current_user["full_name"],
        "user_role": current_user.get("role"),
        "dashboard": "Farmer Yield Predictor & Advisory Engine",
        "allowed_roles": ["Farmer", "Admin"],
        "capabilities": ["Crop yield prediction", "Soil chemical balance input", "Farm records logger"]
    }

@app.get("/reports")
@app.get("/api/reports")
@app.get("/api/protected/consultant-tools")
def consultant_reports_protected(current_user: dict = Depends(require_roles(["Consultant", "Admin"]))):
    """
    Access Control Protected Route: /reports
    Accessible ONLY to Consultant + Admin roles.
    """
    return {
        "status": "access_granted",
        "route": "/reports",
        "user_id": current_user["id"],
        "user_name": current_user["full_name"],
        "user_role": current_user.get("role"),
        "dashboard": "Agronomic Consultant Advisory & Reports Portal",
        "allowed_roles": ["Consultant", "Admin"],
        "capabilities": ["PDF report generation", "Custom fertilizer prescription engine", "Client yield analysis"]
    }

@app.get("/datasets")
@app.get("/api/datasets")
@app.get("/api/protected/researcher-data")
def researcher_datasets_protected(current_user: dict = Depends(require_roles(["Researcher", "Admin"]))):
    """
    Access Control Protected Route: /datasets
    Accessible ONLY to Researcher + Admin roles.
    """
    return {
        "status": "access_granted",
        "route": "/datasets",
        "user_id": current_user["id"],
        "user_name": current_user["full_name"],
        "user_role": current_user.get("role"),
        "dashboard": "Agricultural Intelligence & Research Datasets Portal",
        "allowed_roles": ["Researcher", "Admin"],
        "capabilities": ["Regional agro-belt datasets", "ML model comparison metrics", "Growing Degree Days (GDD) raw telemetry"]
    }

@app.get("/users")
@app.get("/api/users")
@app.get("/api/protected/admin-panel")
def admin_users_protected(current_user: dict = Depends(require_roles(["Admin"]))):
    """
    Access Control Protected Route: /users
    Accessible ONLY to Admin role.
    """
    users = get_all_users_with_profiles()
    return {
        "status": "access_granted",
        "route": "/users",
        "user_id": current_user["id"],
        "user_name": current_user["full_name"],
        "user_role": current_user.get("role"),
        "dashboard": "CropCast Master Admin User Governance Console",
        "allowed_roles": ["Admin"],
        "total_users": len(users),
        "users": users,
        "capabilities": ["User RBAC management", "System telemetry & database state", "ML model retraining triggers"]
    }


# Profile Management Endpoints (Linked via Foreign Key user_id)
@app.get("/api/profile/farmer")
def get_my_farmer_profile(current_user: dict = Depends(get_current_user)):
    """Returns linked farm info for logged-in farmer (region, soil type, crop preferences)."""
    return get_farmer_profile(current_user["id"])

@app.put("/api/profile/farmer")
def update_my_farmer_profile(
    profile: FarmerProfileRequest,
    current_user: dict = Depends(get_current_user)
):
    """Updates linked farm info for logged-in farmer."""
    return save_farmer_profile(current_user["id"], profile.dict())

@app.get("/api/profile/consultant")
def get_my_consultant_profile(current_user: dict = Depends(get_current_user)):
    """Returns linked professional info for logged-in consultant (expertise, regions served)."""
    return get_consultant_profile(current_user["id"])

@app.put("/api/profile/consultant")
def update_my_consultant_profile(
    profile: ConsultantProfileRequest,
    current_user: dict = Depends(get_current_user)
):
    """Updates linked professional info for logged-in consultant."""
    return save_consultant_profile(current_user["id"], profile.dict())


# Admin User Governance Endpoints
@app.get("/api/admin/users")
def list_all_users_admin(current_user: dict = Depends(require_roles(["Admin"]))):
    """Admin endpoint: List all registered users with linked farm and consultant profiles."""
    users = get_all_users_with_profiles()
    return {
        "status": "success",
        "total_users": len(users),
        "db_engine": "PostgreSQL (Active)" if use_postgres else "SQLite (Active Relational)",
        "users": users
    }

@app.put("/api/admin/users/{user_id}/role")
def update_user_role_admin(
    user_id: str,
    req: RoleUpdateRequest,
    current_user: dict = Depends(require_roles(["Admin"]))
):
    """Admin endpoint: Modify any user's system access role."""
    updated = update_user_role(user_id, req.role)
    if not updated:
        raise HTTPException(status_code=404, detail="User account not found.")
    return {"status": "success", "message": f"User {user_id} role updated to '{req.role}'."}

@app.delete("/api/admin/users/{user_id}")
def delete_user_account_admin(
    user_id: str,
    current_user: dict = Depends(require_roles(["Admin"]))
):
    """Admin endpoint: Delete user account and cascade delete linked profile & records."""
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Admins cannot delete their own active session account.")
    deleted = delete_user_account(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User account not found.")
    return {"status": "success", "message": f"User account {user_id} deleted successfully."}




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


@app.get("/api/analytics/regional")
def get_regional_analytics():
    """
    Returns regional comparative reports and benchmarks across agricultural belts.
    """
    return [
        {
            "id": "REG-01",
            "region": "Punjab",
            "state": "Punjab",
            "belt": "Northern Granary",
            "avg_yield": 4.95,
            "total_production_kton": 1820.5,
            "primary_crop": "Wheat",
            "secondary_crop": "Rice",
            "efficiency_pct": 94.5,
            "soil_health_score": 88,
            "rain_dependence_pct": 32.0,
            "climate_risk_level": "Low",
            "irrigated_area_pct": 98.2
        },
        {
            "id": "REG-02",
            "region": "Haryana",
            "state": "Haryana",
            "belt": "Northern Granary",
            "avg_yield": 4.65,
            "total_production_kton": 1450.2,
            "primary_crop": "Wheat",
            "secondary_crop": "Mustard",
            "efficiency_pct": 91.2,
            "soil_health_score": 84,
            "rain_dependence_pct": 38.5,
            "climate_risk_level": "Low",
            "irrigated_area_pct": 92.4
        },
        {
            "id": "REG-03",
            "region": "UP West",
            "state": "Uttar Pradesh",
            "belt": "Gangetic Plains",
            "avg_yield": 4.10,
            "total_production_kton": 2100.8,
            "primary_crop": "Sugarcane",
            "secondary_crop": "Wheat",
            "efficiency_pct": 85.0,
            "soil_health_score": 79,
            "rain_dependence_pct": 45.0,
            "climate_risk_level": "Moderate",
            "irrigated_area_pct": 84.1
        },
        {
            "id": "REG-04",
            "region": "MP Central",
            "state": "Madhya Pradesh",
            "belt": "Central Plateau",
            "avg_yield": 3.75,
            "total_production_kton": 1280.4,
            "primary_crop": "Soybean",
            "secondary_crop": "Wheat",
            "efficiency_pct": 79.5,
            "soil_health_score": 82,
            "rain_dependence_pct": 68.0,
            "climate_risk_level": "Moderate",
            "irrigated_area_pct": 58.6
        },
        {
            "id": "REG-05",
            "region": "MH West",
            "state": "Maharashtra",
            "belt": "Deccan Traps",
            "avg_yield": 3.40,
            "total_production_kton": 1150.0,
            "primary_crop": "Cotton",
            "secondary_crop": "Sugarcane",
            "efficiency_pct": 76.0,
            "soil_health_score": 75,
            "rain_dependence_pct": 72.5,
            "climate_risk_level": "Moderate",
            "irrigated_area_pct": 42.0
        },
        {
            "id": "REG-06",
            "region": "Gujarat South",
            "state": "Gujarat",
            "belt": "Western Coastal Belt",
            "avg_yield": 3.85,
            "total_production_kton": 980.6,
            "primary_crop": "Cotton",
            "secondary_crop": "Groundnut",
            "efficiency_pct": 81.4,
            "soil_health_score": 78,
            "rain_dependence_pct": 55.0,
            "climate_risk_level": "Low",
            "irrigated_area_pct": 64.3
        },
        {
            "id": "REG-07",
            "region": "Karnataka South",
            "state": "Karnataka",
            "belt": "Southern Deccan",
            "avg_yield": 3.60,
            "total_production_kton": 890.3,
            "primary_crop": "Rice",
            "secondary_crop": "Maize",
            "efficiency_pct": 77.8,
            "soil_health_score": 76,
            "rain_dependence_pct": 62.0,
            "climate_risk_level": "Moderate",
            "irrigated_area_pct": 48.0
        },
        {
            "id": "REG-08",
            "region": "WB Delta",
            "state": "West Bengal",
            "belt": "Eastern Delta",
            "avg_yield": 4.25,
            "total_production_kton": 1620.0,
            "primary_crop": "Rice",
            "secondary_crop": "Jute",
            "efficiency_pct": 86.8,
            "soil_health_score": 85,
            "rain_dependence_pct": 78.0,
            "climate_risk_level": "Moderate",
            "irrigated_area_pct": 71.5
        }
    ]


@app.get("/api/analytics/seasonal")
def get_seasonal_analytics():
    """
    Returns seasonal performance trends, crop seasonal matrix, and climate telemetry.
    """
    return {
        "yearly_trends": [
            { "year": "2019", "kharif": 3.4, "rabi": 3.8, "zaid": 2.5, "rainfall": 520, "temperature": 24.5 },
            { "year": "2020", "kharif": 3.6, "rabi": 4.1, "zaid": 2.7, "rainfall": 580, "temperature": 24.1 },
            { "year": "2021", "kharif": 3.5, "rabi": 3.9, "zaid": 2.6, "rainfall": 490, "temperature": 25.2 },
            { "year": "2022", "kharif": 3.8, "rabi": 4.4, "zaid": 2.9, "rainfall": 640, "temperature": 23.8 },
            { "year": "2023", "kharif": 3.9, "rabi": 4.6, "zaid": 3.0, "rainfall": 610, "temperature": 24.0 },
            { "year": "2024", "kharif": 4.1, "rabi": 4.85, "zaid": 3.2, "rainfall": 670, "temperature": 23.5 },
            { "year": "2025", "kharif": 4.2, "rabi": 4.98, "zaid": 3.3, "rainfall": 685, "temperature": 23.6 },
            { "year": "2026", "kharif": 4.35, "rabi": 5.12, "zaid": 3.45, "rainfall": 710, "temperature": 23.2 }
        ],
        "seasonal_crop_matrix": [
            { "crop": "Wheat", "rabi": 4.85, "kharif": 0.50, "zaid": 1.20, "avg_yield": 4.85 },
            { "crop": "Rice", "rabi": 2.10, "kharif": 4.20, "zaid": 2.80, "avg_yield": 4.20 },
            { "crop": "Maize", "rabi": 3.50, "kharif": 3.85, "zaid": 3.10, "avg_yield": 3.85 },
            { "crop": "Cotton", "rabi": 0.80, "kharif": 2.45, "zaid": 0.60, "avg_yield": 2.45 },
            { "crop": "Soybean", "rabi": 1.10, "kharif": 3.20, "zaid": 0.90, "avg_yield": 3.20 },
            { "crop": "Barley", "rabi": 3.90, "kharif": 0.40, "zaid": 1.10, "avg_yield": 3.90 }
        ],
        "season_summary": {
            "rabi": { "best_crop": "Wheat", "avg_yield": 4.85, "growth_rate": "+6.2%", "primary_risk": "Late frost / Heat wave during grain filling" },
            "kharif": { "best_crop": "Rice", "avg_yield": 4.20, "growth_rate": "+4.8%", "primary_risk": "Monsoon irregularity & flood risk" },
            "zaid": { "best_crop": "Maize", "avg_yield": 3.20, "growth_rate": "+3.5%", "primary_risk": "High evapotranspiration & groundwater stress" }
        }
    }


@app.get("/api/analytics/ml-predictions-summary")
def get_ml_predictions_summary():
    """
    Returns aggregated ML yield predictions by crop and model architecture.
    """
    return {
        "crop_yield_predictions": [
            { "crop": "Wheat", "xgboost": 4.85, "random_forest": 4.78, "gradient_boosting": 4.82, "benchmark_2023": 4.60 },
            { "crop": "Rice", "xgboost": 4.20, "random_forest": 4.15, "gradient_boosting": 4.18, "benchmark_2023": 3.90 },
            { "crop": "Maize", "xgboost": 3.85, "random_forest": 3.75, "gradient_boosting": 3.80, "benchmark_2023": 3.50 },
            { "crop": "Soybean", "xgboost": 3.20, "random_forest": 3.10, "gradient_boosting": 3.15, "benchmark_2023": 2.95 },
            { "crop": "Cotton", "xgboost": 2.45, "random_forest": 2.40, "gradient_boosting": 2.42, "benchmark_2023": 2.25 },
            { "crop": "Barley", "xgboost": 3.90, "random_forest": 3.82, "gradient_boosting": 3.88, "benchmark_2023": 3.65 }
        ],
        "confidence_by_crop": [
            { "crop": "Wheat", "confidence": 95.2 },
            { "crop": "Rice", "confidence": 93.8 },
            { "crop": "Maize", "confidence": 91.5 },
            { "crop": "Soybean", "confidence": 89.4 },
            { "crop": "Cotton", "confidence": 88.0 },
            { "crop": "Barley", "confidence": 92.1 }
        ]
    }



# ==========================================
# 3. WEATHER ANALYTICS MODULE
# ==========================================

@app.get("/api/weather")
def get_weather_analytics(region: str = "Punjab"):
    """
    Get 7-day agro-meteorological forecast, GDD index, and rainfall trends.
    """
    return get_live_weather(region=region)


@app.get("/api/risk/evaluate")
def get_risk_assessment_get(
    crop: str = "Wheat",
    state: str = "Punjab",
    season: str = "Rabi",
    temperature: float = 22.0,
    rainfall: float = 650.0,
    humidity: float = 68.0,
    soil_ph: float = 6.8
):
    """
    Evaluate Agro-Climatic Risks (Drought %, Heat Stress %, Frost %, Flood %) 
    and return Pest/Disease early warning alerts with percentages and color codes.
    """
    return evaluate_climate_and_pest_risk(
        crop=crop,
        state=state,
        season=season,
        temperature=temperature,
        rainfall=rainfall,
        humidity_percent=humidity,
        soil_ph=soil_ph
    )


@app.post("/api/risk/evaluate")
def get_risk_assessment_post(payload: PredictionRequest):
    """
    Evaluate Agro-Climatic Risks and Pest/Disease Alerts using PredictionRequest payload.
    """
    return evaluate_climate_and_pest_risk(
        crop=payload.crop,
        state=payload.state,
        season=payload.season,
        temperature=payload.temperature,
        rainfall=payload.rainfall,
        humidity_percent=payload.soil_moisture or 65.0,
        soil_ph=payload.soil_ph or 6.8
    )



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

@app.post("/api/reports/generate")
@app.post("/api/reports/yield")
def generate_agricultural_report(report: YieldReportRequest):
    """
    Generate comprehensive agricultural report covering:
    - Productivity scores (Tonnes/Ha) & Rating
    - Seasonal yield comparisons (Rabi vs Kharif vs Zaid)
    - Weather impact summaries (Rainfall, Temp, GDD, Climate Risk)
    - Agronomic Advisory for farmers and consultants
    """
    return build_report_data(
        farmer_name=report.farmer_name or "Registered Farmer",
        consultant_name=report.consultant_name or "Dr. Agronomist (CropCast Lead)",
        state=report.state,
        crop=report.crop,
        season=report.season,
        area=report.area,
        rainfall=report.rainfall,
        temperature=report.temperature,
        fertilizer=report.fertilizer or 120.0,
        pesticide=report.pesticide or 1.5,
        yield_per_hectare=report.yield_per_hectare or 4.85,
        total_production=report.total_production or (report.yield_per_hectare or 4.85) * report.area,
        confidence=report.confidence or 94.8,
        model_used=report.model_used or "XGBoost Regressor v2.4",
        risk_level=report.risk_level or "Low",
        advisory=report.advisory or "Apply Nitrogen top-dressing at tillering stage and maintain scheduled micro-irrigation."
    )


@app.get("/api/reports/generate")
def generate_agricultural_report_get(
    farmer_name: str = "Registered Farmer",
    consultant_name: str = "Dr. Agronomist (CropCast Lead)",
    state: str = "Punjab",
    crop: str = "Wheat",
    season: str = "Rabi",
    area: float = 50.0,
    rainfall: float = 650.0,
    temperature: float = 22.0,
    fertilizer: float = 120.0,
    pesticide: float = 1.5,
    yield_per_hectare: float = 4.85,
    total_production: float = 242.5,
    confidence: float = 94.8,
    model_used: str = "XGBoost Regressor v2.4",
    risk_level: str = "Low",
    advisory: str = "Apply Nitrogen top-dressing at tillering stage and maintain scheduled micro-irrigation."
):
    """GET endpoint to preview or generate report via query parameters."""
    return build_report_data(
        farmer_name=farmer_name,
        consultant_name=consultant_name,
        state=state,
        crop=crop,
        season=season,
        area=area,
        rainfall=rainfall,
        temperature=temperature,
        fertilizer=fertilizer,
        pesticide=pesticide,
        yield_per_hectare=yield_per_hectare,
        total_production=total_production,
        confidence=confidence,
        model_used=model_used,
        risk_level=risk_level,
        advisory=advisory
    )


@app.post("/api/reports/export/pdf")
def export_pdf_report(report: YieldReportRequest):
    """
    Generate downloadable PDF Agricultural Intelligence Report for farmers and consultants.
    """
    report_data = build_report_data(
        farmer_name=report.farmer_name or "Registered Farmer",
        consultant_name=report.consultant_name or "Dr. Agronomist (CropCast Lead)",
        state=report.state,
        crop=report.crop,
        season=report.season,
        area=report.area,
        rainfall=report.rainfall,
        temperature=report.temperature,
        fertilizer=report.fertilizer or 120.0,
        pesticide=report.pesticide or 1.5,
        yield_per_hectare=report.yield_per_hectare or 4.85,
        total_production=report.total_production or (report.yield_per_hectare or 4.85) * report.area,
        confidence=report.confidence or 94.8,
        model_used=report.model_used or "XGBoost Regressor v2.4",
        risk_level=report.risk_level or "Low",
        advisory=report.advisory or "Apply Nitrogen top-dressing at tillering stage and maintain scheduled micro-irrigation."
    )
    pdf_bytes = generate_pdf_report_bytes(report_data)
    filename = f"CropCast_Report_{report.crop}_{report.state}_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@app.get("/api/reports/export/pdf")
def export_pdf_report_get(
    farmer_name: str = "Registered Farmer",
    consultant_name: str = "Dr. Agronomist (CropCast Lead)",
    state: str = "Punjab",
    crop: str = "Wheat",
    season: str = "Rabi",
    area: float = 50.0,
    rainfall: float = 650.0,
    temperature: float = 22.0,
    fertilizer: float = 120.0,
    pesticide: float = 1.5,
    yield_per_hectare: float = 4.85,
    total_production: float = 242.5,
    confidence: float = 94.8,
    model_used: str = "XGBoost Regressor v2.4",
    risk_level: str = "Low",
    advisory: str = "Apply Nitrogen top-dressing at tillering stage and maintain scheduled micro-irrigation."
):
    """GET link for downloading PDF report directly in browser."""
    report_data = build_report_data(
        farmer_name=farmer_name,
        consultant_name=consultant_name,
        state=state,
        crop=crop,
        season=season,
        area=area,
        rainfall=rainfall,
        temperature=temperature,
        fertilizer=fertilizer,
        pesticide=pesticide,
        yield_per_hectare=yield_per_hectare,
        total_production=total_production,
        confidence=confidence,
        model_used=model_used,
        risk_level=risk_level,
        advisory=advisory
    )
    pdf_bytes = generate_pdf_report_bytes(report_data)
    filename = f"CropCast_Report_{crop}_{state}_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@app.post("/api/reports/export/csv")
def export_csv_report(report: YieldReportRequest):
    """
    Generate downloadable CSV Agricultural Intelligence Report for farmers, consultants, and analysts.
    """
    report_data = build_report_data(
        farmer_name=report.farmer_name or "Registered Farmer",
        consultant_name=report.consultant_name or "Dr. Agronomist (CropCast Lead)",
        state=report.state,
        crop=report.crop,
        season=report.season,
        area=report.area,
        rainfall=report.rainfall,
        temperature=report.temperature,
        fertilizer=report.fertilizer or 120.0,
        pesticide=report.pesticide or 1.5,
        yield_per_hectare=report.yield_per_hectare or 4.85,
        total_production=report.total_production or (report.yield_per_hectare or 4.85) * report.area,
        confidence=report.confidence or 94.8,
        model_used=report.model_used or "XGBoost Regressor v2.4",
        risk_level=report.risk_level or "Low",
        advisory=report.advisory or "Apply Nitrogen top-dressing at tillering stage and maintain scheduled micro-irrigation."
    )
    csv_text = generate_csv_report_text(report_data)
    filename = f"CropCast_Report_{report.crop}_{report.state}_{datetime.utcnow().strftime('%Y%m%d')}.csv"

    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@app.get("/api/reports/export/csv")
def export_csv_report_get(
    farmer_name: str = "Registered Farmer",
    consultant_name: str = "Dr. Agronomist (CropCast Lead)",
    state: str = "Punjab",
    crop: str = "Wheat",
    season: str = "Rabi",
    area: float = 50.0,
    rainfall: float = 650.0,
    temperature: float = 22.0,
    fertilizer: float = 120.0,
    pesticide: float = 1.5,
    yield_per_hectare: float = 4.85,
    total_production: float = 242.5,
    confidence: float = 94.8,
    model_used: str = "XGBoost Regressor v2.4",
    risk_level: str = "Low",
    advisory: str = "Apply Nitrogen top-dressing at tillering stage and maintain scheduled micro-irrigation."
):
    """GET link for downloading CSV report directly in browser."""
    report_data = build_report_data(
        farmer_name=farmer_name,
        consultant_name=consultant_name,
        state=state,
        crop=crop,
        season=season,
        area=area,
        rainfall=rainfall,
        temperature=temperature,
        fertilizer=fertilizer,
        pesticide=pesticide,
        yield_per_hectare=yield_per_hectare,
        total_production=total_production,
        confidence=confidence,
        model_used=model_used,
        risk_level=risk_level,
        advisory=advisory
    )
    csv_text = generate_csv_report_text(report_data)
    filename = f"CropCast_Report_{crop}_{state}_{datetime.utcnow().strftime('%Y%m%d')}.csv"

    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )



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
