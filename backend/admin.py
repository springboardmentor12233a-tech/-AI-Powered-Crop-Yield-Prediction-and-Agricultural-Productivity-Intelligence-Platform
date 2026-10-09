import os
import csv
import time
from datetime import datetime
import requests
import pandas as pd
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text

from auth import role_required
from models import db, User, FarmProfile, PredictionHistory, Announcement, MarketPrice
from notifications import Notification, _add
import predict_service as ps
from predict_service import (
    _model,
    _train_columns,
    _soil_ranges,
    SOIL_COLS,
    REGION_TO_CITY,
    GROQ_API_KEY,
    GROQ_MODEL,
    GROQ_API_URL,
    OPENWEATHER_API_KEY,
    OPENWEATHER_URL,
    preprocess_input,
)
from planner import (
    DEFAULT_PRICE_PER_TONNE,
    DEFAULT_COST_PER_HA,
    FALLBACK_PRICE,
    FALLBACK_COST,
)
from extensions import limiter

admin_bp = Blueprint("admin", __name__)

SOIL_LABELS = {
    "soil_ph": "Soil pH",
    "nitrogen_content": "Nitrogen",
    "phosphorus_content": "Phosphorus",
    "potassium_content": "Potassium",
}

FEATURE_LABELS = {
    "fertilizer_amount": "Fertilizer Amount (kg/ha)",
    "pesticide_usage": "Pesticide Usage (kg/ha)",
    "rainfall_to_temp_ratio": "Rainfall-to-Temp Ratio",
    "total_rainfall": "Total Rainfall (mm)",
    "fertilizer_nitrogen_interaction": "Fertilizer × Nitrogen Interaction",
    "season_Spring": "Season: Spring",
    "season_Summer": "Season: Summer",
    "season_Autumn": "Season: Autumn",
    "crop_type_Corn": "Crop: Corn",
    "crop_type_Wheat": "Crop: Wheat",
    "crop_type_Rice": "Crop: Rice",
    "crop_type_Soybean": "Crop: Soybean",
    "crop_type_Barley": "Crop: Barley",
    "soil_moisture": "Soil Moisture (%)",
    "potassium_content": "Potassium Content (K)",
    "phosphorus_content": "Phosphorus Content (P)",
    "nitrogen_content": "Nitrogen Content (N)",
    "soil_ph": "Soil pH",
    "avg_temperature": "Avg Temperature (°C)",
    "sunlight_hours": "Sunlight Hours",
    "irrigation_frequency": "Irrigation Frequency",
    "harvest_month": "Harvest Month",
}

# ---------------------------------------------------------------
# 1. Predictions Endpoint
# ---------------------------------------------------------------
@admin_bp.route("/admin/predictions", methods=["GET"])
@jwt_required()
@role_required("admin")
def admin_all_predictions():
    rows = (
        db.session.query(PredictionHistory, User, FarmProfile)
        .join(User, PredictionHistory.user_id == User.id)
        .outerjoin(FarmProfile, PredictionHistory.profile_id == FarmProfile.id)
        .order_by(PredictionHistory.created_at.desc(), PredictionHistory.id.desc())
        .all()
    )

    records = []
    for pred, user, profile in rows:
        records.append({
            "id": pred.id,
            "user_id": user.id,
            "user_name": user.name,
            "user_email": user.email,
            "field_name": profile.field_name if profile else "Ad-hoc Prediction",
            "crop_type": pred.crop_type,
            "region": pred.region,
            "season": pred.season,
            "predicted_yield": pred.predicted_yield,
            "typical_yield_for_crop": pred.typical_yield_for_crop,
            "risk_level": pred.risk_level or "Low",
            "created_at": pred.created_at.isoformat() if pred.created_at else None,
            "details": pred.details or {},
        })

    return jsonify({"predictions": records}), 200


# ---------------------------------------------------------------
# 2. Model Performance Endpoint (Fixed JSON Serialization)
# ---------------------------------------------------------------
@admin_bp.route("/admin/model-performance", methods=["GET"])
@jwt_required()
@role_required("admin")
def admin_model_performance():
    csv_path = os.path.join(os.path.dirname(__file__), "model_comparison_report.csv")
    models_comparison = []

    if os.path.exists(csv_path):
        with open(csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                models_comparison.append({
                    "model": str(row.get("model", "")),
                    "stage": str(row.get("stage", "")),
                    "rmse": float(row.get("rmse", 0)),
                    "mae": float(row.get("mae", 0)),
                    "r2": float(row.get("r2", 0)),
                })

    # XGBoost feature importances with explicit Python float casting
    feature_importances = []
    if hasattr(_model, "feature_importances_"):
        cols = [c for c in _train_columns if c not in ["yield_tpha", "id"]]
        raw_fi = list(zip(cols, _model.feature_importances_))
        raw_fi.sort(key=lambda x: -float(x[1]))

        total_imp = float(sum(float(val) for _, val in raw_fi)) or 1.0
        for col_name, val in raw_fi[:12]:
            feature_importances.append({
                "feature": str(col_name),
                "label": str(FEATURE_LABELS.get(col_name, col_name.replace("_", " ").title())),
                "importance": float(round(float(val), 4)),
                "percentage": float(round((float(val) / total_imp) * 100, 1)),
            })

    return jsonify({
        "comparison": models_comparison,
        "feature_importances": feature_importances,
        "active_model": {
            "name": "XGBoost Yield Regressor",
            "type": type(_model).__name__,
            "status": "Tuned & Operational",
            "top_metric": "R² = 0.6770 | RMSE = 0.6567",
        },
    }), 200


# ---------------------------------------------------------------
# 3. Announcements Endpoints
# ---------------------------------------------------------------
@admin_bp.route("/admin/announcements", methods=["GET"])
@jwt_required()
@role_required("admin")
def list_announcements():
    items = Announcement.query.order_by(Announcement.created_at.desc(), Announcement.id.desc()).all()
    farmer_count = User.query.filter_by(role="farmer").count()
    return jsonify({
        "announcements": [a.to_dict() for a in items],
        "total_farmers": farmer_count,
    }), 200


@admin_bp.route("/admin/announcements", methods=["POST"])
@jwt_required()
@role_required("admin")
def create_announcement():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    message = (data.get("message") or "").strip()
    category = data.get("category") or "General"

    if not title or not message:
        return jsonify({"error": "Title and message are required."}), 400

    user_id = int(get_jwt_identity())
    announcement = Announcement(
        title=title,
        message=message,
        category=category,
        created_by=user_id,
    )
    db.session.add(announcement)
    db.session.commit()

    farmers = User.query.filter_by(role="farmer").all()
    for farmer in farmers:
        _add(
            farmer.id,
            "announcement",
            f"announcement:{announcement.id}",
            {
                "title": announcement.title,
                "message": announcement.message,
                "category": announcement.category,
            },
            "/dashboard",
        )
    db.session.commit()

    return jsonify({
        "message": "Announcement broadcast successfully",
        "announcement": announcement.to_dict(),
        "delivered_to": len(farmers),
    }), 201


@admin_bp.route("/admin/announcements/<int:announcement_id>", methods=["DELETE"])
@jwt_required()
@role_required("admin")
def delete_announcement(announcement_id):
    announcement = Announcement.query.get(announcement_id)
    if not announcement:
        return jsonify({"error": "Announcement not found."}), 404

    Notification.query.filter(
        Notification.key == f"announcement:{announcement.id}"
    ).delete(synchronize_session=False)

    db.session.delete(announcement)
    db.session.commit()
    return jsonify({"message": "Announcement deleted and removed from farmer bells."}), 200


# ---------------------------------------------------------------
# 4. Fields Endpoint with Regional Soil Diagnostics
# ---------------------------------------------------------------
@admin_bp.route("/admin/fields", methods=["GET"])
@jwt_required()
@role_required("admin")
def admin_fields():
    profiles = (
        db.session.query(FarmProfile, User)
        .join(User, FarmProfile.user_id == User.id)
        .order_by(FarmProfile.region, FarmProfile.field_name)
        .all()
    )

    fields_data = []
    regional_counts = {}
    issue_tallies = {}

    for p, u in profiles:
        crop = p.crop_type
        issues = []
        status = "Optimal"

        if crop in _soil_ranges.index:
            for col, label in SOIL_LABELS.items():
                val = getattr(p, col)
                if val is None:
                    continue
                low = float(_soil_ranges.loc[crop, f"{col}_low"])
                high = float(_soil_ranges.loc[crop, f"{col}_high"])
                if val < low:
                    issues.append({"parameter": label, "status": "low", "value": val, "low": low, "high": high})
                    key = (p.region or "Unknown", f"low {label.lower()}")
                    issue_tallies[key] = issue_tallies.get(key, 0) + 1
                elif val > high:
                    issues.append({"parameter": label, "status": "high", "value": val, "low": low, "high": high})
                    key = (p.region or "Unknown", f"high {label.lower()}")
                    issue_tallies[key] = issue_tallies.get(key, 0) + 1

        if len(issues) >= 2:
            status = "Critical"
        elif len(issues) == 1:
            status = "Attention"

        region = p.region or "Unknown"
        if region not in regional_counts:
            regional_counts[region] = {"total": 0, "issues_count": 0}
        regional_counts[region]["total"] += 1
        if len(issues) > 0:
            regional_counts[region]["issues_count"] += 1

        fields_data.append({
            "id": p.id,
            "user_id": u.id,
            "user_name": u.name,
            "user_email": u.email,
            "field_name": p.field_name,
            "crop_type": p.crop_type,
            "region": p.region,
            "soil_ph": p.soil_ph,
            "nitrogen_content": p.nitrogen_content,
            "phosphorus_content": p.phosphorus_content,
            "potassium_content": p.potassium_content,
            "field_size_hectares": p.field_size_hectares,
            "issues": issues,
            "status": status,
        })

    insights = []
    for (region, condition), count in sorted(issue_tallies.items(), key=lambda x: -x[1]):
        insights.append(f"{count} field{'s' if count != 1 else ''} in {region} {'have' if count != 1 else 'has'} {condition}")

    return jsonify({
        "fields": fields_data,
        "regional_counts": regional_counts,
        "insights": insights[:8],
    }), 200


# ---------------------------------------------------------------
# 5. Market Prices Endpoints
# ---------------------------------------------------------------
@admin_bp.route("/admin/market-prices", methods=["GET"])
@jwt_required()
@role_required("admin")
def get_market_prices():
    crops = list(_soil_ranges.index)
    saved = {mp.crop_type: mp for mp in MarketPrice.query.all()}

    result = []
    for c in crops:
        if c in saved:
            row = saved[c]
            result.append({
                "crop_type": c,
                "price_per_tonne": row.price_per_tonne,
                "cost_per_ha": row.cost_per_ha,
                "updated_at": row.updated_at.isoformat() if row.updated_at else None,
                "updated_by": row.updated_by or "Admin",
                "is_default": False,
            })
        else:
            result.append({
                "crop_type": c,
                "price_per_tonne": DEFAULT_PRICE_PER_TONNE.get(c, FALLBACK_PRICE),
                "cost_per_ha": DEFAULT_COST_PER_HA.get(c, FALLBACK_COST),
                "updated_at": None,
                "updated_by": "System Default",
                "is_default": True,
            })

    return jsonify({"market_prices": result}), 200


@admin_bp.route("/admin/market-prices", methods=["PUT", "POST"])
@jwt_required()
@role_required("admin")
def update_market_prices():
    data = request.get_json(silent=True) or {}
    prices_list = data.get("prices") or []

    if not isinstance(prices_list, list):
        return jsonify({"error": "Payload must include a 'prices' list."}), 400

    admin_user = User.query.get(int(get_jwt_identity()))
    admin_name = admin_user.name if admin_user else "Admin"

    for item in prices_list:
        crop = item.get("crop_type")
        if not crop or crop not in _soil_ranges.index:
            continue
        try:
            price = float(item.get("price_per_tonne", 0))
            cost = float(item.get("cost_per_ha", 0))
        except (ValueError, TypeError):
            continue

        existing = MarketPrice.query.filter_by(crop_type=crop).first()
        if existing:
            existing.price_per_tonne = price
            existing.cost_per_ha = cost
            existing.updated_by = admin_name
            existing.updated_at = datetime.utcnow()
        else:
            db.session.add(MarketPrice(
                crop_type=crop,
                price_per_tonne=price,
                cost_per_ha=cost,
                updated_by=admin_name,
            ))

    db.session.commit()
    return jsonify({"message": "Market prices updated successfully."}), 200


@admin_bp.route("/admin/market-prices/reset", methods=["POST"])
@jwt_required()
@role_required("admin")
def reset_market_prices():
    MarketPrice.query.delete()
    db.session.commit()
    return jsonify({"message": "Market prices reset to defaults."}), 200


# ---------------------------------------------------------------
# 6. System Status Diagnostics Endpoint
# ---------------------------------------------------------------
@admin_bp.route("/admin/system-status", methods=["GET"])
@jwt_required()
@role_required("admin")
def admin_system_status():
    diagnostics = {}

    # 1. Database Check
    db_start = time.time()
    try:
        db.session.execute(text("SELECT 1")).scalar()
        db_latency = round((time.time() - db_start) * 1000, 1)
        total_users = User.query.count()
        total_preds = PredictionHistory.query.count()
        diagnostics["database"] = {
            "status": "operational",
            "latency_ms": db_latency,
            "details": f"Connected. {total_users} users, {total_preds} predictions registered.",
        }
    except Exception as e:
        diagnostics["database"] = {
            "status": "down",
            "latency_ms": None,
            "details": f"Database error: {str(e)}",
        }

    # 2. XGBoost Model Check
    model_start = time.time()
    try:
        dummy_field = {
            "crop_type": "Wheat",
            "region": "North",
            "season": "Spring",
            "harvest_date": "2026-05-15",
            "soil_ph": 6.5,
            "soil_moisture": 30.0,
            "avg_temperature": 25.0,
            "total_rainfall": 600.0,
            "fertilizer_amount": 150.0,
            "pesticide_usage": 8.0,
            "sunlight_hours": 2000.0,
            "nitrogen_content": 1.5,
            "phosphorus_content": 1.0,
            "potassium_content": 1.2,
            "irrigation_frequency": 3,
        }
        X = preprocess_input(dummy_field)
        pred_y = float(_model.predict(X)[0])
        model_latency = round((time.time() - model_start) * 1000, 1)
        diagnostics["model"] = {
            "status": "operational",
            "latency_ms": model_latency,
            "details": f"Loaded 'xgboost_yield_model.pkl'. Test prediction: {round(pred_y, 2)} t/ha.",
        }
    except Exception as e:
        diagnostics["model"] = {
            "status": "down",
            "latency_ms": None,
            "details": f"Model inference error: {str(e)}",
        }

    # 3. Groq API Check
    if not GROQ_API_KEY:
        diagnostics["groq"] = {
            "status": "not_configured",
            "latency_ms": None,
            "details": "GROQ_API_KEY is not set in backend/.env.",
        }
    else:
        groq_start = time.time()
        try:
            res = requests.get("https://api.groq.com/openai/v1/models", headers={"Authorization": f"Bearer {GROQ_API_KEY}"}, timeout=4)
            groq_latency = round((time.time() - groq_start) * 1000, 1)
            if res.status_code == 200:
                diagnostics["groq"] = {
                    "status": "operational",
                    "latency_ms": groq_latency,
                    "details": f"Groq API reachable. Active Model: {GROQ_MODEL}",
                }
            else:
                diagnostics["groq"] = {
                    "status": "degraded",
                    "latency_ms": groq_latency,
                    "details": f"Status {res.status_code}: {res.text[:100]}",
                }
        except Exception as e:
            diagnostics["groq"] = {
                "status": "down",
                "latency_ms": None,
                "details": f"Network / Timeout: {str(e)}",
            }

    # 4. OpenWeather API Check
    if not OPENWEATHER_API_KEY:
        diagnostics["openweather"] = {
            "status": "not_configured",
            "latency_ms": None,
            "details": "OPENWEATHER_API_KEY is not set in backend/.env.",
        }
    else:
        ow_start = time.time()
        try:
            res = requests.get(
                OPENWEATHER_URL,
                params={"q": "Delhi,IN", "appid": OPENWEATHER_API_KEY, "units": "metric"},
                timeout=4,
            )
            ow_latency = round((time.time() - ow_start) * 1000, 1)
            if res.status_code == 200:
                temp = res.json().get("main", {}).get("temp")
                diagnostics["openweather"] = {
                    "status": "operational",
                    "latency_ms": ow_latency,
                    "details": f"Live weather operational. Delhi: {temp}°C.",
                }
            else:
                diagnostics["openweather"] = {
                    "status": "degraded",
                    "latency_ms": ow_latency,
                    "details": f"OpenWeather returned code {res.status_code}",
                }
        except Exception as e:
            diagnostics["openweather"] = {
                "status": "down",
                "latency_ms": None,
                "details": f"Timeout / Network error: {str(e)}",
            }

    # 5. Rate Limiter Configuration
    diagnostics["rate_limiter"] = {
        "status": "operational",
        "backend": current_app.config.get("RATELIMIT_STORAGE_URI", "memory://"),
        "rule": "30 requests / minute on /predict",
        "details": "Active. Throttling applied to protect ML service.",
    }

    all_ok = all(
        v.get("status") in ("operational", "not_configured")
        for k, v in diagnostics.items()
        if k != "rate_limiter"
    )

    return jsonify({
        "status": "healthy" if all_ok else "warning",
        "checked_at": datetime.utcnow().isoformat() + "Z",
        "services": diagnostics,
    }), 200