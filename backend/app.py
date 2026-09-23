import os
import joblib
import pandas as pd
import mysql.connector
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

app = Flask(__name__)
CORS(app)

app.config["JWT_SECRET_KEY"] = os.getenv(
    "JWT_SECRET_KEY",
    "yieldsense-secret-key"
)

bcrypt = Bcrypt(app)
jwt = JWTManager(app)

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "best_xgboost_model.pkl"
)

DATASET_PATH = os.path.join(
    BASE_DIR,
    "datasets",
    "crop_yield_train.csv"
)

DB_CONFIG = {
    "host": os.getenv("MYSQL_HOST", "localhost"),
    "user": os.getenv("MYSQL_USER", "root"),
    "password": os.getenv("MYSQL_PASSWORD", ""),
    "database": os.getenv("MYSQL_DATABASE", "yieldsense_ai")
}

model = None

try:
    model = joblib.load(MODEL_PATH)
    print("XGBoost model loaded successfully!")
except Exception as e:
    print("Model loading error:", e)


def get_db():
    return mysql.connector.connect(
        host=DB_CONFIG["host"],
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
        database=DB_CONFIG["database"]
    )


@app.route("/")
def home():
    return jsonify({
        "message": "YieldSense AI Backend is running successfully!"
    })


@app.route("/db-test")
def db_test():
    try:
        db = get_db()
        cursor = db.cursor()

        cursor.execute("SELECT 1")
        cursor.fetchone()

        cursor.close()
        db.close()

        return jsonify({
            "database": DB_CONFIG["database"],
            "message": "MySQL connection successful!"
        })

    except Exception as e:
        return jsonify({
            "database": DB_CONFIG["database"],
            "message": "MySQL connection failed!",
            "error": str(e)
        }), 500


@app.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "message": "Request body is missing"
            }), 400

        name = data.get("name")
        email = data.get("email")
        password = data.get("password")
        role = data.get("role", "user")

        if not name or not email or not password:
            return jsonify({
                "message": "Name, email and password are required"
            }), 400

        db = get_db()
        cursor = db.cursor(dictionary=True)

        cursor.execute(
            "SELECT user_id FROM users WHERE email = %s",
            (email,)
        )

        existing_user = cursor.fetchone()

        if existing_user:
            cursor.close()
            db.close()

            return jsonify({
                "message": "Email already registered"
            }), 409

        hashed_password = bcrypt.generate_password_hash(
            password
        ).decode("utf-8")

        cursor.execute(
            """
            INSERT INTO users (name, email, password, role)
            VALUES (%s, %s, %s, %s)
            """,
            (
                name,
                email,
                hashed_password,
                role
            )
        )

        db.commit()

        cursor.close()
        db.close()

        return jsonify({
            "message": "Registration successful"
        }), 201

    except Exception as e:
        return jsonify({
            "message": "Registration failed",
            "error": str(e)
        }), 500


@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "message": "Request body is missing"
            }), 400

        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({
                "message": "Email and password are required"
            }), 400

        db = get_db()
        cursor = db.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT user_id, name, email, password, role
            FROM users
            WHERE email = %s
            """,
            (email,)
        )

        user = cursor.fetchone()

        cursor.close()
        db.close()

        if user is None:
            return jsonify({
                "message": "Invalid email or password"
            }), 401

        password_valid = bcrypt.check_password_hash(
            user["password"],
            password
        )

        if not password_valid:
            return jsonify({
                "message": "Invalid email or password"
            }), 401

        access_token = create_access_token(
            identity=str(user["user_id"])
        )

        return jsonify({
            "message": "Login successful",
            "access_token": access_token,
            "user": {
                "user_id": user["user_id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"]
            }
        }), 200

    except Exception as e:
        return jsonify({
            "message": "Login failed",
            "error": str(e)
        }), 500


@app.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    try:
        user_id = get_jwt_identity()

        db = get_db()
        cursor = db.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT user_id, name, email, role, created_at
            FROM users
            WHERE user_id = %s
            """,
            (user_id,)
        )

        user = cursor.fetchone()

        cursor.close()
        db.close()

        if user is None:
            return jsonify({
                "message": "User not found"
            }), 404

        return jsonify(user)

    except Exception as e:
        return jsonify({
            "message": "Profile loading failed",
            "error": str(e)
        }), 500


@app.route("/admin", methods=["GET"])
@jwt_required()
def admin():
    try:
        user_id = get_jwt_identity()

        db = get_db()
        cursor = db.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT user_id, name, email, role
            FROM users
            WHERE user_id = %s
            """,
            (user_id,)
        )

        user = cursor.fetchone()

        cursor.close()
        db.close()

        if user is None:
            return jsonify({
                "message": "User not found"
            }), 404

        if user["role"] != "admin":
            return jsonify({
                "message": "Admin access required"
            }), 403

        return jsonify({
            "message": "Admin access granted",
            "user": user
        })

    except Exception as e:
        return jsonify({
            "message": "Admin request failed",
            "error": str(e)
        }), 500


@app.route("/overview-analytics", methods=["GET"])
def overview_analytics():
    try:
        df = pd.read_csv(DATASET_PATH)

        average_yield = df["yield_tpha"].mean()

        best_crop = (
            df.groupby("crop_type")["yield_tpha"]
            .mean()
            .idxmax()
        )

        best_region = (
            df.groupby("region")["yield_tpha"]
            .mean()
            .idxmax()
        )

        best_season = (
            df.groupby("season")["yield_tpha"]
            .mean()
            .idxmax()
        )

        return jsonify({
            "average_yield": round(
                float(average_yield),
                2
            ),
            "best_crop": str(best_crop),
            "best_region": str(best_region),
            "best_season": str(best_season)
        })

    except Exception as e:
        return jsonify({
            "message": "Overview analytics failed",
            "error": str(e)
        }), 500


@app.route("/weather-analytics", methods=["GET"])
def weather_analytics():
    try:
        df = pd.read_csv(DATASET_PATH)

        temperature = df["avg_temperature"].mean()
        rainfall = df["total_rainfall"].mean()
        sunlight = df["sunlight_hours"].mean()

        return jsonify({
            "temperature": round(
                float(temperature),
                2
            ),
            "rainfall": round(
                float(rainfall),
                2
            ),
            "sunlight": round(
                float(sunlight),
                2
            ),
            "records": int(len(df))
        })

    except Exception as e:
        return jsonify({
            "message": "Weather analytics failed",
            "error": str(e)
        }), 500


@app.route("/soil-analysis", methods=["GET"])
def soil_analysis():
    try:
        df = pd.read_csv(DATASET_PATH)

        columns = [
            "soil_ph",
            "soil_moisture",
            "nitrogen_content",
            "phosphorus_content",
            "potassium_content"
        ]

        analysis = {}

        for column in columns:
            analysis[column] = {
                "max": round(
                    float(df[column].max()),
                    2
                ),
                "mean": round(
                    float(df[column].mean()),
                    2
                ),
                "min": round(
                    float(df[column].min()),
                    2
                )
            }

        return jsonify({
            "summary": {
                "soil_ph": round(
                    float(df["soil_ph"].mean()),
                    2
                ),
                "soil_moisture": round(
                    float(df["soil_moisture"].mean()),
                    2
                ),
                "nitrogen": round(
                    float(df["nitrogen_content"].mean()),
                    2
                ),
                "records": int(len(df))
            },
            "analysis": analysis
        })

    except Exception as e:
        return jsonify({
            "message": "Soil analysis failed",
            "error": str(e)
        }), 500


@app.route("/predict", methods=["POST"])
@jwt_required()
def predict():
    try:
        if model is None:
            return jsonify({
                "message": "Model is not loaded"
            }), 500

        data = request.get_json()

        if not data:
            return jsonify({
                "message": "Request body is missing"
            }), 400

        input_data = {
            "soil_ph": float(data["soil_ph"]),
            "soil_moisture": float(data["soil_moisture"]),
            "avg_temperature": float(data["avg_temperature"]),
            "total_rainfall": float(data["total_rainfall"]),
            "fertilizer_amount": float(data["fertilizer_amount"]),
            "pesticide_usage": float(data["pesticide_usage"]),
            "sunlight_hours": float(data["sunlight_hours"]),
            "nitrogen_content": float(data["nitrogen_content"]),
            "phosphorus_content": float(data["phosphorus_content"]),
            "potassium_content": float(data["potassium_content"]),
            "irrigation_frequency": float(data["irrigation_frequency"]),
            "crop_type": data["crop_type"],
            "region": data["region"],
            "season": data["season"],
            "harvest_year": int(data["harvest_year"]),
            "harvest_month": int(data["harvest_month"]),
            "harvest_day": int(data["harvest_day"])
        }

        input_df = pd.DataFrame([input_data])

        prediction = model.predict(input_df)

        predicted_yield = float(prediction[0])

        return jsonify({
            "predicted_yield_tpha": round(
                predicted_yield,
                2
            )
        })

    except Exception as e:
        return jsonify({
            "message": "Prediction failed",
            "error": str(e)
        }), 500


@app.route("/forecast", methods=["GET"])
def forecast():
    try:
        df = pd.read_csv(DATASET_PATH)

        overall_mean = df["yield_tpha"].mean()
        overall_std = df["yield_tpha"].std()
        minimum = df["yield_tpha"].min()

        crop_forecast = (
            df.groupby("crop_type")["yield_tpha"]
            .mean()
            .sort_values(ascending=False)
            .round(4)
            .to_dict()
        )

        region_forecast = (
            df.groupby("region")["yield_tpha"]
            .mean()
            .sort_values(ascending=False)
            .round(4)
            .to_dict()
        )

        season_forecast = (
            df.groupby("season")["yield_tpha"]
            .mean()
            .sort_values(ascending=False)
            .round(4)
            .to_dict()
        )

        return jsonify({
            "overall_mean": round(
                float(overall_mean),
                4
            ),
            "overall_std": round(
                float(overall_std),
                4
            ),
            "minimum": round(
                float(minimum),
                4
            ),
            "crop_forecast": crop_forecast,
            "region_forecast": region_forecast,
            "season_forecast": season_forecast
        })

    except Exception as e:
        return jsonify({
            "message": "Forecast failed",
            "error": str(e)
        }), 500


@app.route("/ai-insights", methods=["GET"])
def ai_insights():
    return jsonify({
        "message": "AI insights module available",
        "provider": "Groq / OpenAI open-source model",
        "insights": [
            "Fertilizer amount is an important yield-related feature.",
            "Pesticide usage contributes to prediction patterns.",
            "Rainfall and weather conditions influence crop yield.",
            "AI-generated insights can support agricultural decision-making."
        ]
    })


@app.route("/recommendations", methods=["GET"])
def recommendations():
    return jsonify({
        "recommendations": [
            "Maintain suitable soil nutrient levels.",
            "Monitor irrigation according to crop requirements.",
            "Track rainfall and temperature conditions.",
            "Use model predictions together with soil and weather analytics.",
            "Review fertilizer and pesticide usage carefully."
        ]
    })


@app.route("/risk-assessment", methods=["GET"])
def risk_assessment():
    return jsonify({
        "weather_risk": "Monitor",
        "soil_risk": "Monitor",
        "water_risk": "Monitor",
        "yield_risk": "Monitor"
    })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )