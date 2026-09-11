from flask import Flask, jsonify, request
from flask_cors import CORS
import joblib
import pandas as pd
import os
from google import genai
from dotenv import load_dotenv
load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("[YieldSense] WARNING: GEMINI_API_KEY not set. /api/recommend will fail.")
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# Resolve paths relative to this file, not the CWD — fixes Bug 2
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, '..', 'models')
DATASET_DIR = os.path.join(BASE_DIR, '..', 'dataset')

# ---------------------------------------------------------------------------
# Load model + encoders lazily so the server starts even without trained
# artefacts — fixes Bug 1
# ---------------------------------------------------------------------------
model        = None
encoders     = None
feature_cols = None

_model_path    = os.path.join(MODELS_DIR, 'crop_yield_model.joblib')
_encoders_path = os.path.join(MODELS_DIR, 'encoders.joblib')
_features_path = os.path.join(MODELS_DIR, 'feature_cols.joblib')

if os.path.exists(_model_path) and os.path.exists(_encoders_path) and os.path.exists(_features_path):
    model        = joblib.load(_model_path)
    encoders     = joblib.load(_encoders_path)
    feature_cols = joblib.load(_features_path)
    print("[YieldSense] Model loaded successfully.")
else:
    print("[YieldSense] WARNING: Model artefacts not found. /api/predict will return 503.")

# Load weather + soil data for the report endpoint
weather = pd.read_csv(os.path.join(DATASET_DIR, 'state_weather_data_1997_2020.csv'))
soil    = pd.read_csv(os.path.join(DATASET_DIR, 'state_soil_data.csv'))

# Normalise state column to lowercase for case-insensitive matching — fixes Bug 3 (partial)
weather['state_key'] = weather['state'].str.strip().str.lower()
soil['state_key']    = soil['state'].str.strip().str.lower()


@app.route("/")
def home():
    return jsonify({
        "message": "Backend is running successfully!"
    })


@app.route("/api/status")
def status():
    return jsonify({
        "project": "YieldSense AI",
        "status": "Backend connected successfully",
        "module": "Crop Yield Prediction",
        "model_loaded": model is not None
    })


@app.route("/api/predict", methods=["POST"])
def predict():
    # Bug 1 guard: model not yet trained
    if model is None:
        return jsonify({"error": "Model not loaded. Train and save the model first."}), 503

    # Bug 4: validate required fields upfront with a clear message
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be valid JSON."}), 400

    required = ['crop', 'state', 'season', 'area']
    missing  = [k for k in required if k not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {missing}"}), 400

    try:
        crop_enc   = encoders['crop'].transform([data['crop']])[0]
        state_enc  = encoders['state'].transform([data['state']])[0]
        season_enc = encoders['season'].transform([data['season']])[0]

        row = pd.DataFrame([{
            'crop_enc':             crop_enc,
            'state_enc':            state_enc,
            'season_enc':           season_enc,
            'area':                 float(data['area']),
            'fertilizer':           float(data.get('fertilizer', 0)),
            'pesticide':            float(data.get('pesticide', 0)),
            'avg_temp_c':           float(data.get('avg_temp_c', 0)),
            'total_rainfall_mm':    float(data.get('total_rainfall_mm', 0)),
            'avg_humidity_percent': float(data.get('avg_humidity_percent', 0)),
            'N':                    float(data.get('N', 0)),
            'P':                    float(data.get('P', 0)),
            'K':                    float(data.get('K', 0)),
            'pH':                   float(data.get('pH', 0)),
        }])[feature_cols]

        prediction = model.predict(row)[0]

        return jsonify({"predicted_yield": round(float(prediction), 3)})

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/report", methods=["POST"])
def report():
    # Bug 4: validate required fields
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be valid JSON."}), 400
    if 'state' not in data:
        return jsonify({"error": "Missing required field: 'state'"}), 400

    try:
        state_key = str(data['state']).strip().lower()   # normalise for matching

        state_weather = weather[weather['state_key'] == state_key]
        state_soil    = soil[soil['state_key'] == state_key]

        # Bug 3: guard against NaN when state has no weather data
        if state_weather.empty:
            return jsonify({"error": f"No weather data found for state: {data['state']}"}), 404

        avg_rainfall = float(state_weather['total_rainfall_mm'].mean())
        avg_temp     = float(state_weather['avg_temp_c'].mean())

        # Bug 5: convert numpy types → native Python so jsonify doesn't crash
        soil_info = {}
        if not state_soil.empty:
            raw = state_soil.drop(columns=['state', 'state_key']).iloc[0].to_dict()
            soil_info = {k: (float(v) if hasattr(v, 'item') else v) for k, v in raw.items()}

        rainfall_input = float(data.get('total_rainfall_mm', 0))
        rainfall_flag  = "above average" if rainfall_input > avg_rainfall else "below average"

        return jsonify({
            "avg_historical_rainfall_mm": round(avg_rainfall, 1),
            "avg_historical_temp_c":      round(avg_temp, 1),
            "rainfall_vs_history":        rainfall_flag,
            "soil_info":                  soil_info
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/recommend", methods=["POST"])
def recommend():
    try:
        data = request.get_json()

        prompt = f"""You are an agricultural advisor. A farmer has these details:

Crop: {data.get('crop')}
State: {data.get('state')}
Season: {data.get('season')}
Area: {data.get('area')} hectares
Predicted yield: {data.get('predicted_yield')} tonnes/hectare
Rainfall input: {data.get('total_rainfall_mm')} mm (historical average: {data.get('avg_historical_rainfall_mm')} mm)
Soil - N: {data.get('N')}, P: {data.get('P')}, K: {data.get('K')}, pH: {data.get('pH')}

In 3-4 short sentences, give the farmer a plain-language assessment of this predicted yield and one practical recommendation to improve it. Be specific and concise. No markdown formatting."""

        response = gemini_client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )

        return jsonify({"recommendation": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 400
if __name__ == "__main__":
    app.run(debug=True)