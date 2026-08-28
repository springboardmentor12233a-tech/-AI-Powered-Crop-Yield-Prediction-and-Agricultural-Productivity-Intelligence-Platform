import base64
import json
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    username: str
    password: str

class UserProfile(BaseModel):
    username: str
    role: str

# Mock Database of users
MOCK_USERS = {
    "farmer_user": {"password": "farmer_pass", "role": "farmer"},
    "agro_user": {"password": "agro_pass", "role": "agronomist"},
    "admin_user": {"password": "admin_pass", "role": "admin"}
}

def create_mock_token(username: str, role: str) -> str:
    """Creates a base64 encoded mock JWT token representing user payload."""
    payload = {"username": username, "role": role}
    payload_bytes = json.dumps(payload).encode('utf-8')
    token = base64.urlsafe_b64encode(payload_bytes).decode('utf-8')
    return token

def decode_mock_token(token: str) -> dict:
    """Decodes a base64 mock JWT token payload."""
    try:
        payload_bytes = base64.urlsafe_b64decode(token.encode('utf-8'))
        payload = json.loads(payload_bytes.decode('utf-8'))
        return payload
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization token format."
        )

def get_current_user(authorization: str = Header(..., description="Bearer token format")) -> UserProfile:
    """Dependency to extract user payload and role from auth header."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header scheme. Expected Bearer <token>."
        )
    token = authorization.split(" ")[1]
    payload = decode_mock_token(token)
    return UserProfile(username=payload["username"], role=payload["role"])

@router.post("/login")
def login(req: LoginRequest):
    username = req.username
    password = req.password
    
    if username not in MOCK_USERS or MOCK_USERS[username]["password"] != password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password credentials."
        )
        
    role = MOCK_USERS[username]["role"]
    token = create_mock_token(username, role)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": username,
        "role": role
    }

@router.get("/profile", response_model=UserProfile)
def get_profile(current_user: UserProfile = Depends(get_current_user)):
    return current_user
