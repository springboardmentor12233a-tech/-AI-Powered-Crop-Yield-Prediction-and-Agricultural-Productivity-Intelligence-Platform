"""
Farmer chatbot endpoint.

POST /chat  (JWT required, farmers only)
Body: { "message": str, "history": [{role, content}, ...], "last_prediction": {...} | null }
Returns: { "reply": str }

The bot is grounded on the user's own data (saved fields, recent predictions,
the prediction they just made, and this dataset's healthy soil ranges) so it
answers about THEIR farm instead of giving generic advice.
"""

import json
import requests
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from auth import role_required
from models import PredictionHistory, FarmProfile
from predict_service import get_all_soil_ranges, GROQ_API_KEY, GROQ_API_URL, GROQ_MODEL

chat_bp = Blueprint("chat", __name__)

MAX_MESSAGE_CHARS = 1000
MAX_HISTORY_MESSAGES = 10

SYSTEM_PROMPT = """You are AgriVantage Assistant, a farming helper inside the AgriVantage crop yield prediction app.

Rules:
- Only help with farming, crops, soil, weather, and using this app. Politely decline anything else.
- Use ONLY the CONTEXT block for numbers about this user's fields and predictions. If something is not in CONTEXT, say you don't have it. Never invent numbers, field names, crops, or units. The app shows soil values without units, so never add units like g/kg.
- CONTEXT has three separate things. "prediction_just_made" is the most recent prediction with the exact inputs the farmer entered: when they say "my latest prediction" or "this prediction", use it. "recent_predictions" is their history, newest first. Newer entries include the inputs and soil_flags they entered; older entries may not, so say the details were not saved for those. "saved_fields" are profiles they saved and are NOT the same as a prediction. Do not mix them up. If prediction_just_made is null, say there is no recent prediction to look at and suggest running one on the Predict Yield page.
- How risk works: risk is NOT a weather or yield forecast. It only counts how many of the 5 soil values (pH, moisture, nitrogen, phosphorus, potassium) fall outside the healthy range for that crop: 0 = Low, 1 = Medium, 2 or more = High. Explain risk using the soil flags in the context.
- Healthy ranges are per crop (not per region) and come from this app's dataset (25th-75th percentile of above-average-yield fields). They are not universal agronomy standards - mention this when advising about them.
- The yield prediction is a machine-learning estimate, not a guarantee.
- Reply in the language the user writes in.
- Write plain text: short sentences, no tables, no markdown headings, no bold. Simple hyphen lists are fine. Keep replies under about 120 words unless asked for detail.
- Give simple, practical advice. For exact fertilizer or pesticide quantities, suggest a local agricultural officer.
- App pages: Predict Yield (/predict), Soil Reference (/soil-reference), History (/history), Farm Profile (/profile) where users save their fields.
"""


def build_context(user_id: int, last_prediction) -> str:
    profiles = FarmProfile.query.filter_by(user_id=user_id).order_by(FarmProfile.id).all()
    recent = (
        PredictionHistory.query.filter_by(user_id=user_id)
        .order_by(PredictionHistory.created_at.desc())
        .limit(10)
        .all()
    )

    # Slim view of each past prediction: keep the inputs and soil flags (so the
    # bot can discuss any of them) but drop the long AI insight text.
    recent_list = []
    for r in recent:
        d = r.to_dict()
        details = d.pop("details", None) or {}
        d["inputs"] = details.get("inputs")
        d["soil_flags"] = details.get("soil_flags")
        recent_list.append(d)

    context = {
        "saved_fields": [p.to_dict() for p in profiles],
        "recent_predictions": recent_list,
        "healthy_soil_ranges_by_crop": get_all_soil_ranges(),
        "prediction_just_made": last_prediction if isinstance(last_prediction, dict) else None,
    }
    return json.dumps(context, default=str)


def clean_history(history) -> list:
    """Keep only well-formed user/assistant turns, trimmed in size and count."""
    if not isinstance(history, list):
        return []
    cleaned = []
    for m in history[-MAX_HISTORY_MESSAGES:]:
        if not isinstance(m, dict):
            continue
        role, content = m.get("role"), m.get("content")
        if role in ("user", "assistant") and isinstance(content, str) and content.strip():
            cleaned.append({"role": role, "content": content[:MAX_MESSAGE_CHARS]})
    return cleaned


@chat_bp.route("/chat", methods=["POST"])
@jwt_required()
@role_required("farmer")
def chat():
    if not GROQ_API_KEY:
        return jsonify({"error": "Chat is not configured on the server."}), 503

    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"error": "message is required"}), 400
    message = message[:MAX_MESSAGE_CHARS]

    user_id = int(get_jwt_identity())
    context = build_context(user_id, data.get("last_prediction"))

    messages = [
        {"role": "system", "content": f"{SYSTEM_PROMPT}\nCONTEXT (JSON):\n{context}"},
        *clean_history(data.get("history")),
        {"role": "user", "content": message},
    ]

    try:
        response = requests.post(
            GROQ_API_URL,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            # gpt-oss-20b is a reasoning model: part of max_tokens is spent on
            # internal reasoning, so keep this generous to avoid cut-off replies.
            json={"model": GROQ_MODEL, "messages": messages, "reasoning_effort": "low", "max_tokens": 1500},
            timeout=30,
        )
    except requests.RequestException:
        return jsonify({"error": "Could not reach the AI service. Try again."}), 502

    if response.status_code != 200:
        return jsonify({"error": "The AI service returned an error. Try again."}), 502

    reply = response.json()["choices"][0]["message"].get("content", "").strip()
    if not reply:
        reply = "Sorry, I couldn't come up with an answer. Could you rephrase that?"

    return jsonify({"reply": reply}), 200