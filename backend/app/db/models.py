from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.db.config import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="Farmer", nullable=False)  # "Farmer" or "Administrator"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    farms = relationship("Farm", back_populates="owner", cascade="all, delete-orphan")

class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    farm_name = Column(String(100), nullable=False)
    location = Column(String(255), nullable=False)
    area = Column(Float, nullable=False)  # in acres
    soil_type = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

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
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

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
