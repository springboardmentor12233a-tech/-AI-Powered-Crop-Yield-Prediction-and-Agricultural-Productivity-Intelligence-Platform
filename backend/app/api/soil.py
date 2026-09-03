from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from backend.app.services.soil_service import soil_service

router = APIRouter(prefix="/api/soil", tags=["Soil Analytics"])

@router.get("/assessment")
def get_soil_assessment(crop_type: Optional[str] = Query(None, description="Crop type to filter soil suitability")):
    try:
        data = soil_service.get_soil_assessment(crop_type=crop_type)
        return data
    except FileNotFoundError as fnfe:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(fnfe))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Soil query failed: {str(e)}")
