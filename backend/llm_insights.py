import os
import json
import logging
import urllib.request
import urllib.error
from fastapi import HTTPException
from pydantic import BaseModel, ValidationError
from dotenv import load_dotenv

load_dotenv()

class Alert(BaseModel):
    title: str
    reason: str
    action: str
    severity: str

class ConditionInsight(BaseModel):
    condition: str
    value: str
    interpretation: str
    recommendation: str

class LLMInsightsResponse(BaseModel):
    summary: str
    status: str
    yield_interpretation: str
    weather_insights: list[ConditionInsight]
    soil_insights: list[ConditionInsight]
    attention_points: list[Alert]
    limitations: list[str]

logger = logging.getLogger(__name__)

def generate_llm_insights(report_data: dict) -> dict:
    """
    Takes the structured Agricultural Report and uses an LLM to generate concise insights.
    Strictly constrained to avoid hallucination and causal claims.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        logger.error("GROQ_API_KEY environment variable is not set.")
        raise HTTPException(
            status_code=503,
            detail="LLM service is not configured. Please set the GROQ_API_KEY environment variable."
        )

    model_name = os.environ.get("GROQ_MODEL", "openai/gpt-oss-20b")
    base_url = os.environ.get("GROQ_BASE_URL", "https://api.groq.com/openai/v1").rstrip("/")
    url = f"{base_url}/chat/completions"

    system_prompt = """
You are a practical, farmer-facing agricultural AI.
Your task is to interpret the provided structured Agricultural Report and output a human-readable JSON insights summary.

STRICT CONSTRAINTS:
1. Grounding: You MUST ONLY use the facts and numbers present in the provided JSON report. Do not invent weather forecasts.
2. Practical & Clear: Provide actionable alerts and recommendations. Avoid statistical jargon like 'quartiles' or 'correlation coefficients'.
3. Output Format:
   - status: Must be one of "Needs Attention", "Moderate", or "Favorable".
   - weather_insights / soil_insights: Provide the condition (e.g., 'Rainfall', 'Soil Moisture'), its current value from the report (e.g., '120 mm'), a short interpretation, and a practical recommendation.
   - attention_points: High/Medium/Low severity alerts based on the report data. Include a title, reason, and action.
4. Limitations Field: You MUST ALWAYS return a "limitations" field containing a concise list of limitations (e.g., "Recommendations are based on historical model predictions and should not be treated as guaranteed outcomes.")

OUTPUT FORMAT:
You MUST output valid JSON exactly matching the provided schema.
"""

    payload = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Please analyze this report and generate the JSON insights:\n{json.dumps(report_data)}"}
        ],
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "agricultural_insights",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "summary": {"type": "string"},
                        "status": {"type": "string"},
                        "yield_interpretation": {"type": "string"},
                        "weather_insights": {
                            "type": "array", 
                            "items": {
                                "type": "object",
                                "properties": {
                                    "condition": {"type": "string"},
                                    "value": {"type": "string"},
                                    "interpretation": {"type": "string"},
                                    "recommendation": {"type": "string"}
                                },
                                "required": ["condition", "value", "interpretation", "recommendation"],
                                "additionalProperties": False
                            }
                        },
                        "soil_insights": {
                            "type": "array", 
                            "items": {
                                "type": "object",
                                "properties": {
                                    "condition": {"type": "string"},
                                    "value": {"type": "string"},
                                    "interpretation": {"type": "string"},
                                    "recommendation": {"type": "string"}
                                },
                                "required": ["condition", "value", "interpretation", "recommendation"],
                                "additionalProperties": False
                            }
                        },
                        "attention_points": {
                            "type": "array", 
                            "items": {
                                "type": "object",
                                "properties": {
                                    "title": {"type": "string"},
                                    "reason": {"type": "string"},
                                    "action": {"type": "string"},
                                    "severity": {"type": "string"}
                                },
                                "required": ["title", "reason", "action", "severity"],
                                "additionalProperties": False
                            }
                        },
                        "limitations": {"type": "array", "items": {"type": "string"}}
                    },
                    "required": [
                        "summary", 
                        "status",
                        "yield_interpretation", 
                        "weather_insights", 
                        "soil_insights", 
                        "attention_points", 
                        "limitations"
                    ],
                    "additionalProperties": False
                }
            }
        },
        "temperature": 0.0
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        "User-Agent": "YieldSenseAI/1.0"
    }

    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            response_body = response.read().decode("utf-8")
            response_data = json.loads(response_body)
            
            # Extract the content text from the standard OpenAI response format
            llm_content = response_data.get("choices", [{}])[0].get("message", {}).get("content", "{}")
            
            # Parse the JSON returned by the LLM
            insights_json = json.loads(llm_content)
            
            try:
                validated_insights = LLMInsightsResponse(**insights_json)
                if hasattr(validated_insights, "model_dump"):
                    return validated_insights.model_dump()
                return validated_insights.dict()
            except ValidationError as ve:
                logger.error(f"Invalid LLM response structure: {ve}")
                raise HTTPException(status_code=502, detail="LLM returned an invalid insights structure.")

    except urllib.error.HTTPError as e:
        error_msg = e.read().decode('utf-8')
        logger.error(f"LLM API HTTPError: {e.code} - {error_msg}")
        
        # Handle provider rejecting response_format
        if e.code == 400 and ("response_format" in error_msg or "json_object" in error_msg or "not supported" in error_msg):
            raise HTTPException(status_code=502, detail="The configured LLM provider does not support JSON mode / response_format.")
            
        raise HTTPException(status_code=502, detail="LLM API provider returned an error.")
    except urllib.error.URLError as e:
        logger.error(f"LLM API Connection Error: {str(e)}")
        raise HTTPException(status_code=502, detail="Failed to connect to the LLM API provider.")
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response as JSON: {str(e)}")
        raise HTTPException(status_code=502, detail="LLM returned an invalid JSON response.")
    except Exception as e:
        logger.error(f"Unexpected error during LLM insight generation: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while generating insights.")

def chat_with_llm(prompt: str) -> str:
    """
    Generic LLM chat interaction using the existing provider configuration.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        logger.error("GROQ_API_KEY environment variable is not set.")
        raise HTTPException(status_code=503, detail="LLM service is not configured.")

    model_name = os.environ.get("GROQ_MODEL", "openai/gpt-oss-20b")
    base_url = os.environ.get("GROQ_BASE_URL", "https://api.groq.com/openai/v1").rstrip("/")
    url = f"{base_url}/chat/completions"

    payload = {
        "model": model_name,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        "User-Agent": "YieldSenseAI/1.0"
    }

    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            response_body = response.read().decode("utf-8")
            response_data = json.loads(response_body)
            return response_data.get("choices", [{}])[0].get("message", {}).get("content", "Sorry, I couldn't generate a response.")
    except Exception as e:
        logger.error(f"Error communicating with LLM for chat: {e}")
        return "I am currently experiencing connection issues with my AI provider. Please try again later."
