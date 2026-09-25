from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from src.api.routers.auth import get_current_admin_user
from src.db.database import (
    get_admin_system_stats,
    get_all_farmers,
    set_user_active_status,
    get_user_by_id,
    get_user_farm,
    get_user_prediction_history,
    get_user_recommendation_history,
    get_llm_configs,
    update_llm_config,
    delete_user
)
from src.analytics.llm_provider import verify_llm_provider_connection

router = APIRouter(prefix="/api/admin", tags=["Admin Management & LLM Control"])

class LLMConfigRequest(BaseModel):
    provider: str = Field(..., description="gemini | openai | xai | groq")
    model_name: str = Field(..., description="Model identifier (e.g. gemini-1.5-flash, gpt-4o-mini)")
    api_key: Optional[str] = Field("", description="Provider API key (leave blank to retain existing key)")
    is_active: bool = Field(True, description="Whether to activate this provider")

class LLMTestRequest(BaseModel):
    provider: str
    model_name: str
    api_key: str

class ToggleStatusRequest(BaseModel):
    user_id: int
    is_active: int

@router.get("/stats")
def get_system_statistics(admin: Dict[str, Any] = Depends(get_current_admin_user)):
    """Fetches high-level metrics, active users, prediction counts, and recent activity (Admin only)."""
    stats = get_admin_system_stats()
    return {"stats": stats, "status": "Success"}

@router.get("/farmers")
def list_farmers(admin: Dict[str, Any] = Depends(get_current_admin_user)):
    """Returns list of registered farmers with their farm sizes, crop activities, and status."""
    farmers = get_all_farmers()
    return {"farmers": farmers, "status": "Success"}

@router.get("/farmers/{farmer_id}")
def get_farmer_details(farmer_id: int, admin: Dict[str, Any] = Depends(get_current_admin_user)):
    """Retrieves full farmer profile, farm details, prediction history, and crop recommendations."""
    farmer = get_user_by_id(farmer_id)
    if not farmer or farmer.get("role") != "farmer":
        raise HTTPException(status_code=404, detail="Farmer not found.")
        
    farm = get_user_farm(farmer_id)
    predictions = get_user_prediction_history(farmer_id)
    recommendations = get_user_recommendation_history(farmer_id)
    
    return {
        "farmer": farmer,
        "farm": farm,
        "predictions": predictions,
        "recommendations": recommendations,
        "status": "Success"
    }

@router.post("/farmers/toggle-status")
def toggle_farmer_status(req: ToggleStatusRequest, admin: Dict[str, Any] = Depends(get_current_admin_user)):
    """Enables or disables a farmer account."""
    success = set_user_active_status(req.user_id, req.is_active)
    return {"status": "Success", "message": f"Farmer account status set to {req.is_active}."}

@router.delete("/farmers/{farmer_id}")
def delete_farmer_account(farmer_id: int, admin: Dict[str, Any] = Depends(get_current_admin_user)):
    """Permanently deletes a farmer account and all associated data."""
    success = delete_user(farmer_id)
    return {"status": "Success", "message": f"Farmer account {farmer_id} permanently deleted."}

# ----------------------------------------------------------------------------
# LLM Provider Management Endpoints
# ----------------------------------------------------------------------------
@router.get("/llm/configs")
def list_llm_configs(admin: Dict[str, Any] = Depends(get_current_admin_user)):
    """Returns all available LLM providers with masked credentials (Admin only)."""
    configs = get_llm_configs()
    return {"configs": configs, "status": "Success"}

@router.post("/llm/config")
def save_llm_config(req: LLMConfigRequest, admin: Dict[str, Any] = Depends(get_current_admin_user)):
    """Updates model selection, API key, and active provider setting without modifying source code."""
    update_llm_config(
        provider=req.provider,
        model_name=req.model_name,
        api_key=req.api_key,
        is_active=req.is_active
    )
    return {"status": "Success", "message": f"LLM configuration for '{req.provider}' updated successfully."}

@router.post("/llm/test")
def test_llm_endpoint(req: LLMTestRequest, admin: Dict[str, Any] = Depends(get_current_admin_user)):
    """Tests live connection to an AI provider with the supplied API key."""
    result = verify_llm_provider_connection(req.provider, req.model_name, req.api_key)
    return result
