import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from dotenv import load_dotenv
from sqlalchemy import text

load_dotenv()

from predict_service import (
    predict_and_generate_insight,
    get_live_temperature,
    get_all_soil_ranges,
    InputValidationError,
)
from models import db, PredictionHistory, User, FarmProfile, MarketPrice
from auth import auth_bp, role_required
from farm_profile import farm_profile_bp
from chat import chat_bp
from reports import reports_bp
from translate import translate_bp
from planner import planner_bp, DEFAULT_PRICE_PER_TONNE, DEFAULT_COST_PER_HA
from vision import vision_bp
from notifications import notifications_bp, CropPlan, _plan_to_dict
from admin import admin_bp
from extensions import limiter

# ---------------------------------------------------------------
# Config - environment variables (.env)
# ---------------------------------------------------------------
DATABASE_URL = os.getenv("DATABASE_URL")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
FRONTEND_ORIGINS = [
    o.strip()
    for o in os.getenv("FRONTEND_ORIGIN", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    if o.strip()
]
DEBUG = os.getenv("FLASK_DEBUG", "0") == "1"

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Add it to backend/.env.")
if not JWT_SECRET_KEY or JWT_SECRET_KEY.startswith("change-this") or len(JWT_SECRET_KEY) < 32:
    raise RuntimeError(
        "JWT_SECRET_KEY is missing, still the placeholder, or shorter than 32 characters."
    )

app = Flask(__name__)
CORS(app, origins=FRONTEND_ORIGINS)

app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
app.config["RATELIMIT_STORAGE_URI"] = os.getenv("RATELIMIT_STORAGE_URI", "memory://")

db.init_app(app)
jwt = JWTManager(app)
limiter.init_app(app)

app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(farm_profile_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(reports_bp)
app.register_blueprint(translate_bp)
app.register_blueprint(planner_bp)
app.register_blueprint(vision_bp)
app.register_blueprint(notifications_bp)
app.register_blueprint(admin_bp)


@app.errorhandler(429)
def rate_limited(e):
    return jsonify({"error": "Too many requests. Please wait a moment and try again."}), 429


with app.app_context():
    db.create_all()
    for stmt in [
        "ALTER TABLE farm_profile ADD COLUMN IF NOT EXISTS field_size_hectares FLOAT",
        "ALTER TABLE prediction_history ADD COLUMN IF NOT EXISTS details JSON",
        "ALTER TABLE prediction_history ADD COLUMN IF NOT EXISTS profile_id INTEGER "
        "REFERENCES farm_profile(id) ON DELETE SET NULL",
    ]:
        try:
            db.session.execute(text(stmt))
            db.session.commit()
        except Exception:
            db.session.rollback()

    # Seed default market prices if empty
    try:
        if MarketPrice.query.count() == 0:
            for crop, price in DEFAULT_PRICE_PER_TONNE.items():
                cost = DEFAULT_COST_PER_HA.get(crop, 35000)
                db.session.add(MarketPrice(
                    crop_type=crop,
                    price_per_tonne=price,
                    cost_per_ha=cost,
                    updated_by="System Default",
                ))
            db.session.commit()
    except Exception:
        db.session.rollback()


@app.route("/")
def home():
    return {"message": "AgriVantage backend is running"}


@app.route("/predict", methods=["POST"])
@limiter.limit("30 per minute")
@jwt_required()
def predict():
    field = request.get_json(silent=True)
    if not isinstance(field, dict):
        return jsonify({"error": "Request body must be a JSON object"}), 400

    user_id = int(get_jwt_identity())
    raw_profile_id = field.pop("profile_id", None)
    profile_id = None
    if isinstance(raw_profile_id, int) and not isinstance(raw_profile_id, bool):
        owned = FarmProfile.query.filter_by(id=raw_profile_id, user_id=user_id).first()
        profile_id = owned.id if owned else None

    try:
        result = predict_and_generate_insight(field)
    except InputValidationError as e:
        return jsonify({"error": str(e)}), 400
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {e}"}), 400
    except Exception:
        app.logger.exception("Prediction failed")
        return jsonify({"error": "Prediction failed. Please check your inputs and try again."}), 500

    try:
        history_entry = PredictionHistory(
            user_id=user_id,
            profile_id=profile_id,
            crop_type=field.get("crop_type"),
            region=field.get("region"),
            season=field.get("season"),
            predicted_yield=result.get("predicted_yield"),
            typical_yield_for_crop=result.get("typical_yield_for_crop"),
            risk_level=result.get("risk_level"),
            details={
                "inputs": field,
                "soil_flags": result.get("soil_flags"),
                "weather_context": result.get("weather_context"),
                "llm_insight": result.get("llm_insight"),
            },
        )
        db.session.add(history_entry)
        db.session.commit()
    except Exception:
        db.session.rollback()
        app.logger.exception("Could not save prediction history")

    return jsonify(result)


@app.route("/live-weather", methods=["GET"])
@jwt_required()
def live_weather():
    region = request.args.get("region")
    if not region:
        return jsonify({"error": "region query param is required"}), 400
    return jsonify(get_live_temperature(region)), 200


@app.route("/history", methods=["GET"])
@jwt_required()
def history():
    user_id = int(get_jwt_identity())
    records = (
        PredictionHistory.query.filter_by(user_id=user_id)
        .order_by(PredictionHistory.created_at.desc())
        .all()
    )
    return jsonify([r.to_dict() for r in records]), 200


@app.route("/admin/users", methods=["GET"])
@jwt_required()
@role_required("admin")
def admin_users():
    users = User.query.order_by(User.id).all()
    field_counts = dict(
        db.session.query(FarmProfile.user_id, db.func.count(FarmProfile.id))
        .group_by(FarmProfile.user_id)
        .all()
    )
    prediction_rows = (
        db.session.query(
            PredictionHistory.user_id,
            db.func.count(PredictionHistory.id),
            db.func.max(PredictionHistory.created_at),
        )
        .group_by(PredictionHistory.user_id)
        .all()
    )
    predictions = {uid: (n, last) for uid, n, last in prediction_rows}

    result = []
    for u in users:
        n, last = predictions.get(u.id, (0, None))
        row = u.to_dict()
        row["fields"] = field_counts.get(u.id, 0)
        row["predictions"] = n
        row["last_active"] = last.isoformat() if last else None
        result.append(row)
    return jsonify(result), 200


@app.route("/admin/users/<int:user_id>", methods=["GET"])
@jwt_required()
@role_required("admin")
def admin_user_detail(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    profiles = FarmProfile.query.filter_by(user_id=user_id).order_by(FarmProfile.id).all()
    predictions = (
        PredictionHistory.query.filter_by(user_id=user_id)
        .order_by(PredictionHistory.created_at.desc())
        .all()
    )
    plans = CropPlan.query.filter_by(user_id=user_id).order_by(CropPlan.id.desc()).all()

    return jsonify({
        "user": user.to_dict(),
        "profiles": [p.to_dict() for p in profiles],
        "predictions": [p.to_dict() for p in predictions],
        "plans": [_plan_to_dict(p) for p in plans],
    }), 200


@app.route("/admin/stats", methods=["GET"])
@jwt_required()
@role_required("admin")
def admin_stats():
    total_users = User.query.count()
    total_predictions = PredictionHistory.query.count()
    avg_yield = db.session.query(db.func.avg(PredictionHistory.predicted_yield)).scalar()

    risk_counts = (
        db.session.query(PredictionHistory.risk_level, db.func.count(PredictionHistory.id))
        .group_by(PredictionHistory.risk_level)
        .all()
    )
    risk_breakdown = {level: count for level, count in risk_counts if level}

    crop_counts = (
        db.session.query(PredictionHistory.crop_type, db.func.count(PredictionHistory.id))
        .group_by(PredictionHistory.crop_type)
        .order_by(db.func.count(PredictionHistory.id).desc())
        .all()
    )
    predictions_by_crop = {crop: count for crop, count in crop_counts if crop}

    yield_by_crop_rows = (
        db.session.query(
            PredictionHistory.crop_type,
            db.func.avg(PredictionHistory.predicted_yield),
        )
        .group_by(PredictionHistory.crop_type)
        .all()
    )
    avg_yield_by_crop = {
        crop: round(avg, 2) for crop, avg in yield_by_crop_rows if crop and avg is not None
    }

    return jsonify({
        "total_users": total_users,
        "total_predictions": total_predictions,
        "avg_predicted_yield": round(avg_yield, 2) if avg_yield is not None else None,
        "risk_breakdown": risk_breakdown,
        "predictions_by_crop": predictions_by_crop,
        "avg_yield_by_crop": avg_yield_by_crop,
    }), 200


@app.route("/admin/seasonal-report", methods=["GET"])
@jwt_required()
@role_required("admin")
def admin_seasonal_report():
    from predict_service import _weather_summary
    return jsonify(_weather_summary.to_dict(orient="records")), 200


@app.route("/soil-ranges", methods=["GET"])
@jwt_required()
def soil_ranges():
    return jsonify(get_all_soil_ranges()), 200


if __name__ == "__main__":
    app.run(debug=DEBUG)