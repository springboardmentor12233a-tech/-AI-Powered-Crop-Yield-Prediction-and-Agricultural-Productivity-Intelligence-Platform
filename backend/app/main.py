from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from backend.app.db.config import Base, engine, get_db
from backend.app.db.models import User, Farm, Crop, WeatherData, SoilData
from backend.app.db.schemas import (
    UserRegister, UserLogin, UserOut, Token,
    FarmCreate, FarmOut, CropCreate, CropOut
)
from backend.app.auth.security import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, get_admin_user
)

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
