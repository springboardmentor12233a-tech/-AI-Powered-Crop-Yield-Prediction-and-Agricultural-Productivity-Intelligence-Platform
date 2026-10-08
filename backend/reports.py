"""
Farmer reports.

GET /reports/compare-fields  (JWT, farmers only)
Compares all of the farmer's saved fields side by side: each soil value is
checked against the healthy range for that field's crop, and the latest
prediction made for that field is attached if one exists.
"""

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from auth import role_required
from models import FarmProfile, PredictionHistory
from predict_service import get_all_soil_ranges

reports_bp = Blueprint("reports", __name__)

# Saved fields don't store soil moisture, so it's not part of this comparison.
PROFILE_SOIL_COLS = ["soil_ph", "nitrogen_content", "phosphorus_content", "potassium_content"]


def _status(value, low, high):
    if value < low:
        return "too low"
    if value > high:
        return "too high"
    return "healthy"


@reports_bp.route("/reports/compare-fields", methods=["GET"])
@jwt_required()
@role_required("farmer")
def compare_fields():
    user_id = int(get_jwt_identity())
    crop_info = {c["crop_type"]: c for c in get_all_soil_ranges()}
    profiles = FarmProfile.query.filter_by(user_id=user_id).order_by(FarmProfile.id).all()

    result = []
    for p in profiles:
        crop = crop_info.get(p.crop_type)
        soil = {}
        healthy_count = 0
        checked_count = 0

        for col in PROFILE_SOIL_COLS:
            value = getattr(p, col)
            if crop is None or value is None:
                soil[col] = {"value": value, "status": "unknown", "low": None, "high": None}
                continue
            low, high = crop["ranges"][col]["low"], crop["ranges"][col]["high"]
            status = _status(value, low, high)
            checked_count += 1
            healthy_count += status == "healthy"
            soil[col] = {"value": value, "status": status, "low": low, "high": high}

        # Match on the field itself, so two fields with the same crop and
        # region no longer share one "latest prediction".
        latest = (
            PredictionHistory.query.filter_by(user_id=user_id, profile_id=p.id)
            .order_by(PredictionHistory.created_at.desc())
            .first()
        )
        # Legacy rows (made before profile_id existed) have no link to a
        # field, so for those only, fall back to the old crop + region match.
        if latest is None:
            latest = (
                PredictionHistory.query.filter_by(
                    user_id=user_id, profile_id=None,
                    crop_type=p.crop_type, region=p.region,
                )
                .order_by(PredictionHistory.created_at.desc())
                .first()
            )
        latest_prediction = None
        estimated_production = None
        if latest and latest.predicted_yield is not None:
            latest_prediction = {
                "predicted_yield": latest.predicted_yield,
                "risk_level": latest.risk_level,
                "created_at": latest.created_at.isoformat() if latest.created_at else None,
            }
            if p.field_size_hectares:
                estimated_production = round(latest.predicted_yield * p.field_size_hectares, 1)

        result.append({
            "id": p.id,
            "field_name": p.field_name,
            "crop_type": p.crop_type,
            "region": p.region,
            "field_size_hectares": p.field_size_hectares,
            "soil": soil,
            "healthy_count": healthy_count,
            "checked_count": checked_count,
            "typical_yield": crop["avg_yield"] if crop else None,
            "latest_prediction": latest_prediction,
            "estimated_production": estimated_production,
        })

    return jsonify(result), 200