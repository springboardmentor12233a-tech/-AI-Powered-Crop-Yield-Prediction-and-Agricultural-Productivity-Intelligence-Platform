"""
Notifications (the bell) and active crop plans.
"""

from datetime import date, datetime, timedelta

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from auth import role_required
from models import db, FarmProfile, PredictionHistory, Announcement
from predict_service import get_all_soil_ranges, _soil_ranges
from planner import CROP_CALENDAR, GENERIC_CALENDAR

notifications_bp = Blueprint("notifications", __name__)

SOIL_LABELS = {
    "soil_ph": "Soil pH",
    "nitrogen_content": "Nitrogen",
    "phosphorus_content": "Phosphorus",
    "potassium_content": "Potassium",
}
MAX_LIST = 50


class CropPlan(db.Model):
    __tablename__ = "crop_plan"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    profile_id = db.Column(db.Integer, db.ForeignKey("farm_profile.id", ondelete="SET NULL"))
    field_name = db.Column(db.String(100))
    crop_type = db.Column(db.String(50), nullable=False)
    sowing_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())


class Notification(db.Model):
    __tablename__ = "notification"
    __table_args__ = (db.UniqueConstraint("user_id", "key", name="uq_notification_user_key"),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    kind = db.Column(db.String(20), nullable=False)  # soil | risk | task | announcement
    key = db.Column(db.String(200), nullable=False)
    data = db.Column(db.JSON)
    link = db.Column(db.String(100))
    is_read = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "kind": self.kind,
            "data": self.data or {},
            "link": self.link,
            "is_read": bool(self.is_read),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


def _add(user_id, kind, key, data, link):
    if Notification.query.filter_by(user_id=user_id, key=key).first():
        return
    db.session.add(Notification(user_id=user_id, kind=kind, key=key, data=data, link=link))


def _sync_soil(user_id):
    ranges = {c["crop_type"]: c["ranges"] for c in get_all_soil_ranges()}
    current = set()

    for p in FarmProfile.query.filter_by(user_id=user_id).all():
        crop_ranges = ranges.get(p.crop_type)
        if not crop_ranges:
            continue
        for col, label in SOIL_LABELS.items():
            value = getattr(p, col)
            if value is None:
                continue
            low, high = crop_ranges[col]["low"], crop_ranges[col]["high"]
            if value < low:
                status = "too low"
            elif value > high:
                status = "too high"
            else:
                continue
            key = f"soil:{p.id}:{col}:{status}:{value}"
            current.add(key)
            _add(user_id, "soil", key, {
                "field": p.field_name, "crop": p.crop_type, "parameter": label,
                "status": status, "value": value, "low": low, "high": high,
            }, "/profile")

    for n in Notification.query.filter_by(user_id=user_id, kind="soil").all():
        if n.key not in current:
            db.session.delete(n)


def _sync_risk(user_id):
    cutoff = datetime.now() - timedelta(days=7)
    rows = (
        PredictionHistory.query
        .filter(
            PredictionHistory.user_id == user_id,
            PredictionHistory.risk_level == "High",
            PredictionHistory.created_at >= cutoff,
        )
        .order_by(PredictionHistory.created_at.desc())
        .limit(5)
        .all()
    )
    for r in rows:
        _add(user_id, "risk", f"risk:{r.id}", {
            "crop": r.crop_type, "region": r.region, "yield": r.predicted_yield,
        }, "/history")


def _plan_steps(plan):
    calendar = CROP_CALENDAR.get(plan.crop_type, GENERIC_CALENDAR)
    return calendar, [
        (i, s, plan.sowing_date + timedelta(days=s["day"]))
        for i, s in enumerate(calendar["steps"])
    ]


def _sync_tasks(user_id):
    today = date.today()
    for plan in CropPlan.query.filter_by(user_id=user_id).all():
        _, steps = _plan_steps(plan)
        for i, s, d in steps:
            if -1 <= (d - today).days <= 1:
                _add(user_id, "task", f"task:{plan.id}:{i}", {
                    "crop": plan.crop_type, "field": plan.field_name,
                    "title": s["title"], "detail": s["detail"], "date": d.isoformat(),
                }, "/planner")


def _sync_announcements(user_id):
    """Syncs recent admin broadcasts to the farmer's notification bell."""
    announcements = Announcement.query.order_by(Announcement.created_at.desc()).limit(20).all()
    for a in announcements:
        _add(user_id, "announcement", f"announcement:{a.id}", {
            "title": a.title,
            "message": a.message,
            "category": a.category,
        }, "/dashboard")


def _sync(user_id):
    try:
        _sync_soil(user_id)
        _sync_risk(user_id)
        _sync_tasks(user_id)
        _sync_announcements(user_id)
        db.session.commit()
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Notification sync failed")


@notifications_bp.route("/notifications", methods=["GET"])
@jwt_required()
@role_required("farmer")
def list_notifications():
    user_id = int(get_jwt_identity())
    _sync(user_id)
    rows = (
        Notification.query.filter_by(user_id=user_id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .limit(MAX_LIST)
        .all()
    )
    unread = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    return jsonify({"notifications": [n.to_dict() for n in rows], "unread": unread}), 200


@notifications_bp.route("/notifications/read-all", methods=["POST"])
@jwt_required()
@role_required("farmer")
def read_all():
    user_id = int(get_jwt_identity())
    Notification.query.filter_by(user_id=user_id, is_read=False).update({"is_read": True})
    db.session.commit()
    return jsonify({"message": "ok"}), 200


@notifications_bp.route("/notifications/<int:notification_id>/read", methods=["POST"])
@jwt_required()
@role_required("farmer")
def read_one(notification_id):
    user_id = int(get_jwt_identity())
    n = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
    if not n:
        return jsonify({"error": "Notification not found"}), 404
    n.is_read = True
    db.session.commit()
    return jsonify({"message": "ok"}), 200


def _drop_plan(plan):
    Notification.query.filter(
        Notification.user_id == plan.user_id,
        Notification.key.like(f"task:{plan.id}:%"),
    ).delete(synchronize_session=False)
    db.session.delete(plan)


def _plan_to_dict(plan):
    calendar, steps = _plan_steps(plan)
    today = date.today()
    next_step = None
    for _, s, d in steps:
        if d >= today:
            next_step = {"title": s["title"], "date": d.isoformat()}
            break
    return {
        "id": plan.id,
        "field_name": plan.field_name,
        "crop_type": plan.crop_type,
        "sowing_date": plan.sowing_date.isoformat(),
        "harvest_date": (plan.sowing_date + timedelta(days=calendar["duration_days"])).isoformat(),
        "next_step": next_step,
    }


@notifications_bp.route("/planner/start", methods=["POST"])
@jwt_required()
@role_required("farmer")
def start_plan():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    try:
        profile_id = int(data.get("profile_id"))
    except (TypeError, ValueError):
        return jsonify({"error": "profile_id is required"}), 400
    profile = FarmProfile.query.filter_by(id=profile_id, user_id=user_id).first()
    if not profile:
        return jsonify({"error": "Field not found"}), 404

    crop = data.get("crop_type")
    if crop not in list(_soil_ranges.index):
        return jsonify({"error": "Unknown crop"}), 400

    try:
        start = datetime.strptime(str(data.get("sowing_date")), "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "sowing_date must look like 2026-11-15"}), 400

    replaced = False
    for old in CropPlan.query.filter_by(user_id=user_id, profile_id=profile.id).all():
        _drop_plan(old)
        replaced = True

    plan = CropPlan(
        user_id=user_id, profile_id=profile.id, field_name=profile.field_name,
        crop_type=crop, sowing_date=start,
    )
    db.session.add(plan)
    db.session.commit()

    _sync(user_id)
    return jsonify({"message": "Plan started", "replaced": replaced, "plan": _plan_to_dict(plan)}), 201


@notifications_bp.route("/planner/plans", methods=["GET"])
@jwt_required()
@role_required("farmer")
def list_plans():
    user_id = int(get_jwt_identity())
    plans = CropPlan.query.filter_by(user_id=user_id).order_by(CropPlan.id.desc()).all()
    return jsonify({"plans": [_plan_to_dict(p) for p in plans]}), 200


@notifications_bp.route("/planner/plans/<int:plan_id>", methods=["DELETE"])
@jwt_required()
@role_required("farmer")
def stop_plan(plan_id):
    user_id = int(get_jwt_identity())
    plan = CropPlan.query.filter_by(id=plan_id, user_id=user_id).first()
    if not plan:
        return jsonify({"error": "Plan not found"}), 404
    _drop_plan(plan)
    db.session.commit()
    return jsonify({"message": "Plan stopped"}), 200