import re
from functools import wraps
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, get_jwt, jwt_required
import bcrypt
from models import db, User
from extensions import limiter

auth_bp = Blueprint("auth", __name__)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MIN_PASSWORD_LEN = 8
MAX_PASSWORD_LEN = 72  # bcrypt ignores everything after 72 bytes


def _json_body() -> dict:
    """Never raises: a missing/invalid JSON body becomes {}."""
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def _clean_str(value) -> str:
    return value.strip() if isinstance(value, str) else ""


@auth_bp.route("/register", methods=["POST"])
@limiter.limit("5 per minute")
def register():
    data = _json_body()
    name = _clean_str(data.get("name"))
    email = _clean_str(data.get("email")).lower()
    password = data.get("password")

    if not name or not email or not isinstance(password, str) or not password:
        return jsonify({"error": "name, email, and password are required"}), 400
    if len(name) > 100 or len(email) > 120:
        return jsonify({"error": "name or email is too long"}), 400
    if not EMAIL_RE.match(email):
        return jsonify({"error": "Enter a valid email address"}), 400
    if len(password) < MIN_PASSWORD_LEN:
        return jsonify({"error": f"Password must be at least {MIN_PASSWORD_LEN} characters"}), 400
    if len(password.encode("utf-8")) > MAX_PASSWORD_LEN:
        return jsonify({"error": f"Password must be at most {MAX_PASSWORD_LEN} bytes"}), 400

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
@limiter.limit("10 per minute")
def login():
    data = _json_body()
    email = _clean_str(data.get("email")).lower()
    password = data.get("password")

    if not email or not isinstance(password, str) or not password:
        return jsonify({"error": "email and password are required"}), 400

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
