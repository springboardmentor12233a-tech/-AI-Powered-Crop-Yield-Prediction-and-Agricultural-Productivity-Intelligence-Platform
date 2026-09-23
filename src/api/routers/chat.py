from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from src.api.routers.auth import get_current_user_id
from src.db.database import (
    get_user_by_id,
    get_user_farm,
    get_user_prediction_history,
    get_user_recommendation_history,
    save_chat_message,
    get_user_chat_history,
    clear_user_chat_history
)
from src.analytics.llm_provider import call_llm

router = APIRouter(prefix="/api/chat", tags=["Agricultural AI Assistant"])

class ChatMessageRequest(BaseModel):
    message: str = Field(..., description="Farmer question or inquiry")

class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: str

def generate_rule_based_chat_response(query: str, farmer: dict, farm: dict, latest_pred: Optional[dict], latest_rec: Optional[dict]) -> str:
    """
    Generates intelligent deterministic agronomic response if LLM is offline or not configured.
    Uses farmer's profile, farm characteristics, and latest predictions.
    """
    q = query.lower()
    
    # 1. Yield Questions
    if "yield" in q or "produce" in q or "harvest" in q or "ton" in q:
        if latest_pred:
            crop = latest_pred.get("crop", "your crop")
            yield_val = latest_pred.get("predicted_yield", 0.0)
            return (
                f"🌱 **Latest Yield Insight for {crop}**:\n"
                f"Your most recent model forecast estimated **{yield_val:.2f} ton/ha** on your *{latest_pred.get('field_name', 'farm plot')}*.\n\n"
                f"**Key optimization suggestions:**\n"
                f"1. Maintain balanced fertilization ({latest_pred.get('fertilizer_kg', 150):.0f} kg/ha applied) tailored to crop growth stages.\n"
                f"2. Ensure consistent moisture during flowering and grain fill via {latest_pred.get('irrigation', 'Sprinkler')} irrigation.\n"
                f"3. Rotate with legumes after harvest to rejuvenate soil nitrogen."
            )
        return (
            "To estimate your expected yield, head over to the **Yield Prediction** tab and enter your soil pH, rainfall, and management inputs for an instant ML forecast."
        )
        
    # 2. Crop Recommendation Questions
    if "recommend" in q or "which crop" in q or "suitable" in q or "what to plant" in q:
        if latest_rec:
            crop = latest_rec.get("recommended_crop", "Rice")
            conf = latest_rec.get("confidence_pct", "85%")
            return (
                f"🌾 **Crop Suitability Assessment**:\n"
                f"Based on your environmental conditions (pH: {latest_rec.get('soil_ph')}, Rainfall: {latest_rec.get('rainfall_mm')}mm), the top recommended crop is **{crop}** with **{conf} match confidence**.\n\n"
                f"**Recommended Action:** Ensure your soil texture is suitable and check local seed availability."
            )
        return (
            "You can find the best crops for your local weather and soil conditions in the **Crop Recommendation** tab."
        )
        
    # 3. Soil and Fertilizer Questions
    if "soil" in q or "fertilizer" in q or "ph" in q or "nitrogen" in q or "npk" in q:
        soil_type = farm.get("soil_type", "Loam")
        return (
            f"🧪 **Soil Management Guidance for {soil_type} Soil**:\n"
            f"- **Optimal pH Range:** 6.0 to 7.5 for maximum nutrient availability.\n"
            f"- **Organic Matter:** Incorporating well-rotted farmyard manure (FYM) improves water retention and root aeration.\n"
            f"- **Application Tip:** Split nitrogen application into basal and top-dressing phases to minimize leaching."
        )
        
    # 4. General Greeting or inquiry
    name = farmer.get("full_name", "Farmer") if farmer else "Farmer"
    return (
        f"Hello {name}! I am your **YieldSense AI Agricultural Assistant**.\n\n"
        f"I can help you with:\n"
        f"- Explaining your **yield forecasts** and **crop suitability** results\n"
        f"- **Soil health & fertilizer** management for your {farm.get('land_size', 4.5)} {farm.get('land_unit', 'Acres')}\n"
        f"- **Pest risk mitigation** and crop rotation strategies\n\n"
        f"*How can I assist your farming operations today?*"
    )

@router.get("/history")
def get_chat_history(user_id: Optional[int] = Depends(get_current_user_id)):
    """Retrieves conversation history for the authenticated farmer."""
    if not user_id:
        return {"messages": []}
    messages = get_user_chat_history(user_id)
    return {"messages": messages, "status": "Success"}

@router.post("/message")
def send_chat_message(req: ChatMessageRequest, user_id: Optional[int] = Depends(get_current_user_id)):
    """
    Sends a query to the contextual Agricultural AI Assistant.
    Grounds response on farmer profile, farm characteristics, and latest prediction/recommendation history.
    """
    farmer = get_user_by_id(user_id) if user_id else None
    farm = get_user_farm(user_id) if user_id else {"field_name": "Main Plot", "land_size": 4.5, "land_unit": "Acres", "soil_type": "Loam", "irrigation_method": "Sprinkler"}
    
    predictions = get_user_prediction_history(user_id) if user_id else []
    recommendations = get_user_recommendation_history(user_id) if user_id else []
    
    latest_pred = predictions[0] if predictions else None
    latest_rec = recommendations[0] if recommendations else None
    
    # Save user's question if logged in
    if user_id:
        save_chat_message(user_id, "user", req.message)
        
    # Build agronomic context prompt for LLM
    context_str = f"""
FARMER PROFILE & FARM DATA:
- Farmer Name: {farmer.get('full_name', 'Farmer') if farmer else 'Guest Farmer'}
- Location: {farmer.get('village', '')} {farmer.get('district', '')} {farmer.get('state', '')}
- Farm Size: {farm.get('land_size', 4.5)} {farm.get('land_unit', 'Acres')}
- Soil Type: {farm.get('soil_type', 'Loam')}
- Irrigation: {farm.get('irrigation_method', 'Sprinkler')}
"""
    if latest_pred:
        context_str += f"""
LATEST YIELD PREDICTION:
- Crop: {latest_pred.get('crop')}
- Forecasted Yield: {latest_pred.get('predicted_yield'):.2f} ton/ha
- Rainfall: {latest_pred.get('rainfall_mm')} mm
- Temperature: {latest_pred.get('temperature_c')} °C
- Fertilizer: {latest_pred.get('fertilizer_kg')} kg/ha
"""
    if latest_rec:
        context_str += f"""
LATEST CROP RECOMMENDATION:
- Top Recommended Crop: {latest_rec.get('recommended_crop')} ({latest_rec.get('confidence_pct')})
"""

    system_prompt = f"""
You are the YieldSense AI Agricultural Assistant, an expert agronomist providing decision support to farmers.
Use the farmer's context below to answer their questions accurately and politely.
{context_str}

GUIDELINES:
- Always be encouraging, practical, and clear.
- Distinguish between model predictions, data insights, and general agronomic guidelines.
- Never invent numerical predictions.
- Include a brief reminder that advice is decision support.
"""

    ai_reply = call_llm(req.message, system_instruction=system_prompt)
    
    if not ai_reply or len(ai_reply.strip()) < 10:
        ai_reply = generate_rule_based_chat_response(req.message, farmer, farm, latest_pred, latest_rec)
        
    # Save assistant response if logged in
    bot_msg = None
    if user_id:
        bot_msg = save_chat_message(user_id, "assistant", ai_reply)
        
    return {
        "reply": ai_reply,
        "message": bot_msg,
        "status": "Success"
    }

@router.delete("/history")
def clear_chat(user_id: Optional[int] = Depends(get_current_user_id)):
    """Clears conversation history for the authenticated farmer."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required.")
    clear_user_chat_history(user_id)
    return {"status": "Success", "message": "Conversation history cleared."}
