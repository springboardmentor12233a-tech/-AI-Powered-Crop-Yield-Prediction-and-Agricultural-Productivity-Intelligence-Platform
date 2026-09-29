from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
import os
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)

# -----------------------------
# Load trained ML pipeline
# -----------------------------
MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "models",
    "best_crop_yield_model.joblib"
)

model = joblib.load(MODEL_PATH)

# -----------------------------
# Connect Groq AI
# -----------------------------
api_key = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=api_key) if api_key else None


# -----------------------------
# Home route
# -----------------------------
@app.route("/")
def home():
    return jsonify({
        "message": "Smart Farming Backend is running!"
    })


# -----------------------------
# ML Prediction API
# -----------------------------
@app.route("/api/predict", methods=["POST"])
def predict():

    try:
        data = request.get_json()

        # The trained pipeline expects these 20 columns
        input_data = {
            "farm_id": None,
            "region": data.get("region"),
            "crop_type": data.get("crop"),
            "soil_moisture_%": data.get("soil_moisture"),
            "soil_pH": data.get("soil_ph"),
            "temperature_C": data.get("temperature"),
            "rainfall_mm": data.get("rainfall"),
            "humidity_%": data.get("humidity"),
            "sunlight_hours": data.get("sunlight"),
            "irrigation_type": data.get("irrigation_type"),
            "fertilizer_type": None,
            "pesticide_usage_ml": None,
            "total_days": None,
            "latitude": None,
            "longitude": None,
            "NDVI_index": None,
            "crop_disease_status": None,
            "sowing_month": None,
            "sowing_dayofyear": None,
            "harvest_month": None,
            "harvest_dayofyear": None
        }

        # Convert to DataFrame
        input_df = pd.DataFrame([input_data])

        # Actual trained ML model prediction
        prediction = model.predict(input_df)[0]

        prediction = round(float(prediction), 2)

        return jsonify({
            "success": True,
            "predicted_yield": prediction
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# -----------------------------
# Groq AI Agricultural Insights
# -----------------------------
@app.route("/api/insights", methods=["POST"])
def generate_insights():

    try:

        if not client:
            return jsonify({
                "success": False,
                "error": "GROQ_API_KEY is not configured"
            }), 500

        farm_data = request.get_json()

        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an agricultural AI assistant. "
                        "Analyze the supplied farm data carefully. "
                        "Give concise observations, possible risks, "
                        "and practical recommendations. "
                        "Do not invent missing measurements. "
                        "Use simple English."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        "Analyze this farm data:\n\n"
                        + str(farm_data)
                    )
                }
            ],
            temperature=0.3
        )

        insights = response.choices[0].message.content

        return jsonify({
            "success": True,
            "insights": insights
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# -----------------------------
# Run server
# -----------------------------
if __name__ == "__main__":
    app.run(
        debug=True,
        port=5000
    )