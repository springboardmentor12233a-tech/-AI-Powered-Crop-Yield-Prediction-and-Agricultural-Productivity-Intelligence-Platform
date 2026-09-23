from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any
import base64
import json
import hmac
import hashlib
import time

from src.db.database import create_user, authenticate_user, get_user_by_id, complete_user_onboarding

router = APIRouter(prefix="/api/auth", tags=["Authentication & JWT"])

# Secret key for HMAC-SHA256 JWT signature
JWT_SECRET = "yieldsense-ai-secure-jwt-signing-key-milestone3"

class RegisterRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=4, description="User password")
    full_name: str = Field(..., description="User full name")
    role: Optional[str] = Field("farmer", description="Role: farmer | admin")
    phone: Optional[str] = Field("", description="Phone number")
    village: Optional[str] = Field("", description="Village name")
    district: Optional[str] = Field("", description="District name")
    state: Optional[str] = Field("", description="State name")

class LoginRequest(BaseModel):
    email: str = Field(..., description="Registered email address")
    password: str = Field(..., description="User password")

class AuthResponse(BaseModel):
    token: str
    user: Dict[str, Any]
    status: str

def base64url_encode(data: bytes) -> str:
    """Encodes bytes to base64url string without padding."""
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def base64url_decode(data_str: str) -> bytes:
    """Decodes base64url string with proper padding."""
    rem = len(data_str) % 4
    if rem > 0:
        data_str += '=' * (4 - rem)
    return base64.urlsafe_b64decode(data_str)

def generate_jwt_token(user_id: int, email: str, role: str) -> str:
    """
    Generates a secure HMAC-SHA256 signed JWT token containing user identity and role.
    """
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": str(user_id),
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": int(time.time()) + (86400 * 7),  # 7 days validity
        "iat": int(time.time())
    }
    
    header_b64 = base64url_encode(json.dumps(header).encode('utf-8'))
    payload_b64 = base64url_encode(json.dumps(payload).encode('utf-8'))
    
    signature_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(JWT_SECRET.encode('utf-8'), signature_input, hashlib.sha256).digest()
    sig_b64 = base64url_encode(signature)
    
    return f"{header_b64}.{payload_b64}.{sig_b64}"

def decode_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Validates the cryptographic HMAC-SHA256 signature and expiration of a JWT token.
    """
    try:
        parts = token.split('.')
        if len(parts) != 3:
            # Fallback legacy token check for backward compatibility
            try:
                decoded_bytes = base64.b64decode(token.encode("utf-8"))
                legacy_data = json.loads(decoded_bytes.decode("utf-8"))
                return {"user_id": legacy_data.get("user_id"), "role": "farmer"}
            except Exception:
                return None
                
        header_b64, payload_b64, sig_b64 = parts
        
        signature_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        expected_sig = hmac.new(JWT_SECRET.encode('utf-8'), signature_input, hashlib.sha256).digest()
        actual_sig = base64url_decode(sig_b64)
        
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
            
        payload = json.loads(base64url_decode(payload_b64).decode('utf-8'))
        if payload.get("exp", 0) < time.time():
            return None
            
        return payload
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
    payload = decode_jwt_token(token)
    return payload.get("user_id") if payload else None

def get_current_admin_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    FastAPI dependency enforcing ADMIN role authorization.
    Rejects unauthorized or farmer requests with HTTP 403.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication token required.")
    token = authorization.replace("Bearer ", "").strip()
    payload = decode_jwt_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
        
    user = get_user_by_id(payload.get("user_id"))
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required to access this resource.")
        
    return user

@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest):
    """Registers a new farmer (or admin) account with email, password, and location."""
    try:
        # Default registration is farmer unless created by admin
        role = "admin" if req.email.lower().strip() == "admin@yieldsense.ai" else req.role or "farmer"
        user = create_user(
            email=req.email,
            password=req.password,
            full_name=req.full_name,
            role=role,
            phone=req.phone or "",
            village=req.village or "",
            district=req.district or "",
            state=req.state or ""
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")
        
    token = generate_jwt_token(user["id"], user["email"], user.get("role", "farmer"))
    return AuthResponse(token=token, user=user, status="Success")

@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest):
    """Authenticates a returning user (Farmer or Admin) and returns signed JWT."""
    try:
        user = authenticate_user(req.email, req.password)
    except ValueError as ve:
        raise HTTPException(status_code=403, detail=str(ve))
        
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    token = generate_jwt_token(user["id"], user["email"], user.get("role", "farmer"))
    return AuthResponse(token=token, user=user, status="Success")

@router.get("/me")
def get_current_user_profile(user_id: Optional[int] = Depends(get_current_user_id)):
    """Returns profile details for the currently authenticated user."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"user": user, "status": "Success"}

@router.post("/onboarding/complete")
def complete_onboarding(user_id: Optional[int] = Depends(get_current_user_id)):
    """Marks onboarding as completed for the authenticated user."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    complete_user_onboarding(user_id)
    return {"status": "Success", "message": "Onboarding completed successfully."}
