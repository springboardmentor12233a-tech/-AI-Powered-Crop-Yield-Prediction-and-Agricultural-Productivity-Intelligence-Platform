"""
User ORM Model
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from ..database.connection import Base


class User(Base):
    """
    User model representing system users.
    
    Maps to the users table in PostgreSQL.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    role = relationship("Role", back_populates="users")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, name={self.name})>"
