import os
import json
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional

class LLMService:
    """
    External LLM Service supporting Groq API, Gemini API, and an offline Agronomic AI Fallback Engine.
    Provides real-time yield insights, agricultural risk alerts, and crop management recommendations.
    """
    def __init__(self):
        self._load_env_file()
        self.groq_api_key = os.getenv("GROQ_API_KEY", "").strip()
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()

    def _load_env_file(self):
        env_path = os.path.join(os.getcwd(), ".env")
        if os.path.exists(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            os.environ[k.strip()] = v.strip()
            except Exception as e:
                print(f"[LLMService] Could not read .env file: {e}")

    def generate_agricultural_insights(self, payload: Dict[str, Any], prediction_result: Dict[str, Any]) -> Dict[str, Any]:
        # Try Groq API first if key available
        if self.groq_api_key:
            try:
                res = self._call_groq_api(payload, prediction_result)
                if res:
                    return res
            except Exception as e:
                print(f"[LLMService] Groq API call failed: {e}. Falling back to Agronomic Engine...")

        # Try Gemini API second if key available
        if self.gemini_api_key:
            try:
                res = self._call_gemini_api(payload, prediction_result)
                if res:
                    return res
            except Exception as e:
                print(f"[LLMService] Gemini API call failed: {e}. Falling back to Agronomic Engine...")

        # Fallback to deterministic Agronomic AI Expert Engine
        return self._generate_expert_rule_insights(payload, prediction_result)

    def _call_groq_api(self, payload: Dict[str, Any], prediction_result: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        url = "https://api.groq.com/openai/v1/chat/completions"
        prompt = self._build_prompt(payload, prediction_result)

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.groq_api_key}",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) YieldSenseAI/1.0"
        }

        body = {
            "model": "groq/compound-mini",
            "messages": [
                {"role": "system", "content": "You are YieldSense AI, an expert agricultural scientist assistant. Respond strictly in JSON format with keys: ai_insights, risk_alerts, recommendations."},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.3
        }

        req = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            content = res_data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            parsed["llm_provider"] = "Groq LLM (groq/compound-mini)"
            return parsed

    def _call_gemini_api(self, payload: Dict[str, Any], prediction_result: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_api_key}"
        prompt = self._build_prompt(payload, prediction_result)

        headers = {"Content-Type": "application/json"}
        body = {
            "contents": [{
                "parts": [{"text": prompt + "\nRespond strictly in valid JSON with keys: ai_insights, risk_alerts, recommendations."}]
            }]
        }

        req = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            content_text = res_data["candidates"][0]["content"]["parts"][0]["text"]
            
            if "```json" in content_text:
                content_text = content_text.split("```json")[1].split("```")[0].strip()
            elif "```" in content_text:
                content_text = content_text.split("```")[1].split("```")[0].strip()
                
            parsed = json.loads(content_text)
            parsed["llm_provider"] = "Google Gemini AI (gemini-1.5-flash)"
            return parsed

    def _build_prompt(self, payload: Dict[str, Any], prediction_result: Dict[str, Any]) -> str:
        return f"""
Analyze the following agricultural telemetry data and yield forecast:
- Crop Type: {payload.get('crop_type')}
- Region: {payload.get('region')}
- Predicted Yield: {prediction_result.get('predicted_yield_kg_ha')} kg/ha (Rating: {prediction_result.get('productivity_rating')})
- Risk Rating: {prediction_result.get('risk_rating')}
- Soil pH: {payload.get('soil_pH')}, Soil Moisture: {payload.get('soil_moisture_%')}%
- Temperature: {payload.get('temperature_C')}°C, Rainfall: {payload.get('rainfall_mm')} mm
- Humidity: {payload.get('humidity_%')}%, Sunlight: {payload.get('sunlight_hours')} hrs
- Irrigation: {payload.get('irrigation_type')}, Fertilizer: {payload.get('fertilizer_type')}
- Disease Status: {payload.get('crop_disease_status')}
- NDVI Index: {payload.get('NDVI_index')}

Provide a JSON object with:
"ai_insights": String summary of yield driver performance,
"risk_alerts": List of strings detailing active crop risks,
"recommendations": List of strings detailing actionable agronomic steps.
"""

    def _generate_expert_rule_insights(self, payload: Dict[str, Any], prediction_result: Dict[str, Any]) -> Dict[str, Any]:
        crop = str(payload.get("crop_type", "Crop"))
        region = str(payload.get("region", "Selected Region"))
        yield_val = float(prediction_result.get("predicted_yield_kg_ha", 0.0))
        prod_rating = str(prediction_result.get("productivity_rating", "Medium"))
        
        disease = str(payload.get("crop_disease_status", "None"))
        ph = float(payload.get("soil_pH", 6.5))
        temp = float(payload.get("temperature_C", 25.0))
        moisture = float(payload.get("soil_moisture_%", 40.0))
        ndvi = float(payload.get("NDVI_index", 0.6))

        risk_alerts: List[str] = []
        recommendations: List[str] = []

        if disease.lower() not in ["none", "unknown"]:
            risk_alerts.append(f"CRITICAL DISEASE ALERT: {disease} infection detected in {crop} field. Immediate treatment required.")
            recommendations.append(f"Apply targeted fungicide/bactericide for {disease} and reduce canopy moisture retention.")
        else:
            recommendations.append(f"Maintain routine bio-fungicide preventative spraying for {crop}.")

        if temp > 32.0:
            risk_alerts.append(f"HEAT STRESS RISK: High ambient temperature ({temp}°C) exceeds optimal growth threshold.")
            recommendations.append("Increase drip irrigation frequency during early morning to mitigate heat stress.")
        elif temp < 15.0:
            risk_alerts.append(f"COLD STRESS RISK: Sub-optimal temperature ({temp}°C) slowing metabolic rates.")
            recommendations.append("Apply organic mulching to protect root zone soil temperature.")

        if ph < 5.8:
            risk_alerts.append(f"SOIL ACIDITY WARNING: Soil pH of {ph} reduces nutrient bioavailability.")
            recommendations.append("Apply agricultural lime (calcium carbonate) at 500 kg/ha to raise soil pH toward 6.5.")
        elif ph > 7.5:
            risk_alerts.append(f"SOIL ALKALINITY WARNING: Soil pH of {ph} restricts micronutrient uptake (iron/zinc).")
            recommendations.append("Incorporate elemental sulfur or gypsum to neutralize alkaline soil condition.")

        if moisture < 30.0:
            risk_alerts.append(f"MOISTURE DEFICIT: Soil moisture level ({moisture}%) is below optimal root absorption threshold.")
            recommendations.append(f"Schedule additional {payload.get('irrigation_type', 'irrigation')} cycles to elevate soil moisture above 45%.")

        if ndvi > 0.65:
            summary_insight = f"{crop} cultivation in {region} shows strong canopy vigor (NDVI: {ndvi}) with estimated yield of {yield_val} kg/ha ({prod_rating} Productivity)."
        else:
            summary_insight = f"{crop} cultivation in {region} exhibits moderate vegetative vigor (NDVI: {ndvi}) with predicted yield of {yield_val} kg/ha."

        if not risk_alerts:
            risk_alerts.append("No critical agronomic risk flags detected. Environmental parameters remain within optimal bounds.")

        return {
            "ai_insights": summary_insight,
            "risk_alerts": risk_alerts,
            "recommendations": recommendations,
            "llm_provider": "Agronomic AI Expert Engine (Offline Engine)"
        }

llm_service = LLMService()
