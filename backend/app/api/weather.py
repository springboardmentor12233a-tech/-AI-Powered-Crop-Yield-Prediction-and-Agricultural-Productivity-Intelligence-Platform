from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from backend.app.services.weather_service import weather_service

router = APIRouter(prefix="/api/weather", tags=["Weather Analytics"])

@router.get("/analysis")
def get_weather_analysis(region: Optional[str] = Query(None, description="Region name to filter weather analytics")):
    try:
        data = weather_service.get_weather_analytics(region=region)
        return data
    except FileNotFoundError as fnfe:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(fnfe))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Weather query failed: {str(e)}")
