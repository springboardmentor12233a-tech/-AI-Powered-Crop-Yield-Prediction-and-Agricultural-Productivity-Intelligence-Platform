"""
Role ORM Model
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship

from ..database.connection import Base


class Role(Base):
    """
    Role model representing user roles in the system.
    
    Maps to the roles table in PostgreSQL.
    """
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String(50), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    users = relationship("User", back_populates="role")

    def __repr__(self):
        return f"<Role(id={self.id}, role_name={self.role_name})>"
