import json
import os
from dotenv import load_dotenv
from urllib.request import Request, urlopen

load_dotenv()

SYSTEM_PROMPT = """You are an agricultural decision-support assistant. Analyze only supplied data. Do not calculate or change yield. Do not invent missing weather or soil values. State uncertainty when data is unavailable. Give practical crop, irrigation, soil, resource optimization, and weather precaution advice. Avoid dangerous chemical or pesticide dosage instructions. Return JSON with exactly: summary, yield_outlook (Low|Moderate|Good|Excellent), weather_risk (Low|Medium|High), soil_status (Poor|Fair|Good|Excellent|Insufficient Data), key_risks (array), recommendations (array)."""


def generate_recommendations(context):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured on the backend.")
    payload = json.dumps({
        "model": os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(context, default=str)},
        ],
    }).encode("utf-8")
    request = Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=payload,
        headers={"Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
    "User-Agent": "YieldSense-AI/1.0"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=45) as response:
            data = json.loads(response.read().decode("utf-8"))
    except Exception as error:
        if hasattr(error, "read"):
            print("GROQ ERROR:", error.read().decode("utf-8"))
        raise
    content = data.get("choices", [{}])[0].get("message", {}).get("content")
    if not content:
        raise RuntimeError("Groq returned no recommendation content.")
    return json.loads(content.replace("```json", "").replace("```", "").strip())
