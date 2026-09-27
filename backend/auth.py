from functools import wraps
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, get_jwt, jwt_required
import bcrypt
from models import db, User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not all([name, email, password]):
        return jsonify({"error": "name, email, and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    # role is never taken from the request - always defaults to "farmer"
    # (see models.py). Admin accounts are created separately, not via
    # public self-registration.
    user = User(name=name, email=email, password_hash=password_hash)
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "User registered successfully", "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.checkpw(password.encode("utf-8"), user.password_hash.encode("utf-8")):
        return jsonify({"error": "Invalid email or password"}), 401

    # role is embedded directly in the JWT as a custom claim, so every
    # later request can be checked against the *token's* role - not
    # something read from localStorage, which the client could tamper with.
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role},
    )
    return jsonify({"access_token": access_token, "user": user.to_dict()}), 200


def role_required(*allowed_roles):
    """
    Route decorator that restricts access to users whose JWT role claim
    is in allowed_roles. Use it under @jwt_required() on any route, e.g.:

        @app.route("/admin/users")
        @jwt_required()
        @role_required("admin")
        def list_users():
            ...
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            if claims.get("role") not in allowed_roles:
                return jsonify({"error": "Forbidden: insufficient role"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator