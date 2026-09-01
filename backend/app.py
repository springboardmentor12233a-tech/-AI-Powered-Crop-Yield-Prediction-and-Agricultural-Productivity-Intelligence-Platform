from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return jsonify({
        "message": "Backend is running successfully!"
    })


@app.route("/api/status")
def status():
    return jsonify({
        "project": "YieldSense AI",
        "status": "Backend connected successfully",
        "module": "Crop Yield Prediction"
    })


if __name__ == "__main__":
    app.run(debug=True)