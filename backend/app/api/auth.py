"""
Authentication API routes
"""
from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..models import User
from ..schemas import (
    UserCreate,
    UserResponse,
    Token,
)
from ..services import AuthService
from ..core.security import (
    create_access_token,
    get_current_user_from_token,
    oauth2_scheme,
    decode_token,
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
)
from ..database.connection import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


# ============================================================================
# DEPENDENCIES FOR CURRENT USER AND RBAC
# ============================================================================

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user.
    
    Extracts user ID from JWT token and retrieves fresh user data from database.
    This ensures we always have current role/is_active status.
    
    Args:
        token: JWT token from Authorization header
        db: Database session
        
    Returns:
        User object
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    payload = decode_token(token)
    user_id: int = payload.get("sub")
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    
    user = AuthService.get_user_by_id(db, user_id)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    
    return user


def require_role(required_role: str):
    """
    Factory to create a dependency that requires a specific role.
    
    Args:
        required_role: Role name (e.g., "admin", "user")
        
    Returns:
        Dependency function
    """
    async def check_role(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.role_name != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This operation requires '{required_role}' role",
            )
        return current_user
    
    return check_role


# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
) -> UserResponse:
    """
    Register a new user.
    
    - Validates input data
    - Checks for duplicate email
    - Hashes password using Argon2
    - Assigns default 'user' role
    - Returns newly created user
    
    Args:
        user_data: Registration request with name, email, password
        db: Database session
        
    Returns:
        UserResponse with created user details
        
    Raises:
        HTTPException 409: If email already exists
        HTTPException 400: If validation fails
    """
    try:
        db_user = AuthService.create_user(db, user_data)
        return UserResponse.model_validate(db_user)
    except ValueError as e:
        if "already registered" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e),
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )


@router.post("/login", response_model=Token)
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db)
) -> Token:
    """
    User login.
    
    - Accepts OAuth2-compatible username/password form (email as username)
    - Validates credentials
    - Checks user is active
    - Returns JWT access token
    
    Args:
        form_data: OAuth2PasswordRequestForm with username (email) and password
        db: Database session
        
    Returns:
        Token with access_token and token_type
        
    Raises:
        HTTPException 401: If credentials invalid or user inactive
    """
    # Note: form_data.username contains the email
    user = AuthService.authenticate_user(db, form_data.username, form_data.password)
    
    if not user:
        # Generic message to avoid email enumeration
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create JWT token with user ID as subject
    access_token_expires = timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token)


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user)
) -> UserResponse:
    """
    Get current authenticated user information.
    
    Protected endpoint. Returns safe user information without password_hash.
    
    Args:
        current_user: Authenticated user from token
        
    Returns:
        UserResponse with current user details
        
    Raises:
        HTTPException 401: If token missing or invalid
        HTTPException 403: If user inactive
    """
    return UserResponse.model_validate(current_user)


# ============================================================================
# ROLE-BASED ACCESS CONTROL TEST ENDPOINTS
# ============================================================================

@router.get("/user-test")
def user_test_endpoint(
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    Test endpoint accessible by any authenticated user.
    
    Verifies that:
    - User is authenticated
    - Token is valid
    - User is active
    
    Args:
        current_user: Authenticated user from token
        
    Returns:
        Test response message
    """
    return {
        "message": "User test successful",
        "user_id": current_user.id,
        "user_email": current_user.email,
        "role": current_user.role.role_name
    }


@router.get("/admin-test")
def admin_test_endpoint(
    current_user: User = Depends(require_role("admin"))
) -> dict:
    """
    Test endpoint accessible only by admin users.
    
    Verifies RBAC enforcement - returns 403 if user is not admin.
    
    Args:
        current_user: Admin user from token
        
    Returns:
        Test response message
        
    Raises:
        HTTPException 403: If user is not admin
    """
    return {
        "message": "Admin test successful",
        "user_id": current_user.id,
        "user_email": current_user.email,
        "role": current_user.role.role_name
    }
