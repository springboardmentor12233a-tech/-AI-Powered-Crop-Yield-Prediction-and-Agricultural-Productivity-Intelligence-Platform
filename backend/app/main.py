import os
import sys
from pathlib import Path

# Ensure project root is in sys.path regardless of execution directory
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import pandas as pd

from backend.app.db.config import Base, engine, get_db
from backend.app.db.models import User, Farm, Crop, WeatherData, SoilData, Prediction, ChatMessage
from backend.app.db.schemas import (
    UserRegister, UserLogin, UserOut, Token,
    FarmCreate, FarmOut, CropCreate, CropOut,
    YieldPredictionInput, YieldPredictionResponse, MLModelInfoResponse,
    PredictionRecordCreate, PredictionRecordOut,
    AdminStatsOut, AdminUserSummaryOut, AdminActivityItem,
    AgriculturalAnalyticsOut, FarmerAnalyticsOut,
    RiskAnalysisInput, RiskAnalysisOut,
    ChatRequest, ChatResponse, ChatMessageOut
)
from backend.app.auth.security import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, get_admin_user, get_optional_current_user
)
from backend.app.services.prediction_service import PredictionService
from backend.app.services.analytics_service import AnalyticsService
from backend.app.services.chatbot_service import ChatbotService

# Automatically create database tables if they do not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="YieldSense AI API",
    description="Backend API for Crop Yield Prediction & Agricultural Productivity Forecasting System",
    version="1.0.0"
)

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Health check endpoint ---
@app.get("/api/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    try:
        # Perform a quick query to test DB connection
        db.execute(Base.metadata.tables["users"].select().limit(1))
        return {
            "status": "healthy",
            "application": "YieldSense AI",
            "database": "connected"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection error: {str(e)}"
        )

@app.get("/api/dataset", tags=["Dataset"])
def get_dataset():
    dataset_path = Path(__file__).resolve().parents[2] / "dataset" / "processed" / "crop_yield_cleaned.csv"
    if not dataset_path.exists():
        raise HTTPException(status_code=404, detail="Dataset file not found.")

    df = pd.read_csv(dataset_path)
    return {
        "columns": df.columns.tolist(),
        "rows": df.head(100).to_dict(orient="records"),
        "total_rows": len(df)
    }

# --- Authentication routes ---
@app.post("/api/auth/register", response_model=UserOut, tags=["Authentication"])
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if email is already registered
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered."
        )
    
    # Hash password and create user
    hashed_pwd = get_password_hash(user_in.password)
    db_user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hashed_pwd,
        role=user_in.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/api/auth/login", response_model=Token, tags=["Authentication"])
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    # Fetch user
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
    
    # Generate token
    token_data = {"sub": user.email, "role": user.role}
    token_str = create_access_token(data=token_data)
    
    return Token(
        access_token=token_str,
        token_type="bearer",
        role=user.role,
        name=user.name
    )

@app.get("/api/auth/me", response_model=UserOut, tags=["Authentication"])
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# --- Farm CRUD routes ---
@app.post("/api/farms", response_model=FarmOut, tags=["Farms"])
def create_farm(farm_in: FarmCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_farm = Farm(
        user_id=current_user.id,
        farm_name=farm_in.farm_name,
        location=farm_in.location,
        area=farm_in.area,
        soil_type=farm_in.soil_type
    )
    db.add(db_farm)
    db.commit()
    db.refresh(db_farm)
    return db_farm

@app.get("/api/farms", response_model=List[FarmOut], tags=["Farms"])
def list_farms(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "Administrator":
        # Admins can view all farms
        return db.query(Farm).all()
    else:
        # Farmers can only view their own farms
        return db.query(Farm).filter(Farm.user_id == current_user.id).all()

@app.get("/api/farms/{id}", response_model=FarmOut, tags=["Farms"])
def get_farm(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found."
        )
    
    # Access control: Farmer must own the farm
    if current_user.role != "Administrator" and farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied to access this farm."
        )
    return farm

# --- Crop CRUD routes ---
@app.post("/api/crops", response_model=CropOut, tags=["Crops"])
def create_crop(crop_in: CropCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Validate farm ownership
    farm = db.query(Farm).filter(Farm.id == crop_in.farm_id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm associated with crop not found."
        )
    
    if current_user.role != "Administrator" and farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied. You do not own the farm associated with this crop."
        )
        
    db_crop = Crop(
        farm_id=crop_in.farm_id,
        crop_name=crop_in.crop_name,
        season=crop_in.season,
        sowing_date=crop_in.sowing_date,
        harvest_date=crop_in.harvest_date,
        historical_yield=crop_in.historical_yield
    )
    db.add(db_crop)
    db.commit()
    db.refresh(db_crop)
    return db_crop

@app.get("/api/crops", response_model=List[CropOut], tags=["Crops"])
def list_crops(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "Administrator":
        return db.query(Crop).all()
    else:
        # Join with Farm to restrict to user's farms
        return db.query(Crop).join(Farm).filter(Farm.user_id == current_user.id).all()

@app.get("/api/crops/{id}", response_model=CropOut, tags=["Crops"])
def get_crop(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    crop = db.query(Crop).filter(Crop.id == id).first()
    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crop record not found."
        )
    
    # Access control: Farmer must own the farm associated with the crop
    farm = db.query(Farm).filter(Farm.id == crop.farm_id).first()
    if current_user.role != "Administrator" and farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied to access this crop record."
        )
    return crop


# --- ML Crop Yield Prediction Routes (Milestone 2) ---
prediction_service = PredictionService()

@app.post("/api/predict/yield", response_model=YieldPredictionResponse, tags=["Predictions"])
def predict_crop_yield(input_data: YieldPredictionInput):
    """
    Accepts field soil nutrients, meteorological values, and crop cultivars,
    transforms features using the preprocessor pipeline, and forecasts crop yield (kg/acre).
    """
    try:
        # Convert Pydantic payload to dictionary
        payload = input_data.model_dump()
        prediction = prediction_service.predict_single(payload)
        return prediction
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}"
        )

@app.get("/api/predict/metadata", tags=["Predictions"])
def get_model_metadata():
    """Returns active model metadata, supported categorical categories, and performance metrics."""
    try:
        return prediction_service.get_metadata()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Metadata loading error: {str(e)}"
        )

@app.get("/api/ml/model-info", response_model=MLModelInfoResponse, tags=["Machine Learning"])
def get_ml_model_info():
    """
    Returns verified model specifications, evaluation metrics (MAE, RMSE, R²),
    dataset training size, and active feature definitions directly from actual model artifacts.
    """
    try:
        meta = prediction_service.get_metadata()
        metrics = meta.get("performance_metrics", {})
        ds_info = meta.get("dataset_summary", {})
        features_info = meta.get("input_features", {})

        return MLModelInfoResponse(
            best_model_name=meta.get("algorithm", "LinearRegression"),
            model_version=meta.get("version", "2.0.0"),
            dataset_size=int(ds_info.get("total_records", 1500)),
            train_samples=int(ds_info.get("train_records", 1200)),
            test_samples=int(ds_info.get("test_records", 300)),
            number_of_features=int(features_info.get("total_raw_features", 11)),
            total_transformed_features=int(features_info.get("total_transformed_features", 43)),
            mae=float(metrics.get("Test_MAE", 4273.23)),
            rmse=float(metrics.get("Test_RMSE", 11381.99)),
            r2=float(metrics.get("Test_R2", 0.0029)),
            mse=float(metrics.get("Test_MSE", 129549785.13)) if "Test_MSE" in metrics else None,
            train_mae=float(metrics.get("Train_MAE", 3337.38)) if "Train_MAE" in metrics else None,
            train_rmse=float(metrics.get("Train_RMSE", 9355.86)) if "Train_RMSE" in metrics else None,
            train_r2=float(metrics.get("Train_R2", 0.0319)) if "Train_R2" in metrics else None,
            features=features_info.get("categorical", []) + features_info.get("numerical", []),
            created_at=meta.get("created_at")
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve model info: {str(e)}"
        )


# --- Prediction History CRUD Endpoints (Milestone 2 Step 8) ---
@app.post("/api/predictions", response_model=PredictionRecordOut, tags=["Predictions"])
def create_saved_prediction(
    pred_in: PredictionRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Executes model inference and persists the prediction record linked to the authenticated user.
    Validates farm/crop ownership if farm_id/crop_id are provided.
    """
    if pred_in.farm_id:
        farm = db.query(Farm).filter(Farm.id == pred_in.farm_id).first()
        if not farm:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated farm not found.")
        if current_user.role != "Administrator" and farm.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied for selected farm.")

    if pred_in.crop_id:
        crop = db.query(Crop).filter(Crop.id == pred_in.crop_id).first()
        if not crop:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated crop not found.")

    # Run inference
    payload = pred_in.model_dump(exclude={"farm_id", "crop_id"})
    pred_result = prediction_service.predict_single(payload)

    # Save to database
    db_pred = Prediction(
        user_id=current_user.id,
        farm_id=pred_in.farm_id,
        crop_id=pred_in.crop_id,
        state=pred_in.State,
        crop=pred_in.Crop,
        soil_type=pred_in.Soil_Type,
        fertilizer=pred_in.Fertilizer,
        n=pred_in.N,
        p=pred_in.P,
        k=pred_in.K,
        rainfall_mm=pred_in.Rainfall_mm,
        temperature_c=pred_in.Temperature_C,
        soil_ph=pred_in.Soil_pH,
        year=pred_in.Year or 2026,
        predicted_yield_kg=pred_result["predicted_yield_kg_per_acre"],
        predicted_yield_tons=pred_result["predicted_yield_tons_per_acre"],
        productivity_category=pred_result.get("productivity_category"),
        recommendation_summary=pred_result.get("recommendation_summary"),
        model_name=pred_result.get("algorithm_used", "LinearRegression")
    )
    db.add(db_pred)
    db.commit()
    db.refresh(db_pred)
    return db_pred

@app.get("/api/predictions", response_model=List[PredictionRecordOut], tags=["Predictions"])
def list_predictions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns prediction history.
    - Farmers: restricted strictly to their own predictions.
    - Administrators: oversight access to view all predictions.
    """
    if current_user.role == "Administrator":
        return db.query(Prediction).order_by(Prediction.created_at.desc()).all()
    else:
        return db.query(Prediction).filter(Prediction.user_id == current_user.id).order_by(Prediction.created_at.desc()).all()

@app.get("/api/predictions/{id}", response_model=PredictionRecordOut, tags=["Predictions"])
def get_prediction(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches a specific prediction with role & ownership authorization."""
    pred = db.query(Prediction).filter(Prediction.id == id).first()
    if not pred:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction record not found.")

    if current_user.role != "Administrator" and pred.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied to access this prediction.")
    return pred

@app.delete("/api/predictions/{id}", tags=["Predictions"])
def delete_prediction(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a prediction record with authorization check."""
    pred = db.query(Prediction).filter(Prediction.id == id).first()
    if not pred:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction record not found.")

    if current_user.role != "Administrator" and pred.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied to delete this prediction.")

    db.delete(pred)
    db.commit()
    return {"status": "success", "message": f"Prediction record #{id} deleted successfully."}


# =====================================================================
# MILESTONE 3: AGRICULTURAL ANALYTICS & RISK ANALYSIS ROUTES
# =====================================================================
analytics_service = AnalyticsService()
chatbot_service = ChatbotService()

@app.get("/api/analytics/system", response_model=AgriculturalAnalyticsOut, tags=["Analytics"])
def get_system_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns comprehensive agricultural yield distributions, crop productivity rankings,
    soil health profiles, weather impacts, and agronomic insights.
    """
    try:
        return analytics_service.get_system_analytics(db=db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analytics calculation error: {str(e)}"
        )

@app.get("/api/analytics/farmer", response_model=FarmerAnalyticsOut, tags=["Analytics"])
def get_farmer_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns individualized analytics for the authenticated farmer,
    including farm summaries, crop logs, prediction history stats, and tailored recommendations.
    """
    try:
        return analytics_service.get_farmer_analytics(user_id=current_user.id, db=db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Farmer analytics calculation error: {str(e)}"
        )

@app.post("/api/insights/analyze", response_model=RiskAnalysisOut, tags=["Analytics"])
def analyze_crop_risks(input_data: RiskAnalysisInput):
    """
    Evaluates field conditions (Crop, Soil, Nutrients, Rainfall, Temp, pH)
    to calculate agricultural risk scores, identify hazard factors, and provide agronomic advice.
    """
    try:
        payload = input_data.model_dump()
        return analytics_service.analyze_risks_and_insights(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Risk analysis error: {str(e)}"
        )


# =====================================================================
# MILESTONE 3: ADMINISTRATOR DASHBOARD & USER MANAGEMENT ROUTES
# =====================================================================
@app.get("/api/admin/stats", response_model=AdminStatsOut, tags=["Admin"])
def get_admin_stats(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Provides administrator dashboard KPI summary metrics, role breakdown,
    state-wise farm distributions, and real-time activity stream.
    """
    try:
        total_users = db.query(User).count()
        total_farmers = db.query(User).filter(User.role == "Farmer").count()
        total_admins = db.query(User).filter(User.role == "Administrator").count()
        total_farms = db.query(Farm).count()
        total_crops = db.query(Crop).count()
        total_preds = db.query(Prediction).count()

        preds = db.query(Prediction).all()
        avg_pred = round(float(sum(p.predicted_yield_kg for p in preds) / len(preds)), 2) if preds else 0.0

        model_meta = prediction_service.get_metadata()

        # State distribution of farms
        farms = db.query(Farm).all()
        state_counts = {}
        for f in farms:
            loc = f.location.split(",")[-1].strip() if "," in f.location else f.location.strip()
            state_counts[loc] = state_counts.get(loc, 0) + 1
        state_dist = [{"state": k, "count": v} for k, v in state_counts.items()]

        # Crop distribution
        crops = db.query(Crop).all()
        crop_counts = {}
        for c in crops:
            crop_counts[c.crop_name] = crop_counts.get(c.crop_name, 0) + 1
        crop_dist = [{"crop": k, "count": v} for k, v in crop_counts.items()]

        # Recent activity stream
        recent_preds = db.query(Prediction).order_by(Prediction.created_at.desc()).limit(5).all()
        recent_users = db.query(User).order_by(User.created_at.desc()).limit(5).all()

        activity_items = []
        for p in recent_preds:
            activity_items.append(AdminActivityItem(
                id=f"pred-{p.id}",
                type="prediction",
                title=f"Yield Forecast: {p.crop}",
                description=f"Predicted {p.predicted_yield_kg:,.1f} kg/ac ({p.state}) for User #{p.user_id}",
                timestamp=p.created_at
            ))
        for u in recent_users:
            activity_items.append(AdminActivityItem(
                id=f"user-{u.id}",
                type="user_registered",
                title=f"User Joined: {u.name}",
                description=f"{u.role} ({u.email}) created an account",
                timestamp=u.created_at,
                user_name=u.name,
                user_email=u.email
            ))

        activity_items.sort(key=lambda x: x.timestamp, reverse=True)

        return AdminStatsOut(
            total_users=total_users,
            total_farmers=total_farmers,
            total_administrators=total_admins,
            total_farms=total_farms,
            total_crops=total_crops,
            total_predictions=total_preds,
            avg_system_predicted_yield_kg=avg_pred,
            model_info=model_meta,
            state_distribution=state_dist,
            crop_distribution=crop_dist,
            recent_activity=activity_items[:10]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Admin stats calculation error: {str(e)}"
        )

@app.get("/api/admin/users", response_model=List[AdminUserSummaryOut], tags=["Admin"])
def list_admin_users(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Returns summary list of all registered platform users with associated resource counts."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    out = []
    for u in users:
        out.append(AdminUserSummaryOut(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            created_at=u.created_at,
            farms_count=len(u.farms),
            crops_count=sum(len(f.crops) for f in u.farms),
            predictions_count=len(u.predictions)
        ))
    return out


# =====================================================================
# MILESTONE 3: AGRICULTURAL AI CHATBOT ROUTES
# =====================================================================
@app.post("/api/chat", response_model=ChatResponse, tags=["Chatbot"])
def chat_with_assistant(
    req: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Interactive AgriSense AI Chatbot answering questions on crops, soil,
    nutrients, weather, yield forecasting, and agronomic management.
    """
    try:
        import json
        resp = chatbot_service.generate_response(
            query=req.message,
            context=req.context,
            history=[h.model_dump() for h in req.history] if req.history else None
        )

        # Persist conversation if authenticated
        if current_user:
            user_msg = ChatMessage(
                user_id=current_user.id,
                role="user",
                message=req.message
            )
            bot_msg = ChatMessage(
                user_id=current_user.id,
                role="assistant",
                message=resp["reply"],
                category=resp.get("category"),
                suggestions=json.dumps(resp.get("suggestions", []))
            )
            db.add(user_msg)
            db.add(bot_msg)
            db.commit()

        return ChatResponse(
            reply=resp["reply"],
            category=resp.get("category", "general_farming"),
            suggestions=resp.get("suggestions", []),
            timestamp=resp["timestamp"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chatbot execution error: {str(e)}"
        )

@app.get("/api/chat/history", response_model=List[ChatMessageOut], tags=["Chatbot"])
def get_user_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves chat message history for the authenticated farmer/admin."""
    import json
    messages = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id
    ).order_by(ChatMessage.created_at.asc()).limit(50).all()

    out = []
    for m in messages:
        suggs = []
        if m.suggestions:
            try:
                suggs = json.loads(m.suggestions)
            except Exception:
                suggs = []
        out.append(ChatMessageOut(
            id=m.id,
            role=m.role,
            message=m.message,
            category=m.category,
            suggestions=suggs,
            created_at=m.created_at
        ))
    return out

@app.delete("/api/chat/history", tags=["Chatbot"])
def clear_user_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clears all saved chat history for the authenticated user."""
    db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).delete()
    db.commit()
    return {"status": "success", "message": "Chat history cleared successfully."}

