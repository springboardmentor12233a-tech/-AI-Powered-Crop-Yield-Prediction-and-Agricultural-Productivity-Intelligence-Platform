"""
Prediction History ORM Model
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship, backref

from ..database.connection import Base


class PredictionHistory(Base):
    """
    Model for storing user predictions and their results.
    
    Maps to the prediction_history table in PostgreSQL.
    """
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Core agricultural inputs
    region = Column(String(100), nullable=False)
    crop_type = Column(String(100), nullable=False)
    
    # The full JSON input dictionary so we don't need 20 separate columns for everything
    input_data = Column(JSON, nullable=False)
    
    # Results
    predicted_yield = Column(Float, nullable=False)
    weather_risk = Column(String(50), nullable=True)
    soil_status = Column(String(50), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationship
    user = relationship("User", backref=backref("predictions", cascade="all, delete-orphan", passive_deletes=True))

    def __repr__(self):
        return f"<PredictionHistory(id={self.id}, user_id={self.user_id}, crop_type={self.crop_type}, predicted_yield={self.predicted_yield})>"
