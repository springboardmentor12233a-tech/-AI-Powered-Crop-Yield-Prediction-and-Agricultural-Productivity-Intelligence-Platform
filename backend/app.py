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
from models import db, PredictionHistory, User, FarmProfile
from auth import auth_bp, role_required
from farm_profile import farm_profile_bp
from chat import chat_bp
from reports import reports_bp
from translate import translate_bp
from planner import planner_bp
from vision import vision_bp
from notifications import notifications_bp, CropPlan, _plan_to_dict
from extensions import limiter

# ---------------------------------------------------------------
# Config - everything sensitive comes from the environment (.env)
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
        "JWT_SECRET_KEY is missing, still the placeholder, or shorter than 32 characters. "
        "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
    )

app = Flask(__name__)
# Only the frontend's origin(s) may call this API from a browser.
CORS(app, origins=FRONTEND_ORIGINS)

app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
# In-memory counters are fine for one process. For gunicorn with several
# workers, point this at Redis (e.g. redis://localhost:6379).
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


@app.errorhandler(429)
def rate_limited(e):
    # The frontend always calls res.json(), so return JSON rather than HTML.
    return jsonify({"error": "Too many requests. Please wait a moment and try again."}), 429


with app.app_context():
    db.create_all()
    # create_all() doesn't add columns to tables that already exist, so add the
    # newer columns here. Safe to run every time (IF NOT EXISTS). For a larger
    # project, use Flask-Migrate instead.
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

    # profile_id is NOT a model input: it only links this prediction to the
    # saved field it was made for. Pull it out, and only keep it if that
    # field really belongs to the logged-in user.
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

    # Save this prediction to history for the logged-in user.
    # Failing to save history shouldn't block returning the prediction
    # itself, so this is best-effort.
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
    """
    Returns the current live temperature for the city representing the
    given dataset region (see REGION_TO_CITY in predict_service.py).
    Used by the frontend's "Fetch Live Weather" button.
    """
    region = request.args.get("region")
    if not region:
        return jsonify({"error": "region query param is required"}), 400

    result = get_live_temperature(region)
    return jsonify(result), 200


@app.route("/history", methods=["GET"])
@jwt_required()
def history():
    """Returns the logged-in user's past predictions, most recent first."""
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
    """
    Returns every registered user, with how many fields and predictions they
    have and when they last made a prediction (used by the admin Users table).
    Admin-only.
    """
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
    """
    Full picture of one user for the admin drill-down: their account info,
    every saved field, and their entire prediction history (newest first).
    """
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
    """
    Returns real, computed platform-wide stats - no fabricated numbers.
    total_users / total_predictions are simple counts. avg_predicted_yield
    and risk_breakdown are computed from actual PredictionHistory rows,
    and are None / empty if no predictions exist yet.
    """
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
    """
    Returns average temperature and rainfall by region and season, from
    the dataset's weather_summary (Step 6). Dataset-wide reference data,
    not tied to any individual user.
    """
    from predict_service import _weather_summary
    records = _weather_summary.to_dict(orient="records")
    return jsonify(records), 200


@app.route("/admin/seasonal-yield", methods=["GET"])
@jwt_required()
@role_required("admin")
def admin_seasonal_yield():
    """
    Average predicted yield by season and crop, from real predictions made
    on the platform (unlike /admin/seasonal-report, which is dataset weather).
    """
    rows = (
        db.session.query(
            PredictionHistory.season,
            PredictionHistory.crop_type,
            db.func.avg(PredictionHistory.predicted_yield),
            db.func.count(PredictionHistory.id),
        )
        .group_by(PredictionHistory.season, PredictionHistory.crop_type)
        .all()
    )
    return jsonify([
        {"season": s, "crop_type": c, "avg_yield": round(avg, 2), "predictions": n}
        for s, c, avg, n in rows if s and c and avg is not None
    ]), 200


@app.route("/soil-ranges", methods=["GET"])
@jwt_required()
def soil_ranges():
    """Returns healthy soil ranges for every crop type (Soil Reference page)."""
    return jsonify(get_all_soil_ranges()), 200


if __name__ == "__main__":
    # debug is OFF unless you set FLASK_DEBUG=1 in your local .env.
    # In production run:  gunicorn -w 2 -b 0.0.0.0:5000 app:app
    app.run(debug=DEBUG)