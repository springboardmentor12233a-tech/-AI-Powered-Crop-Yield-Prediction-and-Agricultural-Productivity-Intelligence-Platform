"""
YieldSense AI — Agriculture AI Chatbot (Feature 2)
POST /chatbot/ask  — Answer general agricultural questions using Groq LLM
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
import sys, os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from auth_utils import get_current_user
from config import get_settings

router   = APIRouter(prefix="/chatbot", tags=["Agriculture AI Chatbot"])
settings = get_settings()

SYSTEM_PROMPT = """You are an expert agricultural assistant for the YieldSense AI platform.

Your role is to answer general agricultural questions clearly and helpfully. You may cover:
- Crop cultivation techniques
- Yield improvement strategies
- Soil types, soil pH and soil health
- Nitrogen, phosphorus and potassium (NPK) nutrients
- Rainfall, temperature and weather effects on crops
- Fertilizer usage and irrigation management
- Agricultural productivity and best practices
- General crop recommendations

Important rules:
1. Be concise, practical and farmer-friendly.
2. Use bullet points and numbered lists where appropriate.
3. Do NOT fabricate real-time weather, prices or market data.
4. When answers depend on local conditions, clearly say so and explain why.
5. Do NOT provide medical, financial or legal advice.
6. If a question is completely outside agriculture, politely say it is outside your scope.
7. Never pretend to know the user's specific farm data unless they tell you.
"""


class ChatMessage(BaseModel):
    role: str    # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []   # Recent conversation context (sent from frontend)


class ChatResponse(BaseModel):
    reply: str
    provider: str
    model: str


@router.post("/ask", response_model=ChatResponse)
async def ask_chatbot(payload: ChatRequest, current_user=Depends(get_current_user)):
    """
    Answer a general agricultural question using Groq LLM.
    Accepts recent conversation history for contextual responses.
    Groq API key is loaded server-side — never exposed to the frontend.
    """
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    api_key = settings.GROQ_API_KEY.strip() if settings.GROQ_API_KEY else ""

    if not api_key:
        return ChatResponse(
            reply=(
                "The Agriculture AI Assistant is currently unavailable because the Groq API key "
                "is not configured on the server. Please contact the administrator.\n\n"
                "In the meantime, you can use the Yield Prediction page and the AI Insights "
                "feature which may work with a cached response."
            ),
            provider="Groq",
            model="N/A",
        )

    try:
        from groq import Groq
        client = Groq(api_key=api_key)

        # Build messages list: system + recent history + new user message
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        # Add recent history (limit to last 10 turns to stay within token budget)
        for msg in payload.history[-10:]:
            if msg.role in ("user", "assistant"):
                messages.append({"role": msg.role, "content": msg.content})

        messages.append({"role": "user", "content": message})

        response = client.chat.completions.create(
            messages=messages,
            model="qwen/qwen3.8-27b",
            max_tokens=900,
            temperature=0.5,
        )

        reply = response.choices[0].message.content

        return ChatResponse(reply=reply, provider="Groq", model="qwen/qwen3.8-27b")

    except Exception as e:
        error_str = str(e)
        # Return a graceful degradation message — do not crash
        return ChatResponse(
            reply=(
                f"I'm temporarily unable to respond due to a connection issue. "
                f"Please try again in a moment.\n\nTechnical detail: {error_str}"
            ),
            provider="Groq",
            model="qwen/qwen3.8-27b",
        )
