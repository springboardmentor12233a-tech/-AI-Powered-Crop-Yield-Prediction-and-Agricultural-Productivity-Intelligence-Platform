import sys
from pathlib import Path
PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from backend.app.db.config import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="Farmer", nullable=False)  # "Farmer" or "Administrator"
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    farms = relationship("Farm", back_populates="owner", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="user", cascade="all, delete-orphan")

class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    farm_name = Column(String(100), nullable=False)
    location = Column(String(255), nullable=False)
    area = Column(Float, nullable=False)  # in acres
    soil_type = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    owner = relationship("User", back_populates="farms")
    crops = relationship("Crop", back_populates="farm", cascade="all, delete-orphan")
    weather = relationship("WeatherData", back_populates="farm", cascade="all, delete-orphan")
    soil = relationship("SoilData", back_populates="farm", cascade="all, delete-orphan")

class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    crop_name = Column(String(100), nullable=False)
    season = Column(String(50), nullable=False)
    sowing_date = Column(Date, nullable=True)
    harvest_date = Column(Date, nullable=True)
    historical_yield = Column(Float, nullable=True)  # tons per acre
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    farm = relationship("Farm", back_populates="crops")

class WeatherData(Base):
    __tablename__ = "weather_data"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    temperature = Column(Float, nullable=False)
    rainfall = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    date = Column(Date, nullable=False)

    # Relationships
    farm = relationship("Farm", back_populates="weather")

class SoilData(Base):
    __tablename__ = "soil_data"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    nitrogen = Column(Float, nullable=False)
    phosphorus = Column(Float, nullable=False)
    potassium = Column(Float, nullable=False)
    ph = Column(Float, nullable=False)

    # Relationships
    farm = relationship("Farm", back_populates="soil")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="SET NULL"), nullable=True)
    crop_id = Column(Integer, ForeignKey("crops.id", ondelete="SET NULL"), nullable=True)

    state = Column(String(100), nullable=False)
    crop = Column(String(100), nullable=False)
    soil_type = Column(String(100), nullable=False)
    fertilizer = Column(String(100), nullable=False)
    n = Column(Float, nullable=False)
    p = Column(Float, nullable=False)
    k = Column(Float, nullable=False)
    rainfall_mm = Column(Float, nullable=False)
    temperature_c = Column(Float, nullable=False)
    soil_ph = Column(Float, nullable=False)
    year = Column(Integer, nullable=False, default=2026)

    predicted_yield_kg = Column(Float, nullable=False)
    predicted_yield_tons = Column(Float, nullable=False)
    productivity_category = Column(String(100), nullable=True)
    recommendation_summary = Column(String(500), nullable=True)
    model_name = Column(String(100), default="LinearRegression", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="predictions")
    farm = relationship("Farm")
    crop_rel = relationship("Crop")
