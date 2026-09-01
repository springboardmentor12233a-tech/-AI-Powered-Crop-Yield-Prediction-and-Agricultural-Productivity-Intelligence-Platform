"""
Database connection configuration for YieldSense AI.

Handles SQLAlchemy engine setup, session management, and database connectivity.
"""

import os
from typing import Generator
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

# Load environment variables from .env file (located in project root)
# Walk up directories to find .env
current_dir = Path(__file__).parent
for _ in range(5):  # Look up to 5 levels
    env_path = current_dir / ".env"
    if env_path.exists():
        load_dotenv(env_path)
        break
    current_dir = current_dir.parent
else:
    # Fallback to load_dotenv() if .env not found
    load_dotenv()

# Get database URL from environment (required)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL environment variable is not set. "
        "Please create a .env file in the project root with your PostgreSQL connection string. "
        "See .env.example for the required format."
    )

# Create SQLAlchemy engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verify connection is alive before using
    echo=False  # Set to True for SQL debugging
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Create declarative base for ORM models
Base = declarative_base()


async def get_db() -> Generator:
    """
    Dependency for FastAPI routes to get database session.
    
    Yields:
        Session: SQLAlchemy session for database operations
        
    Example:
        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
