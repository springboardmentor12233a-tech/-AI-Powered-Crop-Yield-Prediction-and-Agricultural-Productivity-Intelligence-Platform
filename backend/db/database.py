"""
YieldSense AI — Database Setup
SQLite database with SQLAlchemy ORM for user authentication and prediction history.
"""
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Float, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import get_settings

settings = get_settings()

if settings.DATABASE_URL.startswith("sqlite:///"):
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    db_dir = os.path.dirname(os.path.abspath(db_path))
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="farmer")          # farmer | admin | researcher
    farm_name = Column(String, nullable=True)
    farm_location = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class PredictionHistory(Base):
    """Stores every successful crop yield prediction per authenticated user."""
    __tablename__ = "prediction_history"

    id                          = Column(Integer, primary_key=True, index=True)
    user_id                     = Column(Integer, nullable=False, index=True)
    created_at                  = Column(DateTime, default=datetime.utcnow)

    # Input parameters
    crop                        = Column(String, nullable=False)
    region                      = Column(String, nullable=False)
    rainfall_mm                 = Column(Float, nullable=False)
    temperature_c               = Column(Float, nullable=False)
    weather_condition           = Column(String, nullable=False)
    soil_type                   = Column(String, nullable=False)
    soil_ph                     = Column(Float, nullable=False)
    nitrogen                    = Column(Float, nullable=False)
    phosphorus                  = Column(Float, nullable=False)
    potassium                   = Column(Float, nullable=False)
    fertilizer_used             = Column(Integer, nullable=False)
    irrigation_used             = Column(Integer, nullable=False)

    # Prediction result
    predicted_yield_kg_per_acre = Column(Float, nullable=False)
    model_used                  = Column(String, nullable=False)
    prediction_confidence       = Column(String, nullable=False)


def create_tables():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

