"""
Milestone 2 - Step 8: Combined Prediction Service
======================================================
Combines everything built in Steps 5-7 into ONE function that the Flask
API (and eventually the frontend) can call:
  1. Load the saved XGBoost model (Step 5)
  2. Preprocess a single new field's input the same way training data was
     preprocessed (Step 2) - so the model sees data in the same shape
  3. Predict yield
  4. Flag soil conditions against this dataset's derived healthy ranges (Step 6)
  5. Calculate a simple risk level from how many soil flags are off (Milestone 3)
  6. Send everything to Groq for a plain-language insight (Step 7)
  7. Return one combined dictionary - this is what the frontend will receive

By: Shivani
"""

import os
import re
import json
import pandas as pd
import joblib
import requests
from dotenv import load_dotenv

# ---------------------------------------------------------------
# Config - paths are relative to backend/, since this file lives there
# ---------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "xgboost_yield_model.pkl")
TRAIN_PROCESSED_PATH = os.path.join(BASE_DIR, "..", "datasets", "cleaned-crop-yield-production-dataset", "train_processed.csv")
SOIL_RANGES_PATH = os.path.join(BASE_DIR, "..", "datasets", "cleaned-crop-yield-production-dataset", "soil_healthy_ranges.csv")
WEATHER_SUMMARY_PATH = os.path.join(BASE_DIR, "..", "datasets", "cleaned-crop-yield-production-dataset", "weather_summary.csv")

TARGET = "yield_tpha"
CATEGORICAL_COLS = ["crop_type", "region", "season"]
SOIL_COLS = ["soil_ph", "soil_moisture", "nitrogen_content", "phosphorus_content", "potassium_content"]

load_dotenv(os.path.join(BASE_DIR, ".env"))
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "openai/gpt-oss-20b"

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"

# Our dataset's regions are abstract labels, not real coordinates, so each
# one is mapped to a representative real city for live weather lookup.
REGION_TO_CITY = {
    "North": "Delhi,IN",
    "South": "Bengaluru,IN",
    "East": "Kolkata,IN",
    "West": "Mumbai,IN",
    "Central": "Nagpur,IN",
}


def get_live_temperature(region: str) -> dict:
    """
    Fetches the current real-world temperature for the city that
    represents this dataset region. Returns None values if the region
    is unmapped or the API call fails, so the frontend can fall back
    to manual entry gracefully.
    """
    city = REGION_TO_CITY.get(region)
    if not city or not OPENWEATHER_API_KEY:
        return {"live_temperature": None, "city_used": city, "error": "Unavailable"}

    try:
        response = requests.get(
            OPENWEATHER_URL,
            params={"q": city, "appid": OPENWEATHER_API_KEY, "units": "metric"},
            timeout=5,
        )
        if response.status_code != 200:
            return {"live_temperature": None, "city_used": city, "error": response.text}

        data = response.json()
        return {
            "live_temperature": round(data["main"]["temp"], 1),
            "city_used": city,
            "error": None,
        }
    except requests.RequestException as e:
        return {"live_temperature": None, "city_used": city, "error": str(e)}

# ---------------------------------------------------------------
# Loaded once at import time, reused for every prediction
# ---------------------------------------------------------------
_model = joblib.load(MODEL_PATH)
_train_columns = [c for c in pd.read_csv(TRAIN_PROCESSED_PATH, nrows=0).columns if c not in [TARGET, "id"]]
_soil_ranges = pd.read_csv(SOIL_RANGES_PATH).set_index("crop_type")
_weather_summary = pd.read_csv(WEATHER_SUMMARY_PATH)


def preprocess_input(field: dict) -> pd.DataFrame:
    """Turns a single field's raw input into the same shape the model was
    trained on: month extracted, engineered features added, one-hot encoded,
    aligned to the exact training columns."""
    df = pd.DataFrame([field])

    df["harvest_date"] = pd.to_datetime(df["harvest_date"])
    df["harvest_month"] = df["harvest_date"].dt.month
    df = df.drop(columns=["harvest_date"], errors="ignore")
    df = df.drop(columns=["field_id"], errors="ignore")

    df["rainfall_to_temp_ratio"] = df["total_rainfall"] / df["avg_temperature"]
    df["fertilizer_nitrogen_interaction"] = df["fertilizer_amount"] * df["nitrogen_content"]

    df = pd.get_dummies(df, columns=CATEGORICAL_COLS)
    df = df.reindex(columns=_train_columns, fill_value=0)
    return df


def flag_soil(field: dict) -> dict:
    """Flags each soil value as healthy/too low/too high for this crop type."""
    crop = field["crop_type"]
    flags = {}
    for col in SOIL_COLS:
        low = _soil_ranges.loc[crop, f"{col}_low"]
        high = _soil_ranges.loc[crop, f"{col}_high"]
        value = field[col]
        if value < low:
            flags[col] = "too low"
        elif value > high:
            flags[col] = "too high"
        else:
            flags[col] = "healthy"
    return flags


def get_soil_ranges(field: dict) -> dict:
    """
    Returns the numeric healthy-range low/high for each soil parameter,
    for this field's crop type. Used by the frontend to draw the
    actual-vs-healthy-range chart (Milestone 3).
    """
    crop = field["crop_type"]
    ranges = {}
    for col in SOIL_COLS:
        ranges[col] = {
            "low": float(_soil_ranges.loc[crop, f"{col}_low"]),
            "high": float(_soil_ranges.loc[crop, f"{col}_high"]),
        }
    return ranges


def get_all_soil_ranges() -> list:
    """
    Returns healthy soil ranges for every crop type, for the frontend's
    standalone Soil Reference page (independent of any single prediction).
    """
    result = []
    for crop in _soil_ranges.index:
        row = _soil_ranges.loc[crop]
        result.append({
            "crop_type": crop,
            "avg_yield": float(row["avg_yield"]),
            "ranges": {
                col: {
                    "low": float(row[f"{col}_low"]),
                    "high": float(row[f"{col}_high"]),
                }
                for col in SOIL_COLS
            },
        })
    return result


def calculate_risk_level(soil_flags: dict) -> str:
    """
    Milestone 3 - Risk Assessment.
    Counts how many soil parameters fall outside the healthy range
    ('too low' or 'too high') and maps that count to a simple risk label:
      0 flagged  -> Low
      1 flagged  -> Medium
      2+ flagged -> High
    """
    flagged_count = sum(1 for flag in soil_flags.values() if flag != "healthy")

    if flagged_count == 0:
        return "Low"
    elif flagged_count == 1:
        return "Medium"
    else:
        return "High"


def get_weather_context(field: dict) -> dict:
    """Looks up the typical avg_temperature/total_rainfall for this
    region+season, to give the input's own weather some context."""
    match = _weather_summary[
        (_weather_summary["region"] == field["region"]) &
        (_weather_summary["season"] == field["season"])
    ]
    if match.empty:
        return {"typical_avg_temperature": None, "typical_total_rainfall": None}
    return {
        "typical_avg_temperature": float(match["avg_temperature"].iloc[0]),
        "typical_total_rainfall": float(match["total_rainfall"].iloc[0]),
    }


def _extract_json(raw: str):
    """Pulls the first JSON object out of the model's reply. Returns None
    if it is missing, cut off, or malformed."""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.startswith("json"):
            raw = raw[4:]
    start, end = raw.find("{"), raw.rfind("}")
    if start == -1 or end <= start:
        return None
    try:
        parsed = json.loads(raw[start:end + 1])
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        return None


def get_llm_insight(field: dict, predicted_yield: float, soil_flags: dict, weather_context: dict, typical_yield: float) -> dict:
    """
    Returns a structured recommendation instead of one paragraph:
    { summary, strengths: [...], concerns: [...], actions: [...] }
    Falls back to a summary-only shape if the model doesn't return valid
    JSON, so the frontend never breaks.
    """
    fallback = lambda text: {"summary": text, "strengths": [], "concerns": [], "actions": []}

    if not GROQ_API_KEY:
        return fallback("LLM insight unavailable: GROQ_API_KEY not configured.")

    prompt = f"""You are an agricultural assistant. Based on the data below, respond with
ONLY a valid JSON object (no markdown, no code fences, no extra text) with exactly these keys:

- "summary": one sentence stating whether the predicted yield is above, below, or in line
  with the typical average for this crop (use the exact numbers given - do not guess).
- "strengths": an array of short strings (each under 15 words) naming what looks healthy
  or favorable. Empty array if none.
- "concerns": an array of short strings naming soil or weather conditions that stand out
  as a problem. Empty array if none.
- "actions": an array of short, practical, concrete recommendations for the farmer.
  Empty array if none needed.

Avoid technical jargon. Keep every string plain and farmer-friendly.

Crop type: {field['crop_type']}
Region: {field['region']}
Season: {field['season']}
Predicted yield: {round(predicted_yield, 2)} t/ha
Typical average yield for {field['crop_type']}: {round(typical_yield, 2)} t/ha

Soil conditions:
- Soil pH: {field['soil_ph']} ({soil_flags['soil_ph']})
- Soil moisture: {field['soil_moisture']} ({soil_flags['soil_moisture']})
- Nitrogen: {field['nitrogen_content']} ({soil_flags['nitrogen_content']})
- Phosphorus: {field['phosphorus_content']} ({soil_flags['phosphorus_content']})
- Potassium: {field['potassium_content']} ({soil_flags['potassium_content']})

Weather:
- This field's temperature: {field['avg_temperature']} C, rainfall: {field['total_rainfall']} mm
- Typical for this region/season: {weather_context['typical_avg_temperature']} C, {weather_context['typical_total_rainfall']} mm
"""

    response = requests.post(
        GROQ_API_URL,
        headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
        json={
            "model": GROQ_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            # gpt-oss-20b is a reasoning model: reasoning tokens count toward
            # max_tokens, so 600 was cutting the JSON off mid-way.
            "reasoning_effort": "low",
            "max_tokens": 2000,
        },
        timeout=30,
    )
    if response.status_code != 200:
        return fallback(f"LLM insight unavailable: {response.text}")

    raw = response.json()["choices"][0]["message"]["content"].strip()

    parsed = _extract_json(raw)
    if parsed is None:
        # Reply was cut off or malformed: salvage the summary instead of
        # showing raw JSON to the farmer.
        m = re.search(r'"summary"\s*:\s*"(.*?)"', raw, re.DOTALL)
        return fallback(m.group(1) if m else "Insight could not be generated. Please try again.")

    return {
        "summary": parsed.get("summary", ""),
        "strengths": parsed.get("strengths", []),
        "concerns": parsed.get("concerns", []),
        "actions": parsed.get("actions", []),
    }


def predict_and_generate_insight(field: dict) -> dict:
    """Main entry point: takes a raw field input dict, returns the full
    combined result the frontend will display."""
    X = preprocess_input(field)
    predicted_yield = float(_model.predict(X)[0])

    soil_flags = flag_soil(field)
    soil_ranges = get_soil_ranges(field)
    risk_level = calculate_risk_level(soil_flags)
    weather_context = get_weather_context(field)

    # Milestone 3: typical yield for this crop, from soil_healthy_ranges.csv's
    # avg_yield column (Step 6) - used by both the LLM prompt and the
    # frontend's yield comparison chart
    typical_yield_for_crop = float(_soil_ranges.loc[field["crop_type"], "avg_yield"])

    insight = get_llm_insight(field, predicted_yield, soil_flags, weather_context, typical_yield_for_crop)

    return {
        "predicted_yield": round(predicted_yield, 2),
        "typical_yield_for_crop": round(typical_yield_for_crop, 2),
        "soil_flags": soil_flags,
        "soil_ranges": soil_ranges,
        "risk_level": risk_level,
        "weather_context": weather_context,
        "llm_insight": insight,
    }


if __name__ == "__main__":
    # Quick manual test with an example field
    example_field = {
        "crop_type": "Wheat",
        "region": "North",
        "season": "Autumn",
        "harvest_date": "2021-03-09",
        "soil_ph": 5.09,
        "soil_moisture": 49.73,
        "avg_temperature": 22.40,
        "total_rainfall": 625.27,
        "fertilizer_amount": 150.0,
        "pesticide_usage": 8.0,
        "sunlight_hours": 2000.0,
        "nitrogen_content": 2.32,
        "phosphorus_content": 1.14,
        "potassium_content": 1.45,
        "irrigation_frequency": 3,
    }
    result = predict_and_generate_insight(example_field)
    import json
    print(json.dumps(result, indent=2))