from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

from src.api.routers.auth import get_current_user_id
from src.db.database import get_user_by_id, update_user_profile, get_user_farm, update_user_farm

router = APIRouter(prefix="/api/farmer", tags=["Farmer Profile & Farm Management"])

class ProfileUpdateRequest(BaseModel):
    full_name: str = Field(..., description="Farmer full name")
    phone: Optional[str] = Field("", description="Phone number")
    village: Optional[str] = Field("", description="Village name")
    district: Optional[str] = Field("", description="District name")
    state: Optional[str] = Field("", description="State name")

class FarmUpdateRequest(BaseModel):
    field_name: str = Field(..., description="Field or plot name e.g. North Field")
    land_size: float = Field(..., ge=0.0, description="Land area")
    land_unit: str = Field("Acres", description="Acres or Hectares")
    soil_type: str = Field("Loam", description="Sandy, Loam, Clay")
    irrigation_method: str = Field("Sprinkler", description="Sprinkler, Flood, Drip, Unknown")

@router.get("/profile")
def get_farmer_profile(user_id: Optional[int] = Depends(get_current_user_id)):
    """Fetches profile details for the authenticated farmer."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Farmer profile not found.")
    return {"profile": user, "status": "Success"}

@router.put("/profile")
def update_farmer_profile(req: ProfileUpdateRequest, user_id: Optional[int] = Depends(get_current_user_id)):
    """Updates profile details for the authenticated farmer."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required.")
    updated_user = update_user_profile(
        user_id=user_id,
        full_name=req.full_name,
        phone=req.phone or "",
        village=req.village or "",
        district=req.district or "",
        state=req.state or ""
    )
    return {"profile": updated_user, "status": "Success", "message": "Profile updated successfully."}

@router.get("/farm")
def get_farmer_farm_details(user_id: Optional[int] = Depends(get_current_user_id)):
    """Fetches farm details for the authenticated farmer."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required.")
    farm = get_user_farm(user_id)
    return {"farm": farm, "status": "Success"}

@router.put("/farm")
def update_farmer_farm_details(req: FarmUpdateRequest, user_id: Optional[int] = Depends(get_current_user_id)):
    """Updates farm details for the authenticated farmer."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required.")
    updated_farm = update_user_farm(
        user_id=user_id,
        field_name=req.field_name,
        land_size=req.land_size,
        land_unit=req.land_unit,
        soil_type=req.soil_type,
        irrigation_method=req.irrigation_method
    )
    return {"farm": updated_farm, "status": "Success", "message": "Farm details updated successfully."}
