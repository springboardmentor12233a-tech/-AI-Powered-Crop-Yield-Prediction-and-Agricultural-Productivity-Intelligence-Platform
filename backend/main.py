from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
import joblib
import numpy as np
import os
import models, schemas
from database import engine, SessionLocal

# Generate database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="YieldSense AI API", version="1.0")
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup password hashing and JWT configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Load the trained machine learning model artifact
model_path = os.path.join(os.path.dirname(__file__), 'models', 'crop_yield_model.pkl')
crop_model = joblib.load(model_path)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Token generation function
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=60)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@app.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = pwd_context.hash(user.password)
    new_user = models.User(
        email=user.email, 
        hashed_password=hashed_pwd, 
        full_name=user.full_name,
        role="farmer"
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/predict")
def predict_yield(input_data: schemas.CropPredictionInput, token: str = Depends(oauth2_scheme)):
    features = np.array([[
        input_data.rainfall, 
        input_data.temperature, 
        input_data.pesticide, 
        input_data.area
    ]])
    
    predicted_yield = crop_model.predict(features)[0]
    return {
        "predicted_crop_yield": round(float(predicted_yield), 2),
        "unit": "tons/hectare"
    }
# Helper function to securely get the logged-in user from the JWT token
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# POST route to save a new field
@app.post("/fields", response_model=schemas.FieldResponse)
def create_field(field: schemas.FieldCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_field = models.Field(
        name=field.name,
        location=field.location,
        area=field.area,
        soil=field.soil,
        owner_id=current_user.id
    )
    db.add(new_field)
    db.commit()
    db.refresh(new_field)
    return new_field

# GET route to load all fields for the logged-in user
@app.get("/fields", response_model=list[schemas.FieldResponse])
def get_fields(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    fields = db.query(models.Field).filter(models.Field.owner_id == current_user.id).all()
    return fields