"""
Health check routes for YieldSense AI Backend.

Provides endpoints for monitoring system and database health.
"""

from fastapi import APIRouter
from sqlalchemy.orm import Session
from sqlalchemy import text

from ..database import SessionLocal

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/db")
async def health_db():
    """
    Database health check endpoint.
    
    Tests PostgreSQL connectivity by executing a simple query.
    
    Returns:
        dict: Status of database connection
        
    Raises:
        HTTPException: If database connection fails
    """
    db = SessionLocal()
    try:
        # Execute a simple query to test connection
        result = db.execute(text("SELECT 1"))
        db.commit()
        
        return {
            "status": "ok",
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "error",
            "database": "disconnected",
            "error": str(type(e).__name__)
        }
    finally:
        db.close()
