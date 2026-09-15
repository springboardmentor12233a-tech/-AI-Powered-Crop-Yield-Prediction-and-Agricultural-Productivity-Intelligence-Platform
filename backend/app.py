import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from predict_service import predict_and_generate_insight
from models import db
from auth import auth_bp

load_dotenv()

app = Flask(__name__)
CORS(app)  # allows requests from your Next.js frontend (localhost:3000)

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

db.init_app(app)
jwt = JWTManager(app)

app.register_blueprint(auth_bp, url_prefix="/auth")

with app.app_context():
    db.create_all()


@app.route("/")
def home():
    return {"message": "YieldSense AI backend is running"}


@app.route("/predict", methods=["POST"])
def predict():
    field = request.get_json()
    if field is None:
        return jsonify({"error": "Request body must be JSON"}), 400

    try:
        result = predict_and_generate_insight(field)
        return jsonify(result)
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {e}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)