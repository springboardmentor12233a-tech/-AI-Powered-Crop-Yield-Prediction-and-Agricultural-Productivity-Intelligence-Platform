"""
Authentication business logic service
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..models import User, Role, PasswordResetToken
from ..schemas import UserCreate, UserResponse
from ..core.security import hash_password, verify_password
import secrets
import hashlib
from datetime import datetime, timedelta


class AuthService:
    """Service for authentication operations"""

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User | None:
        """
        Find a user by email address.
        
        Args:
            db: Database session
            email: User email
            
        Returns:
            User object or None if not found
        """
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def user_email_exists(db: Session, email: str) -> bool:
        """
        Check if a user with the given email already exists.
        
        Args:
            db: Database session
            email: Email to check
            
        Returns:
            True if email exists, False otherwise
        """
        return db.query(User).filter(User.email == email).first() is not None

    @staticmethod
    def get_default_role(db: Session) -> Role:
        """
        Get the default 'user' role.
        
        Args:
            db: Database session
            
        Returns:
            Role object for 'user' role
            
        Raises:
            ValueError: If 'user' role doesn't exist
        """
        role = db.query(Role).filter(Role.role_name == "user").first()
        if not role:
            raise ValueError("Default 'user' role not found in database")
        return role

    @staticmethod
    def create_user(db: Session, user_data: UserCreate) -> User:
        """
        Create a new user with the default 'user' role.
        
        Args:
            db: Database session
            user_data: User registration data
            
        Returns:
            Created User object
            
        Raises:
            ValueError: If email already exists or default role not found
            IntegrityError: If database constraint is violated
        """
        # Check if email already exists
        if AuthService.user_email_exists(db, user_data.email):
            raise ValueError(f"Email {user_data.email} already registered")

        # Get default role
        default_role = AuthService.get_default_role(db)

        # Create new user
        hashed_password = hash_password(user_data.password)
        db_user = User(
            name=user_data.name,
            email=user_data.email,
            password_hash=hashed_password,
            role_id=default_role.id,
            is_active=True
        )

        try:
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            return db_user
        except IntegrityError as e:
            db.rollback()
            raise ValueError(f"Failed to create user: {str(e)}")

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> User | None:
        """
        Authenticate a user by email and password.
        
        Args:
            db: Database session
            email: User email
            password: Plain text password
            
        Returns:
            User object if authentication succeeds, None otherwise
        """
        user = AuthService.get_user_by_email(db, email)
        
        if not user:
            return None
        
        if not verify_password(password, user.password_hash):
            return None
        
        if not user.is_active:
            return None
        
        return user

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> User | None:
        """
        Get a user by ID.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            User object or None if not found
        """
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_all_users(db: Session):
        """
        Get all users in the system.
        
        Args:
            db: Database session
            
        Returns:
            List of User objects
        """
        return db.query(User).all()

    @staticmethod
    def create_password_reset_token(db: Session, email: str) -> str | None:
        """
        Generate a secure reset token for a user if they exist.
        """
        user = AuthService.get_user_by_email(db, email)
        if not user:
            return None

        # Invalidate previous unused tokens for this user
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False
        ).update({"used": True})
        
        # Generate raw token
        raw_token = secrets.token_urlsafe(32)
        
        # Hash token for storage
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        
        expires_at = datetime.utcnow() + timedelta(minutes=15)
        
        reset_token = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        db.add(reset_token)
        db.commit()
        
        return raw_token

    @staticmethod
    def reset_password_with_token(db: Session, raw_token: str, new_password: str) -> bool:
        """
        Validate token and reset the user's password.
        """
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        
        # Find valid token
        reset_token = db.query(PasswordResetToken).filter(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used == False,
            PasswordResetToken.expires_at > datetime.utcnow()
        ).first()
        
        if not reset_token:
            return False
            
        user = reset_token.user
        
        # Update password
        user.password_hash = hash_password(new_password)
        
        # Mark all tokens for this user as used
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False
        ).update({"used": True})
        
        db.commit()
        return True
