"""
Authentication business logic service
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..models import User, Role
from ..schemas import UserCreate, UserResponse
from ..core.security import hash_password, verify_password


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
