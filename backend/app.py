import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from dotenv import load_dotenv
from predict_service import predict_and_generate_insight, get_live_temperature, get_all_soil_ranges
from models import db, PredictionHistory, User
from auth import auth_bp, role_required
from farm_profile import farm_profile_bp

load_dotenv()

app = Flask(__name__)
CORS(app)  # allows requests from your Next.js frontend (localhost:3000)

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

db.init_app(app)
jwt = JWTManager(app)

app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(farm_profile_bp)

with app.app_context():
    db.create_all()


@app.route("/")
def home():
    return {"message": "YieldSense AI backend is running"}


@app.route("/predict", methods=["POST"])
@jwt_required()
def predict():
    field = request.get_json()
    if field is None:
        return jsonify({"error": "Request body must be JSON"}), 400

    try:
        result = predict_and_generate_insight(field)

        # Save this prediction to history for the logged-in user.
        # Failing to save history shouldn't block returning the prediction
        # itself, so this is best-effort.
        try:
            history_entry = PredictionHistory(
                user_id=int(get_jwt_identity()),
                crop_type=field.get("crop_type"),
                region=field.get("region"),
                season=field.get("season"),
                predicted_yield=result.get("predicted_yield"),
                typical_yield_for_crop=result.get("typical_yield_for_crop"),
                risk_level=result.get("risk_level"),
            )
            db.session.add(history_entry)
            db.session.commit()
        except Exception:
            db.session.rollback()

        return jsonify(result)
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {e}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


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
    """Returns every registered user. Admin-only."""
    users = User.query.order_by(User.id).all()
    return jsonify([u.to_dict() for u in users]), 200


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


@app.route("/soil-ranges", methods=["GET"])
@jwt_required()
def soil_ranges():
    """Returns healthy soil ranges for every crop type (Soil Reference page)."""
    return jsonify(get_all_soil_ranges()), 200


if __name__ == "__main__":
    app.run(debug=True)