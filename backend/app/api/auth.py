from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from backend.app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
    get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# In-memory user database for Milestone 1 demonstration
DEMO_USERS = {
    "admin": {
        "username": "admin",
        "email": "admin@yieldsense.ai",
        "hashed_password": get_password_hash("admin123"),
        "role": "Admin",
        "full_name": "System Administrator"
    },
    "farmer": {
        "username": "farmer",
        "email": "farmer@yieldsense.ai",
        "hashed_password": get_password_hash("farmer123"),
        "role": "Farmer",
        "full_name": "Ramesh Kumar (Farmer)"
    },
    "agronomist": {
        "username": "agronomist",
        "email": "agronomist@yieldsense.ai",
        "hashed_password": get_password_hash("agro123"),
        "role": "Agronomist",
        "full_name": "Dr. Sarah Jenkins (Agronomist)"
    }
}

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "Farmer"
    full_name: str = ""

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str
    email: str

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest):
    user = DEMO_USERS.get(request.username.lower())
    if not user or not verify_password(request.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    token = create_access_token({
        "sub": user["username"],
        "role": user["role"],
        "email": user["email"]
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user["username"],
        "role": user["role"],
        "email": user["email"]
    }

@router.post("/register", response_model=TokenResponse)
def register(request: RegisterRequest):
    if request.username.lower() in DEMO_USERS:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed = get_password_hash(request.password)
    new_user = {
        "username": request.username,
        "email": request.email,
        "hashed_password": hashed,
        "role": request.role,
        "full_name": request.full_name or request.username
    }
    DEMO_USERS[request.username.lower()] = new_user

    token = create_access_token({
        "sub": new_user["username"],
        "role": new_user["role"],
        "email": new_user["email"]
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "username": new_user["username"],
        "role": new_user["role"],
        "email": new_user["email"]
    }

@router.get("/me")
def read_current_user_profile(current_user: dict = Depends(get_current_user)):
    return {
        "status": "authenticated",
        "user": current_user
    }
