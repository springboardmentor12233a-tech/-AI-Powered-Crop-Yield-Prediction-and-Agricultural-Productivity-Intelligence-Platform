from flask import Flask, jsonify, request
import mysql.connector
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt
from flask_cors import CORS

app = Flask(__name__)

# Allow frontend to communicate with Flask backend
CORS(app)

# Security configuration
app.config["JWT_SECRET_KEY"] = "yieldsense-ai-secret-key"

bcrypt = Bcrypt(app)
jwt = JWTManager(app)


# MySQL database connection
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="YieldSense@123",
    database="yieldsense_ai"
)


# --------------------------------------------------
# HOME
# --------------------------------------------------

@app.route("/")
def home():
    return jsonify({
        "message": "YieldSense AI Backend is running successfully!"
    })


# --------------------------------------------------
# DATABASE TEST
# --------------------------------------------------

@app.route("/db-test")
def db_test():

    cursor = db.cursor()

    cursor.execute("SELECT DATABASE()")

    result = cursor.fetchone()

    cursor.close()

    return jsonify({
        "database": result[0],
        "message": "MySQL connection successful!"
    })


# --------------------------------------------------
# REGISTER
# --------------------------------------------------

@app.route("/register", methods=["POST"])
def register():

    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    # Check required fields
    if not name or not email or not password:

        return jsonify({
            "message": "Name, email and password are required"
        }), 400


    cursor = db.cursor()

    # Check whether email already exists
    cursor.execute(
        "SELECT user_id FROM users WHERE email = %s",
        (email,)
    )

    existing_user = cursor.fetchone()


    if existing_user:

        cursor.close()

        return jsonify({
            "message": "Email already registered"
        }), 409


    # Hash password
    hashed_password = bcrypt.generate_password_hash(
        password
    ).decode("utf-8")


    # Insert new user
    cursor.execute(
        """
        INSERT INTO users (name, email, password, role)
        VALUES (%s, %s, %s, %s)
        """,
        (
            name,
            email,
            hashed_password,
            "user"
        )
    )


    db.commit()

    cursor.close()


    return jsonify({
        "message": "User registered successfully!"
    }), 201


# --------------------------------------------------
# LOGIN
# --------------------------------------------------

@app.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")


    # Check required fields
    if not email or not password:

        return jsonify({
            "message": "Email and password are required"
        }), 400


    cursor = db.cursor(dictionary=True)


    # Find user by email
    cursor.execute(
        "SELECT * FROM users WHERE email = %s",
        (email,)
    )

    user = cursor.fetchone()

    cursor.close()


    # User not found
    if not user:

        return jsonify({
            "message": "Invalid email or password"
        }), 401


    # Check password
    if not bcrypt.check_password_hash(
        user["password"],
        password
    ):

        return jsonify({
            "message": "Invalid email or password"
        }), 401


    # Create JWT token with user ID and role
    access_token = create_access_token(
        identity=str(user["user_id"]),
        additional_claims={
            "role": user["role"]
        }
    )


    return jsonify({

        "message": "Login successful!",

        "access_token": access_token,

        "user": {

            "user_id": user["user_id"],

            "name": user["name"],

            "email": user["email"],

            "role": user["role"]

        }

    })


# --------------------------------------------------
# PROTECTED PROFILE
# --------------------------------------------------

@app.route("/profile")
@jwt_required()
def profile():

    claims = get_jwt()

    return jsonify({
        "message": "Authentication successful!",
        "role": claims["role"]
    })


# --------------------------------------------------
# ADMIN ONLY
# --------------------------------------------------

@app.route("/admin")
@jwt_required()
def admin():

    claims = get_jwt()

    if claims["role"] != "admin":
        return jsonify({
            "message": "Admin access required"
        }), 403

    return jsonify({
        "message": "Welcome Admin! You have admin access.",
        "role": claims["role"]
    })


    # --------------------------------------------------
# RUN APPLICATION
# --------------------------------------------------

if __name__ == "__main__":

    app.run(
        debug=True
    )