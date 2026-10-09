from flask import Flask, jsonify, request, session, send_file, redirect
from flask_cors import CORS
import joblib
import pandas as pd
import os
import sqlite3
import time
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from google import genai
from dotenv import load_dotenv
from report_generator import create_pdf_report

load_dotenv()

# Render sets the RENDER env var automatically; locally it is not set
IS_PROD = bool(os.environ.get("RENDER"))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, '..', 'models')
DATASET_DIR = os.path.join(BASE_DIR, '..', 'dataset')
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'frontend'))

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)
else:
    gemini_client = None
    print("[YieldSense] WARNING: GEMINI_API_KEY not set. /api/recommend and /api/chat will fail.")

# Serve the frontend files (login.html, index.html, admin.html) from this same app
app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')

_secret = os.environ.get("FLASK_SECRET_KEY")
if not _secret:
    if IS_PROD:
        raise RuntimeError("FLASK_SECRET_KEY must be set in production.")
    _secret = "yieldsense-dev-secret-change-later"
app.secret_key = _secret

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=IS_PROD,
)

_default_origins = "http://127.0.0.1:5500,http://localhost:5500,http://127.0.0.1:5000,http://localhost:5000"
CORS(
    app,
    supports_credentials=True,
    origins=os.environ.get("CORS_ORIGINS", _default_origins).split(",")
)

model        = None
encoders     = None
feature_cols = None

_model_path    = os.path.join(MODELS_DIR, 'crop_yield_model_small.joblib')
_encoders_path = os.path.join(MODELS_DIR, 'encoders.joblib')
_features_path = os.path.join(MODELS_DIR, 'feature_cols.joblib')

if os.path.exists(_model_path) and os.path.exists(_encoders_path) and os.path.exists(_features_path):
    model        = joblib.load(_model_path)
    encoders     = joblib.load(_encoders_path)
    feature_cols = joblib.load(_features_path)
    print("[YieldSense] Model loaded successfully.")
else:
    print("[YieldSense] WARNING: Model artefacts not found. /api/predict will return 503.")

weather = pd.read_csv(os.path.join(DATASET_DIR, 'state_weather_data_1997_2020.csv'))
soil    = pd.read_csv(os.path.join(DATASET_DIR, 'state_soil_data.csv'))

weather['state_key'] = weather['state'].str.strip().str.lower()
soil['state_key']    = soil['state'].str.strip().str.lower()

# ---------------------------------------------------------------------------
# Risk assessment
# ---------------------------------------------------------------------------

def assess_risk(data, avg_rainfall, avg_temp, soil_info):
    reasons = []

    rainfall_input = float(data.get('total_rainfall_mm', 0) or 0)
    temp_input = float(data.get('avg_temp_c', 0) or 0)

    # Rainfall risk
    if avg_rainfall > 0 and rainfall_input > 0:
        deficit_pct = ((avg_rainfall - rainfall_input) / avg_rainfall) * 100
        if deficit_pct >= 25:
            reasons.append(f"Rainfall is {deficit_pct:.0f}% below the historical average — drought stress risk.")
        elif deficit_pct <= -30:
            reasons.append(f"Rainfall is {abs(deficit_pct):.0f}% above the historical average — waterlogging/flood risk.")

    # Temperature risk
    if avg_temp > 0 and temp_input > 0:
        temp_diff = temp_input - avg_temp
        if temp_diff >= 3:
            reasons.append(f"Temperature is {temp_diff:.1f}°C above the historical average — heat stress risk.")
        elif temp_diff <= -3:
            reasons.append(f"Temperature is {abs(temp_diff):.1f}°C below the historical average — cold stress risk.")

    # Soil risk
    N = float(data.get('N', 0) or 0)
    P = float(data.get('P', 0) or 0)
    K = float(data.get('K', 0) or 0)
    pH = float(data.get('pH', 0) or 0)

    if 0 < N < 40:
        reasons.append("Nitrogen levels are low, which may limit vegetative growth.")
    if 0 < P < 20:
        reasons.append("Phosphorus levels are low, which may affect root development.")
    if 0 < K < 20:
        reasons.append("Potassium levels are low, which may reduce disease resistance.")
    if 0 < pH < 5.5:
        reasons.append("Soil pH is acidic, which can restrict nutrient uptake.")
    elif pH > 8.5:
        reasons.append("Soil pH is alkaline, which can restrict nutrient uptake.")

    if len(reasons) >= 2:
        level = "High"
    elif len(reasons) == 1:
        level = "Moderate"
    else:
        level = "Low"

    return {"level": level, "reasons": reasons}


# ---------------------------------------------------------------------------
# Gemini call wrapper: retries, then falls back to a second model
# ---------------------------------------------------------------------------

def call_gemini_with_retry(contents, max_retries=2):
    if gemini_client is None:
        raise RuntimeError("GEMINI_API_KEY is not configured on the server.")

    models_to_try = ["gemini-3.6-flash", "gemini-2.5-flash"]
    last_error = None

    for model_name in models_to_try:
        for attempt in range(max_retries):
            try:
                response = gemini_client.models.generate_content(
                    model=model_name,
                    contents=contents
                )
                return response.text
            except Exception as e:
                last_error = e
                if "503" in str(e) or "UNAVAILABLE" in str(e):
                    time.sleep(1.5 * (attempt + 1))  # brief backoff
                    continue
                else:
                    raise  # non-503 errors fail immediately, no point retrying

    raise last_error


# ---------------------------------------------------------------------------
# Authentication: SQLite users table (farmer / admin roles)
# ---------------------------------------------------------------------------
DB_PATH = os.path.join(BASE_DIR, '..', 'users.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('farmer', 'admin'))
        )
    ''')
    conn.commit()
    conn.close()

init_db()


def seed_demo_users():
    """Create demo accounts from environment variables (used on the deployed site,
    where the database resets on every restart). Skipped when the variables are not set."""
    seeds = [
        ("farmer1", os.environ.get("DEMO_FARMER_PASSWORD"), "farmer"),
        ("admin1", os.environ.get("DEMO_ADMIN_PASSWORD"), "admin"),
    ]
    conn = sqlite3.connect(DB_PATH)
    for username, password, role in seeds:
        if password:
            conn.execute(
                "INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                (username, generate_password_hash(password), role)
            )
    conn.commit()
    conn.close()

seed_demo_users()


def login_required(role=None):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            if "user_id" not in session:
                return jsonify({"error": "Not logged in"}), 401
            if role and session.get("role") != role:
                return jsonify({"error": f"Requires {role} role"}), 403
            return f(*args, **kwargs)
        return wrapped
    return decorator


@app.route("/")
def home():
    return redirect("/login.html")


@app.route("/api/status")
def status():
    return jsonify({
        "project": "YieldSense AI",
        "status": "Backend connected successfully",
        "module": "Crop Yield Prediction",
        "model_loaded": model is not None
    })


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be valid JSON."}), 400

    username = data.get("username", "").strip()
    password = data.get("password", "")
    role = data.get("role", "").strip()

    if not username or not password or role not in ("farmer", "admin"):
        return jsonify({"error": "username, password, and role ('farmer' or 'admin') are required"}), 400

    # On the public deployment, admin accounts cannot be self-created
    if role == "admin" and IS_PROD:
        return jsonify({"error": "Admin accounts cannot be created through public registration."}), 403

    password_hash = generate_password_hash(password)

    try:
        conn = sqlite3.connect(DB_PATH)
        conn.execute(
            "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
            (username, password_hash, role)
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "Registered successfully"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Username already exists"}), 409


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be valid JSON."}), 400

    username = data.get("username", "").strip()
    password = data.get("password", "")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid username or password"}), 401

    session["user_id"] = user["id"]
    session["username"] = user["username"]
    session["role"] = user["role"]

    return jsonify({"message": "Logged in", "username": user["username"], "role": user["role"]})


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})


@app.route("/api/me")
def me():
    if "user_id" not in session:
        return jsonify({"logged_in": False})
    return jsonify({
        "logged_in": True,
        "username": session.get("username"),
        "role": session.get("role")
    })


# ---------------------------------------------------------------------------
# Admin analytics route
# ---------------------------------------------------------------------------

crop_df = pd.read_csv(os.path.join(DATASET_DIR, 'crop_yield.csv'))
crop_df['season'] = crop_df['season'].str.strip()


@app.route("/api/admin/analytics")
@login_required(role="admin")
def admin_analytics():
    top_crops = (
        crop_df.groupby('crop')['yield']
        .mean()
        .sort_values(ascending=False)
    )
    top_crops = top_crops[top_crops < 100]  # exclude extreme outlier-scale crops for readability
    top_crops = top_crops.head(10)

    yearly_trend = (
        crop_df.groupby('year')['yield']
        .mean()
        .sort_index()
    )

    records_by_state = (
        crop_df.groupby('state')['crop']
        .count()
        .sort_values(ascending=False)
        .head(10)
    )

    season_distribution = crop_df['season'].value_counts()

    return jsonify({
        "total_records": int(len(crop_df)),
        "total_crops": int(crop_df['crop'].nunique()),
        "total_states": int(crop_df['state'].nunique()),
        "top_crops_by_yield": {
            "labels": top_crops.index.tolist(),
            "values": [round(float(v), 2) for v in top_crops.values]
        },
        "yearly_avg_yield": {
            "labels": [str(y) for y in yearly_trend.index.tolist()],
            "values": [round(float(v), 2) for v in yearly_trend.values]
        },
        "records_by_state": {
            "labels": records_by_state.index.tolist(),
            "values": [int(v) for v in records_by_state.values]
        },
        "season_distribution": {
            "labels": season_distribution.index.tolist(),
            "values": [int(v) for v in season_distribution.values]
        }
    })


@app.route("/api/predict", methods=["POST"])
@login_required()
def predict():
    if model is None:
        return jsonify({"error": "Model not loaded. Train and save the model first."}), 503

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
@login_required()
def report():

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be valid JSON."}), 400
    if 'state' not in data:
        return jsonify({"error": "Missing required field: 'state'"}), 400

    try:
        state_key = str(data['state']).strip().lower()

        state_weather = weather[weather['state_key'] == state_key]
        state_soil    = soil[soil['state_key'] == state_key]

        if state_weather.empty:
            return jsonify({"error": f"No weather data found for state: {data['state']}"}), 404

        avg_rainfall = float(state_weather['total_rainfall_mm'].mean())
        avg_temp     = float(state_weather['avg_temp_c'].mean())

        soil_info = {}
        if not state_soil.empty:
            raw = state_soil.drop(columns=['state', 'state_key']).iloc[0].to_dict()
            soil_info = {k: (float(v) if hasattr(v, 'item') else v) for k, v in raw.items()}

        rainfall_input = float(data.get('total_rainfall_mm', 0))
        rainfall_flag  = "above average" if rainfall_input > avg_rainfall else "below average"

        risk = assess_risk(data, avg_rainfall, avg_temp, soil_info)

        return jsonify({
            "avg_historical_rainfall_mm": round(avg_rainfall, 1),
            "avg_historical_temp_c":      round(avg_temp, 1),
            "rainfall_vs_history":        rainfall_flag,
            "soil_info":                  soil_info,
            "risk":                       risk
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/report/pdf", methods=["POST"])
@login_required()
def report_pdf():

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "error": "Request body must be valid JSON."
        }), 400

    try:
        pdf_buffer = create_pdf_report(data)

        crop = data.get("crop", "Crop")
        filename = (
            f"YieldSense_AI_{crop.replace(' ', '_')}_Report.pdf"
        )

        return send_file(
            pdf_buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=filename
        )

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.route("/api/recommend", methods=["POST"])
@login_required()
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

        rec_text = call_gemini_with_retry(prompt)
        return jsonify({"recommendation": rec_text})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/chat", methods=["POST"])
@login_required()
def chat():
    try:
        data = request.get_json(silent=True)
        if not data or "message" not in data:
            return jsonify({"error": "Missing 'message' field"}), 400

        user_message = data["message"]
        history = data.get("history", [])  # list of {role: 'user'|'assistant', content: '...'}

        system_context = """You are the YieldSense AI assistant, embedded in a crop yield prediction platform for Indian farmers.
You can help with:
- General farming questions (crops, weather, soil, fertilizer, pest management, irrigation)
- Questions about how to use this platform (predicting yield, reading the weather/soil report, understanding recommendations and risk level)
- Explaining agricultural concepts in simple terms

Keep answers concise (3-5 sentences unless the user asks for more detail), practical, and in plain language suitable for a farmer. No markdown formatting."""

        contents = [{"role": "user", "parts": [{"text": system_context}]}]
        contents.append({"role": "model", "parts": [{"text": "Understood. I'm ready to help with farming questions and using the YieldSense AI platform."}]})

        for turn in history[-10:]:  # keep last 10 turns for context, avoid unbounded growth
            role = "user" if turn.get("role") == "user" else "model"
            contents.append({"role": role, "parts": [{"text": turn.get("content", "")}]})

        contents.append({"role": "user", "parts": [{"text": user_message}]})

        reply_text = call_gemini_with_retry(contents)
        return jsonify({"reply": reply_text})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=not IS_PROD)