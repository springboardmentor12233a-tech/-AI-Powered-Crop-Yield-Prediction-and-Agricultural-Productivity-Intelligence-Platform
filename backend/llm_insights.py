import os
import json
import logging
import urllib.request
import urllib.error
from fastapi import HTTPException
from pydantic import BaseModel, ValidationError
from dotenv import load_dotenv

load_dotenv()

class LLMInsightsResponse(BaseModel):
    summary: str
    yield_interpretation: str
    weather_insights: list[str]
    soil_insights: list[str]
    attention_points: list[str]
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
You are a highly cautious and analytical agricultural AI.
Your task is to interpret the provided structured Agricultural Report and output a human-readable JSON insights summary.

STRICT CONSTRAINTS:
1. Grounding: You MUST ONLY use the facts and numbers present in the provided JSON report.
2. No Causation: Distinguish correlation from causation. Use cautious language ("historically associated with", "the model predicts", "in this dataset", "may warrant attention").
3. Forbidden Language: DO NOT use words like "causes", "guarantees", "optimal", "ideal", "best soil", "best weather", "the crop prefers", or "increase X to increase yield".
4. No Inventions: Do not invent missing values, biological explanations, causal relationships, or generic farming prescriptions not found in the report data.

OUTPUT FORMAT:
You MUST output valid JSON exactly matching this structure (and nothing else):
{
    "summary": "A 1-2 sentence overall cautious summary of the prediction and context.",
    "yield_interpretation": "A cautious statement about the predicted yield.",
    "weather_insights": ["Insight 1", "Insight 2..."],
    "soil_insights": ["Insight 1", "Insight 2..."],
    "attention_points": ["Points that stand out as below average or negative correlations in the historical data..."],
    "limitations": ["A reminder that these are historical associations and do not establish causation."]
}
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
                        "yield_interpretation": {"type": "string"},
                        "weather_insights": {"type": "array", "items": {"type": "string"}},
                        "soil_insights": {"type": "array", "items": {"type": "string"}},
                        "attention_points": {"type": "array", "items": {"type": "string"}},
                        "limitations": {"type": "array", "items": {"type": "string"}}
                    },
                    "required": [
                        "summary", 
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
