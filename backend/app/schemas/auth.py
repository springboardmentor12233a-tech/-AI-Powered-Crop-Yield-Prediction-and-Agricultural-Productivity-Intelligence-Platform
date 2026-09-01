"""
Pydantic schemas for authentication
"""
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


class RoleBase(BaseModel):
    """Base schema for Role"""
    role_name: str


class RoleResponse(RoleBase):
    """Response schema for Role"""
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    """Base schema for User"""
    name: str
    email: EmailStr


class UserCreate(UserBase):
    """Schema for user registration"""
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")


class UserResponse(UserBase):
    """Safe user response schema (never includes password_hash)"""
    id: int
    role: RoleResponse
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for JWT token payload"""
    email: Optional[str] = None
    user_id: Optional[int] = None
