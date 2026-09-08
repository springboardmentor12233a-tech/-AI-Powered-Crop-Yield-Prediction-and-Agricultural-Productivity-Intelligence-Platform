"""
Milestone 2 - Step 7: LLM Insights Layer (Groq)
====================================================
Takes a yield prediction + the soil/weather context for a field, sends it
to Groq's LLM API, and gets back a plain-language insight/recommendation.

This does NOT retrain or change the yield model - it's a separate layer
that turns numbers into a human-readable insight, using:
  - the predicted yield (from the saved XGBoost model, Step 5)
  - soil health flags for that field's crop type (Step 6)
  - weather context for that field's region/season (Step 6)

Uses Groq's OpenAI-compatible chat completions endpoint.
API key is loaded from backend/.env (never hardcoded, never committed).

By: Shivani
"""

import os
import requests
from dotenv import load_dotenv

# ---------------------------------------------------------------
# Config
# ---------------------------------------------------------------
ENV_PATH = "../backend/.env"
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "openai/gpt-oss-20b"  # Groq's current recommended fast/free-tier model

load_dotenv(ENV_PATH)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")


def build_prompt(field_data: dict) -> str:
    """Turns a field's prediction + context into a plain-language prompt."""
    return f"""You are an agricultural assistant. Based on the data below, give a short,
practical insight (3-4 sentences) for a farmer. Mention whether the predicted yield
looks typical, and call out any soil condition that stands out as a concern or strength.
Avoid technical jargon.

Crop type: {field_data['crop_type']}
Region: {field_data['region']}
Season: {field_data['season']}
Predicted yield: {field_data['predicted_yield']} t/ha

Soil conditions:
- Soil pH: {field_data['soil_ph']} ({field_data['soil_ph_flag']})
- Soil moisture: {field_data['soil_moisture']} ({field_data['soil_moisture_flag']})
- Nitrogen: {field_data['nitrogen_content']} ({field_data['nitrogen_content_flag']})
- Phosphorus: {field_data['phosphorus_content']} ({field_data['phosphorus_content_flag']})
- Potassium: {field_data['potassium_content']} ({field_data['potassium_content_flag']})

Weather context:
- Average temperature for this region/season: {field_data['avg_temperature']} C
- Average rainfall for this region/season: {field_data['total_rainfall']} mm
"""


def get_llm_insight(field_data: dict) -> str:
    if not GROQ_API_KEY:
        raise ValueError(
            "GROQ_API_KEY not found. Check that backend/.env exists and contains "
            "GROQ_API_KEY=your_key_here"
        )

    prompt = build_prompt(field_data)

    response = requests.post(
        GROQ_API_URL,
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": GROQ_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 200,
        },
    )

    if response.status_code != 200:
        raise RuntimeError(f"Groq API error {response.status_code}: {response.text}")

    data = response.json()
    return data["choices"][0]["message"]["content"].strip()


def main():
    # Example field - in the real app, this would come from the model's
    # prediction (Step 5) + soil/weather lookups (Step 6) for a chosen row.
    example_field = {
        "crop_type": "Wheat",
        "region": "North",
        "season": "Autumn",
        "predicted_yield": 5.4,
        "soil_ph": 5.09,
        "soil_ph_flag": "too low",
        "soil_moisture": 49.73,
        "soil_moisture_flag": "too high",
        "nitrogen_content": 2.32,
        "nitrogen_content_flag": "healthy",
        "phosphorus_content": 1.14,
        "phosphorus_content_flag": "healthy",
        "potassium_content": 1.45,
        "potassium_content_flag": "healthy",
        "avg_temperature": 22.40,
        "total_rainfall": 625.27,
    }

    print("Sending example field data to Groq...\n")
    insight = get_llm_insight(example_field)
    print("=" * 60)
    print("LLM INSIGHT")
    print("=" * 60)
    print(insight)


if __name__ == "__main__":
    main()