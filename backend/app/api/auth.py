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
    UserUpdate,
    AdminUserUpdate,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    RoleResponse
)
from ..models import User, Role
from ..services import AuthService
import os
import smtplib
from email.message import EmailMessage
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
        
        # Notify admins
        from backend.app.services.notification import notify_admins
        notify_admins(db, "New User Registered", f"A new user ({db_user.email}) has registered.", type="info")
        
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
    
    # Create JWT token with user ID and role
    access_token_expires = timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.role_name},
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


@router.patch("/me", response_model=UserResponse)
def update_current_user_info(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> UserResponse:
    """
    Update current authenticated user information.
    
    Protected endpoint. Allows user to edit non-sensitive details like name.
    
    Args:
        user_data: The update schema containing the new name.
        current_user: Authenticated user from token
        db: Database session
        
    Returns:
        UserResponse with updated user details
    """
    current_user.name = user_data.name
    db.commit()
    db.refresh(current_user)
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


@router.get("/admin/users", response_model=list[UserResponse])
def get_all_users(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
) -> list[UserResponse]:
    """
    Get all users (Admin only).
    
    Args:
        current_user: Admin user from token
        db: Database session
        
    Returns:
        List of UserResponse
    """
    return AuthService.get_all_users(db)


@router.get("/admin/roles", response_model=list[RoleResponse])
def get_all_roles(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
) -> list[RoleResponse]:
    """
    Get all roles (Admin only).
    """
    return db.query(Role).all()

@router.patch("/admin/users/{user_id}", response_model=UserResponse)
def update_user_by_admin(
    user_id: int,
    user_data: AdminUserUpdate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
) -> UserResponse:
    """
    Update a user's details and role (Admin only).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_data.name is not None:
        user.name = user_data.name
    if user_data.email is not None:
        # Check if email is already taken by another user
        if user_data.email != user.email and AuthService.user_email_exists(db, user_data.email):
            raise HTTPException(status_code=409, detail="Email already registered")
        user.email = user_data.email
    if user_data.role_id is not None:
        role = db.query(Role).filter(Role.id == user_data.role_id).first()
        if not role:
            raise HTTPException(status_code=400, detail="Invalid role ID")
        user.role_id = user_data.role_id
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
        
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)

@router.delete("/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_by_admin(
    user_id: int,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Delete a user (Admin only).
    """
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.delete(user)
    db.commit()
    return None

def send_reset_email(email: str, token: str) -> bool:
    """Send reset password email using SMTP"""
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM_EMAIL")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

    if not all([smtp_server, smtp_port, smtp_user, smtp_password, smtp_from]):
        print(f"SMTP not configured. Would have sent token {token} to {email}")
        return False

    msg = EmailMessage()
    msg['Subject'] = 'Password Reset - YieldSense AI'
    msg['From'] = smtp_from
    msg['To'] = email
    
    reset_url = f"{frontend_url}/reset-password?token={token}"
    
    msg.set_content(f"You requested a password reset. Click the following link to reset your password:\n\n{reset_url}\n\nIf you did not request this, please ignore this email.")

    try:
        with smtplib.SMTP(smtp_server, int(smtp_port), timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Request a password reset link.
    """
    raw_token = AuthService.create_password_reset_token(db, request.email)
    
    if raw_token:
        # Send email
        success = send_reset_email(request.email, raw_token)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Email service is not configured or currently unavailable."
            )
        
    return {"message": "If an account exists for this email, a password reset link has been sent."}


@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Reset password using a token.
    """
    success = AuthService.reset_password_with_token(db, request.token, request.new_password)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
        
    return {"message": "Password has been successfully reset."}

