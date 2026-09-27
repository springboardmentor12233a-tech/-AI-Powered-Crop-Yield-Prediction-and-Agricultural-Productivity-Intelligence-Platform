from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, FarmProfile

farm_profile_bp = Blueprint("farm_profile", __name__)

EDITABLE_FIELDS = [
    "field_name", "crop_type", "region", "soil_ph",
    "nitrogen_content", "phosphorus_content", "potassium_content",
]


@farm_profile_bp.route("/profiles", methods=["GET"])
@jwt_required()
def list_profiles():
    """Returns every saved field/profile for the logged-in user."""
    user_id = int(get_jwt_identity())
    profiles = FarmProfile.query.filter_by(user_id=user_id).order_by(FarmProfile.id).all()
    return jsonify([p.to_dict() for p in profiles]), 200


@farm_profile_bp.route("/profiles", methods=["POST"])
@jwt_required()
def create_profile():
    """Creates a new saved field/profile for the logged-in user."""
    user_id = int(get_jwt_identity())
    data = request.get_json()

    profile = FarmProfile(user_id=user_id)
    for field in EDITABLE_FIELDS:
        if field in data:
            setattr(profile, field, data[field])

    db.session.add(profile)
    db.session.commit()
    return jsonify({"message": "Profile created", "profile": profile.to_dict()}), 201


@farm_profile_bp.route("/profiles/<int:profile_id>", methods=["PUT"])
@jwt_required()
def update_profile(profile_id):
    """Updates one of the logged-in user's own saved profiles."""
    user_id = int(get_jwt_identity())
    profile = FarmProfile.query.filter_by(id=profile_id, user_id=user_id).first()
    if not profile:
        return jsonify({"error": "Profile not found"}), 404

    data = request.get_json()
    for field in EDITABLE_FIELDS:
        if field in data:
            setattr(profile, field, data[field])

    db.session.commit()
    return jsonify({"message": "Profile updated", "profile": profile.to_dict()}), 200


@farm_profile_bp.route("/profiles/<int:profile_id>", methods=["DELETE"])
@jwt_required()
def delete_profile(profile_id):
    """Deletes one of the logged-in user's own saved profiles."""
    user_id = int(get_jwt_identity())
    profile = FarmProfile.query.filter_by(id=profile_id, user_id=user_id).first()
    if not profile:
        return jsonify({"error": "Profile not found"}), 404

    db.session.delete(profile)
    db.session.commit()
    return jsonify({"message": "Profile deleted"}), 200