"""
Vision diagnostics (Crop Doctor).

POST /diagnose   (JWT, farmers only, rate limited)
Form-data: image (file), crop_type (optional), notes (optional), lang (optional, e.g. "hi")
Returns:   { "diagnosis": { is_plant, crop_guess, status, summary,
                            issues: [{name, confidence, evidence}],
                            causes, treatment, prevention, see_expert } }

The photo is resized and sent to a Groq vision-capable model. This is an AI
estimate from one photo, not a lab diagnosis, and the prompt tells the model
not to give exact pesticide doses.

Needs:  pip install pillow
Env:    GROQ_VISION_MODEL (optional). Vision model names change over time, so if
        you get an error about the model, pick a current vision-capable model
        from the Groq console and put its id in backend/.env.
"""

import os
import io
import base64
import requests
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from auth import role_required
from extensions import limiter
from predict_service import GROQ_API_KEY, GROQ_API_URL, _extract_json

vision_bp = Blueprint("vision", __name__)

# Groq retires vision models from time to time, so several are tried in order.
# GROQ_VISION_MODEL (if set in .env) is tried first. The one that works is
# remembered until the server restarts.
VISION_MODELS = []
for _m in [
    os.getenv("GROQ_VISION_MODEL"),
    "qwen/qwen3.6-27b",
    "qwen/qwen3.8-27b",
    "meta-llama/llama-4-scout-17b-16e-instruct",
]:
    if _m and _m not in VISION_MODELS:
        VISION_MODELS.append(_m)
_working_model = None

LANG_NAMES = {
    "en": "English", "hi": "Hindi", "kn": "Kannada",
    "te": "Telugu", "ta": "Tamil", "ml": "Malayalam", "mr": "Marathi",
}

MAX_UPLOAD_BYTES = 8 * 1024 * 1024
MAX_NOTE_CHARS = 300


def _prepare_image(raw: bytes) -> str:
    """Validates the upload is a real image, shrinks it, returns base64 JPEG."""
    from PIL import Image

    img = Image.open(io.BytesIO(raw))
    img.load()
    img = img.convert("RGB")
    img.thumbnail((1024, 1024))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode("ascii")


def _as_list(value):
    return [str(v).strip() for v in value if str(v).strip()] if isinstance(value, list) else []


def _clean(parsed: dict) -> dict:
    status = parsed.get("status")
    if status not in ("healthy", "problem", "unclear"):
        status = "unclear"

    issues = []
    for item in parsed.get("issues") or []:
        if not isinstance(item, dict):
            continue
        confidence = item.get("confidence")
        if confidence not in ("low", "medium", "high"):
            confidence = "low"
        issues.append({
            "name": str(item.get("name", "")).strip(),
            "confidence": confidence,
            "evidence": str(item.get("evidence", "")).strip(),
        })

    return {
        "is_plant": bool(parsed.get("is_plant", True)),
        "crop_guess": str(parsed.get("crop_guess", "")).strip(),
        "status": status,
        "summary": str(parsed.get("summary", "")).strip(),
        "issues": [i for i in issues if i["name"]],
        "causes": _as_list(parsed.get("causes")),
        "treatment": _as_list(parsed.get("treatment")),
        "prevention": _as_list(parsed.get("prevention")),
        "see_expert": bool(parsed.get("see_expert", False)),
    }


@vision_bp.route("/diagnose", methods=["POST"])
@limiter.limit("10 per minute")
@jwt_required()
@role_required("farmer")
def diagnose():
    if not GROQ_API_KEY:
        return jsonify({"error": "Crop Doctor is not configured on the server."}), 503

    file = request.files.get("image")
    if not file:
        return jsonify({"error": "Please upload a photo."}), 400

    raw = file.read()
    if not raw:
        return jsonify({"error": "The uploaded file is empty."}), 400
    if len(raw) > MAX_UPLOAD_BYTES:
        return jsonify({"error": "The photo is too large (max 8 MB)."}), 400

    try:
        image_b64 = _prepare_image(raw)
    except Exception:
        return jsonify({"error": "That file is not a valid image (use JPG, PNG or WEBP)."}), 400

    crop = (request.form.get("crop_type") or "").strip()[:50] or "unknown"
    notes = (request.form.get("notes") or "").strip()[:MAX_NOTE_CHARS] or "none"
    language = LANG_NAMES.get(request.form.get("lang", "en"), "English")

    prompt = f"""You are a plant health assistant helping a small farmer. Look at the photo of a crop.

The farmer says the crop is: {crop}
The farmer's note: {notes}
Write the text values in {language}.

Reply with ONLY a JSON object (no markdown, no code fences) with exactly these keys:
- "is_plant": true or false (false if the photo does not show a plant or crop)
- "crop_guess": the crop you think it is, or "" if unsure
- "status": one of "healthy", "problem", "unclear"
- "summary": 1-2 plain sentences on what you see
- "issues": array of objects {{"name": ..., "confidence": "low" | "medium" | "high", "evidence": what in the photo shows this}}. Empty array if healthy.
- "causes": array of short strings with likely causes
- "treatment": array of short, practical steps the farmer can take now (low-cost and organic or cultural steps first)
- "prevention": array of short tips to avoid it next time
- "see_expert": true if the problem looks serious or you are not sure

Rules:
- Base your answer only on what is visible. If the photo is blurry, too far away or not a plant, set "status" to "unclear" and say what photo would help (for example a close-up of the affected leaf).
- Never claim certainty. Several problems can look alike (for example nutrient shortage and disease).
- Do not give exact pesticide or fungicide doses or brand names. Tell the farmer to ask a local agricultural officer for the right product and dose.
- Keep the key names, and the values of "status" and "confidence", in English exactly as listed above."""

    global _working_model
    messages = [{
        "role": "user",
        "content": [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}},
        ],
    }]

    resp = None
    for model in ([_working_model] if _working_model else VISION_MODELS):
        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.2,
            # Reasoning tokens (Qwen) count toward max_tokens, so keep it generous.
            "max_tokens": 2500,
        }
        if "qwen" in model:
            payload["reasoning_effort"] = "none"  # no thinking text, just the JSON answer

        try:
            resp = requests.post(
                GROQ_API_URL,
                headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                json=payload,
                timeout=60,
            )
        except requests.RequestException:
            return jsonify({"error": "Could not reach the AI service. Try again."}), 502

        if resp.status_code == 200:
            _working_model = model
            break

        # The real reason (retired model, rate limit...) shows in the Flask terminal.
        print(f"[diagnose] model {model} -> Groq returned {resp.status_code}: {resp.text[:300]}")
        if resp.status_code not in (400, 404):
            break  # not a model problem (rate limit, bad key...), so don't try others

    if resp is None or resp.status_code != 200:
        _working_model = None
        return jsonify({"error": "The image analysis service returned an error. Try again."}), 502

    try:
        raw_reply = resp.json()["choices"][0]["message"]["content"]
    except (KeyError, IndexError, ValueError):
        return jsonify({"error": "Unexpected reply from the AI service."}), 502

    parsed = _extract_json(raw_reply)
    if parsed is None:
        return jsonify({"error": "Could not read the analysis. Please try another photo."}), 502

    return jsonify({"diagnosis": _clean(parsed)}), 200