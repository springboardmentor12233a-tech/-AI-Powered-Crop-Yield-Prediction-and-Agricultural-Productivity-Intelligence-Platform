import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
from src.db.database import get_active_llm_config

# Standard fallback agricultural explanation templates if LLM is offline or unconfigured
DETERMINISTIC_REPORT_PROMPT = """
### Executive Summary
Based on the machine learning analysis for {crop} in {region}, the forecasted productivity is {predicted_yield:.2f} ton/ha. 
Environmental factors (Rainfall: {rainfall_mm}mm, Temperature: {temperature_c}°C, Soil pH: {soil_ph}) and soil texture ({soil_type}) were evaluated.

### Key Agronomic Findings
- **Soil & Nutrient Dynamics**: Soil pH of {soil_ph:.1f} in {soil_type} soil provides specific nutrient availability patterns. Maintain balanced N-P-K applications to sustain soil biology.
- **Water Management**: {irrigation} irrigation alongside {rainfall_mm}mm rainfall provides baseline moisture. Monitor moisture stages during critical flowering.
- **Risk Assessment**: The current agricultural risk rating is **{overall_risk}**. {risk_summary}

### Actionable Farming Recommendations
1. **Soil Conditioning**: Tailor organic matter additions to balance soil texture and maintain microbial resilience.
2. **Crop Rotation Strategy**: Plan rotation following {previous_crop} to break insect/pest cycles and optimize nitrogen utilization.
3. **Pest & Disease Scouting**: Regular scouting is recommended, especially under high humidity conditions.

*Disclaimer: AI decision-support guidance is intended for informational and advisory planning. Actual yield depends on local field micro-climates and weather variations.*
"""

def verify_llm_provider_connection(provider: str, model_name: str, api_key: str) -> Dict[str, Any]:
    """
    Tests direct connectivity to the selected LLM provider without saving.
    Returns status: 'success' | 'error' and diagnostic message.
    """
    if not api_key or not api_key.strip():
        return {"status": "error", "message": "API key cannot be empty."}
        
    prov = provider.lower().strip()
    try:
        if prov == "gemini":
            # Test Google Gemini generateContent API
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key.strip()}"
            payload = {
                "contents": [{"parts": [{"text": "Hello, respond with 'YieldSense AI Connected' only."}]}]
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return {"status": "success", "message": f"Successfully connected to Google Gemini ({model_name}). Response: {text.strip()}"}
                
        elif prov == "openai":
            # Test OpenAI chat completion API
            url = "https://api.openai.com/v1/chat/completions"
            payload = {
                "model": model_name,
                "messages": [{"role": "user", "content": "Hello, respond with 'YieldSense AI Connected' only."}],
                "max_tokens": 15
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key.strip()}"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                text = data["choices"][0]["message"]["content"]
                return {"status": "success", "message": f"Successfully connected to OpenAI ({model_name}). Response: {text.strip()}"}
                
        elif prov == "xai":
            # Test xAI / Grok chat completion API
            url = "https://api.x.ai/v1/chat/completions"
            payload = {
                "model": model_name,
                "messages": [{"role": "user", "content": "Hello, respond with 'YieldSense AI Connected' only."}],
                "max_tokens": 15
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key.strip()}"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                text = data["choices"][0]["message"]["content"]
                return {"status": "success", "message": f"Successfully connected to xAI Grok ({model_name}). Response: {text.strip()}"}
        else:
            return {"status": "error", "message": f"Unsupported provider '{provider}'."}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        return {"status": "error", "message": f"HTTP Error {e.code}: {err_body[:200]}"}
    except Exception as exc:
        return {"status": "error", "message": f"Connection error: {str(exc)}"}

def call_llm(prompt: str, system_instruction: Optional[str] = None) -> Optional[str]:
    """
    Executes a dynamic completion request to the active LLM provider.
    Returns generated string, or None if provider is inactive/failed.
    """
    config = get_active_llm_config()
    if not config or not config.get("api_key"):
        return None
        
    provider = config.get("provider", "").lower().strip()
    model_name = config.get("model_name", "").strip()
    api_key = config.get("api_key", "").strip()
    
    try:
        if provider == "gemini":
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            parts = []
            if system_instruction:
                parts.append({"text": f"System Instruction: {system_instruction}\n\n"})
            parts.append({"text": prompt})
            
            payload = {"contents": [{"parts": parts}]}
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data["candidates"][0]["content"]["parts"][0]["text"]
                
        elif provider in ["openai", "xai"]:
            url = "https://api.openai.com/v1/chat/completions" if provider == "openai" else "https://api.x.ai/v1/chat/completions"
            messages = []
            if system_instruction:
                messages.append({"role": "system", "content": system_instruction})
            messages.append({"role": "user", "content": prompt})
            
            payload = {
                "model": model_name,
                "messages": messages,
                "temperature": 0.4
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"LLM Call failed ({provider}): {e}")
        return None

def generate_agricultural_llm_report(
    crop: str,
    region: str,
    soil_type: str,
    soil_ph: float,
    rainfall_mm: float,
    temperature_c: float,
    humidity_pct: float,
    fertilizer_kg: float,
    pesticides_kg: float,
    irrigation: str,
    previous_crop: str,
    predicted_yield: float,
    risk_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Generates an agricultural intelligence report explanation using the active LLM,
    or falls back to the deterministic agronomic template if LLM is unavailable.
    """
    overall_risk = risk_data.get("overall_risk", "Moderate")
    risk_summary = risk_data.get("summary", "")
    
    prompt = f"""
You are an expert Agricultural Agronomist assisting a farmer.
Use ONLY the verified data provided below to generate a human-readable agricultural report.
Do NOT invent new numerical predictions or change the predicted yield.

VERIFIED DATA:
- Crop: {crop}
- Region: {region}
- Soil Type: {soil_type}
- Soil pH: {soil_ph}
- Rainfall: {rainfall_mm} mm
- Temperature: {temperature_c} °C
- Humidity: {humidity_pct} %
- Fertilizer Used: {fertilizer_kg} kg/ha
- Pesticides: {pesticides_kg} kg/ha
- Irrigation Method: {irrigation}
- Previous Crop in Rotation: {previous_crop}
- ML Forecasted Yield: {predicted_yield:.2f} ton/ha
- Evaluated Risk Level: {overall_risk} ({risk_summary})

INSTRUCTIONS:
1. Provide an Executive Summary explaining what the {predicted_yield:.2f} ton/ha forecast means.
2. Explain the key soil, weather, and management factors.
3. Detail the {overall_risk} risk assessment and specific mitigation steps.
4. Give 3 actionable farming suggestions.
5. Conclude with an agricultural decision-support disclaimer.
Keep the formatting clean with clear markdown headings and bullet points.
"""
    system_instruction = "You are YieldSense AI, a professional agronomist. Base your answers strictly on supplied data. Never hallucinate data."
    
    llm_output = call_llm(prompt, system_instruction)
    
    if llm_output and len(llm_output.strip()) > 50:
        return {
            "source": "AI LLM Generated (Active Provider)",
            "content": llm_output.strip(),
            "is_llm": True
        }
    else:
        # Fallback to deterministic template
        fallback_text = DETERMINISTIC_REPORT_PROMPT.format(
            crop=crop,
            region=region,
            soil_type=soil_type,
            soil_ph=soil_ph,
            rainfall_mm=rainfall_mm,
            temperature_c=temperature_c,
            humidity_pct=humidity_pct,
            fertilizer_kg=fertilizer_kg,
            irrigation=irrigation,
            previous_crop=previous_crop,
            predicted_yield=predicted_yield,
            overall_risk=overall_risk,
            risk_summary=risk_summary
        )
        return {
            "source": "Deterministic Agronomic Engine (Rule-Based Fallback)",
            "content": fallback_text.strip(),
            "is_llm": False
        }
