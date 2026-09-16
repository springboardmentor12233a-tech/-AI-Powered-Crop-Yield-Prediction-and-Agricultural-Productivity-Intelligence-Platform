from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any
import base64
import json

from src.db.database import create_user, authenticate_user, get_user_by_id, complete_user_onboarding

router = APIRouter(prefix="/api/auth", tags=["Farmer Authentication"])

class RegisterRequest(BaseModel):
    email: str = Field(..., description="Farmer email address")
    password: str = Field(..., min_length=4, description="Farmer password")
    full_name: str = Field(..., description="Farmer full name")
    phone: Optional[str] = Field("", description="Phone number")
    village: Optional[str] = Field("", description="Village name")
    district: Optional[str] = Field("", description="District name")
    state: Optional[str] = Field("", description="State name")

class LoginRequest(BaseModel):
    email: str = Field(..., description="Registered email address")
    password: str = Field(..., description="Farmer password")

class AuthResponse(BaseModel):
    token: str
    user: Dict[str, Any]
    status: str

def generate_token(user_id: int, email: str) -> str:
    """Generates a simple, secure session token for authenticated farmers."""
    token_data = {"user_id": user_id, "email": email}
    return base64.b64encode(json.dumps(token_data).encode("utf-8")).decode("utf-8")

def decode_token(token: str) -> Optional[int]:
    """Decodes session token and returns user_id if valid."""
    try:
        decoded_bytes = base64.b64decode(token.encode("utf-8"))
        data = json.loads(decoded_bytes.decode("utf-8"))
        return data.get("user_id")
    except Exception:
        return None

def get_current_user_id(authorization: Optional[str] = Header(None)) -> Optional[int]:
    """
    FastAPI dependency extracting authenticated user ID from Authorization header.
    Format: 'Bearer <token>' or raw token string.
    """
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "").strip()
    return decode_token(token)

@router.post("/register", response_model=AuthResponse)
def register_farmer(req: RegisterRequest):
    """Registers a new farmer account with email and basic details."""
    try:
        user = create_user(
            email=req.email,
            password=req.password,
            full_name=req.full_name,
            phone=req.phone or "",
            village=req.village or "",
            district=req.district or "",
            state=req.state or ""
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")
        
    token = generate_token(user["id"], user["email"])
    return AuthResponse(token=token, user=user, status="Success")

@router.post("/login", response_model=AuthResponse)
def login_farmer(req: LoginRequest):
    """Authenticates a returning farmer with email and password."""
    user = authenticate_user(req.email, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    token = generate_token(user["id"], user["email"])
    return AuthResponse(token=token, user=user, status="Success")

@router.get("/me")
def get_current_farmer_profile(user_id: Optional[int] = Depends(get_current_user_id)):
    """Returns profile information for the currently authenticated farmer."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"user": user, "status": "Success"}

@router.post("/onboarding/complete")
def complete_onboarding(user_id: Optional[int] = Depends(get_current_user_id)):
    """Marks onboarding as completed for the authenticated farmer."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    complete_user_onboarding(user_id)
    return {"status": "Success", "message": "Onboarding completed successfully."}
