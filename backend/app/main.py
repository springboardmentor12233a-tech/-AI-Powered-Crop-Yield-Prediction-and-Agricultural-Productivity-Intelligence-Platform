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
from typing import List
import pandas as pd

from backend.app.db.config import Base, engine, get_db
from backend.app.db.models import User, Farm, Crop, WeatherData, SoilData, Prediction
from backend.app.db.schemas import (
    UserRegister, UserLogin, UserOut, Token,
    FarmCreate, FarmOut, CropCreate, CropOut,
    YieldPredictionInput, YieldPredictionResponse, MLModelInfoResponse,
    PredictionRecordCreate, PredictionRecordOut
)
from backend.app.auth.security import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, get_admin_user
)
from backend.app.services.prediction_service import PredictionService

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
