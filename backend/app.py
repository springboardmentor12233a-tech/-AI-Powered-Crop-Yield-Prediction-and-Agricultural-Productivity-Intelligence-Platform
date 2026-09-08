from flask import Flask, request, jsonify
from predict_service import predict_and_generate_insight

app = Flask(__name__)

@app.route("/")
def home():
    return {"message": "YieldSense AI backend is running"}


@app.route("/predict", methods=["POST"])
def predict():
    """
    Expects a JSON body with all field inputs, e.g.:
    {
      "crop_type": "Wheat", "region": "North", "season": "Autumn",
      "harvest_date": "2021-03-09", "soil_ph": 5.09, "soil_moisture": 49.73,
      "avg_temperature": 22.40, "total_rainfall": 625.27,
      "fertilizer_amount": 150.0, "pesticide_usage": 8.0,
      "sunlight_hours": 2000.0, "nitrogen_content": 2.32,
      "phosphorus_content": 1.14, "potassium_content": 1.45,
      "irrigation_frequency": 3
    }
    Returns: predicted_yield, soil_flags, weather_context, llm_insight
    """
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