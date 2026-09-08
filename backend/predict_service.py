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
  5. Send everything to Groq for a plain-language insight (Step 7)
  6. Return one combined dictionary - this is what the frontend will receive

By: Shivani
"""

import os
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


def get_llm_insight(field: dict, predicted_yield: float, soil_flags: dict, weather_context: dict) -> str:
    if not GROQ_API_KEY:
        return "LLM insight unavailable: GROQ_API_KEY not configured."

    prompt = f"""You are an agricultural assistant. Based on the data below, give a short,
practical insight (3-4 sentences) for a farmer. Mention whether the predicted yield
looks typical, and call out any soil condition that stands out as a concern or strength.
Avoid technical jargon.

Crop type: {field['crop_type']}
Region: {field['region']}
Season: {field['season']}
Predicted yield: {round(predicted_yield, 2)} t/ha

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
        json={"model": GROQ_MODEL, "messages": [{"role": "user", "content": prompt}], "max_tokens": 300},
    )
    if response.status_code != 200:
        return f"LLM insight unavailable: {response.text}"
    return response.json()["choices"][0]["message"]["content"].strip()


def predict_and_generate_insight(field: dict) -> dict:
    """Main entry point: takes a raw field input dict, returns the full
    combined result the frontend will display."""
    X = preprocess_input(field)
    predicted_yield = float(_model.predict(X)[0])

    soil_flags = flag_soil(field)
    weather_context = get_weather_context(field)
    insight = get_llm_insight(field, predicted_yield, soil_flags, weather_context)

    return {
        "predicted_yield": round(predicted_yield, 2),
        "soil_flags": soil_flags,
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