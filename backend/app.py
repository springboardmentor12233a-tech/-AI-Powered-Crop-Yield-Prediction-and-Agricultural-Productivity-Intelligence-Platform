from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
import os
import joblib
import pandas as pd
import numpy as np

app = Flask(__name__)
CORS(app)

# -----------------------------
# Load trained ML pipeline
# -----------------------------
MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "models",
    "best_crop_yield_model.joblib"
)

DATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "datasets",
    "Smart_Farming_Crop_Yield_2024.csv"
)

try:
    model = joblib.load(MODEL_PATH)
except Exception as e:
    model = None
    print(f"Warning: Could not load model — {e}")

# -----------------------------
# Connect Groq AI
# -----------------------------
api_key = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=api_key) if api_key else None


# -----------------------------
# Input validation helpers
# -----------------------------
VALID_CROPS = ["Wheat", "Rice", "Maize", "Cotton", "Soybean", "Sugarcane"]
VALID_REGIONS = ["North India", "South India", "East India", "West India",
                 "Central India", "South USA", "Central USA", "East Africa"]
VALID_IRRIGATIONS = ["Drip", "Sprinkler", "Manual"]


def validate_farm_input(data):
    """Validate farm input data and return errors list."""
    errors = []

    if not data:
        return ["No input data provided"]

    crop = data.get("crop")
    region = data.get("region")

    if not crop:
        errors.append("Crop type is required")
    if not region:
        errors.append("Region is required")

    # Numeric validations
    numeric_fields = {
        "soil_moisture": {"min": 0, "max": 100, "label": "Soil Moisture (%)"},
        "soil_ph": {"min": 0, "max": 14, "label": "Soil pH"},
        "temperature": {"min": -20, "max": 60, "label": "Temperature (°C)"},
        "rainfall": {"min": 0, "max": 1000, "label": "Rainfall (mm)"},
        "humidity": {"min": 0, "max": 100, "label": "Humidity (%)"},
        "sunlight": {"min": 0, "max": 24, "label": "Sunlight (hours/day)"},
    }

    for field, constraints in numeric_fields.items():
        value = data.get(field)
        if value is None or value == "":
            errors.append(f"{constraints['label']} is required")
            continue

        try:
            val = float(value)
            if val < constraints["min"] or val > constraints["max"]:
                errors.append(
                    f"{constraints['label']} must be between "
                    f"{constraints['min']} and {constraints['max']}"
                )
        except (ValueError, TypeError):
            errors.append(f"{constraints['label']} must be a valid number")

    irrigation = data.get("irrigation_type")
    if not irrigation:
        errors.append("Irrigation type is required")

    return errors


# Risk thresholds — configurable per crop where available
RISK_THRESHOLDS = {
    "default": {
        "soil_moisture": {"low": 15, "high": 80, "optimal_low": 25, "optimal_high": 60},
        "soil_ph": {"low": 5.0, "high": 8.5, "optimal_low": 6.0, "optimal_high": 7.5},
        "temperature": {"low": 10, "high": 42, "optimal_low": 18, "optimal_high": 35},
        "rainfall": {"low": 30, "high": 300, "optimal_low": 50, "optimal_high": 200},
        "humidity": {"low": 30, "high": 90, "optimal_low": 50, "optimal_high": 80},
    },
    "Wheat": {
        "soil_moisture": {"low": 15, "high": 70, "optimal_low": 20, "optimal_high": 55},
        "soil_ph": {"low": 5.5, "high": 8.0, "optimal_low": 6.0, "optimal_high": 7.5},
        "temperature": {"low": 10, "high": 30, "optimal_low": 15, "optimal_high": 25},
        "rainfall": {"low": 25, "high": 250, "optimal_low": 50, "optimal_high": 150},
        "humidity": {"low": 30, "high": 85, "optimal_low": 40, "optimal_high": 70},
    },
    "Rice": {
        "soil_moisture": {"low": 25, "high": 90, "optimal_low": 40, "optimal_high": 75},
        "soil_ph": {"low": 5.0, "high": 7.5, "optimal_low": 5.5, "optimal_high": 6.5},
        "temperature": {"low": 20, "high": 40, "optimal_low": 25, "optimal_high": 35},
        "rainfall": {"low": 60, "high": 350, "optimal_low": 100, "optimal_high": 250},
        "humidity": {"low": 50, "high": 95, "optimal_low": 60, "optimal_high": 85},
    },
    "Maize": {
        "soil_moisture": {"low": 15, "high": 75, "optimal_low": 25, "optimal_high": 60},
        "soil_ph": {"low": 5.5, "high": 8.0, "optimal_low": 5.8, "optimal_high": 7.0},
        "temperature": {"low": 15, "high": 38, "optimal_low": 20, "optimal_high": 32},
        "rainfall": {"low": 30, "high": 300, "optimal_low": 60, "optimal_high": 200},
        "humidity": {"low": 40, "high": 85, "optimal_low": 50, "optimal_high": 75},
    },
    "Cotton": {
        "soil_moisture": {"low": 15, "high": 70, "optimal_low": 20, "optimal_high": 55},
        "soil_ph": {"low": 5.5, "high": 8.5, "optimal_low": 6.0, "optimal_high": 8.0},
        "temperature": {"low": 18, "high": 42, "optimal_low": 25, "optimal_high": 35},
        "rainfall": {"low": 30, "high": 250, "optimal_low": 50, "optimal_high": 150},
        "humidity": {"low": 30, "high": 80, "optimal_low": 40, "optimal_high": 65},
    },
    "Soybean": {
        "soil_moisture": {"low": 20, "high": 80, "optimal_low": 30, "optimal_high": 65},
        "soil_ph": {"low": 5.5, "high": 7.5, "optimal_low": 6.0, "optimal_high": 7.0},
        "temperature": {"low": 15, "high": 38, "optimal_low": 20, "optimal_high": 30},
        "rainfall": {"low": 40, "high": 300, "optimal_low": 60, "optimal_high": 200},
        "humidity": {"low": 40, "high": 85, "optimal_low": 50, "optimal_high": 75},
    },
}


def assess_risks(data):
    """Assess agricultural risks based on farm input data."""
    crop = data.get("crop", "")
    thresholds = RISK_THRESHOLDS.get(crop, RISK_THRESHOLDS["default"])
    risks = []

    field_map = {
        "soil_moisture": {"value": data.get("soil_moisture"), "unit": "%", "label": "Soil Moisture"},
        "soil_ph": {"value": data.get("soil_ph"), "unit": "", "label": "Soil pH"},
        "temperature": {"value": data.get("temperature"), "unit": "°C", "label": "Temperature"},
        "rainfall": {"value": data.get("rainfall"), "unit": "mm", "label": "Rainfall"},
        "humidity": {"value": data.get("humidity"), "unit": "%", "label": "Humidity"},
    }

    for field_key, field_info in field_map.items():
        value = field_info["value"]
        if value is None:
            continue

        try:
            val = float(value)
        except (ValueError, TypeError):
            continue

        t = thresholds[field_key]
        label = field_info["label"]
        unit = field_info["unit"]

        if val < t["low"]:
            risks.append({
                "factor": label,
                "level": "High",
                "value": f"{val}{unit}",
                "message": f"{label} ({val}{unit}) is critically low. "
                           f"Optimal range for {crop or 'most crops'}: "
                           f"{t['optimal_low']}–{t['optimal_high']}{unit}.",
                "recommendation": get_risk_recommendation(field_key, "low", crop)
            })
        elif val < t["optimal_low"]:
            risks.append({
                "factor": label,
                "level": "Moderate",
                "value": f"{val}{unit}",
                "message": f"{label} ({val}{unit}) is below the optimal range. "
                           f"Optimal: {t['optimal_low']}–{t['optimal_high']}{unit}.",
                "recommendation": get_risk_recommendation(field_key, "below_optimal", crop)
            })
        elif val > t["high"]:
            risks.append({
                "factor": label,
                "level": "High",
                "value": f"{val}{unit}",
                "message": f"{label} ({val}{unit}) is critically high. "
                           f"Optimal range for {crop or 'most crops'}: "
                           f"{t['optimal_low']}–{t['optimal_high']}{unit}.",
                "recommendation": get_risk_recommendation(field_key, "high", crop)
            })
        elif val > t["optimal_high"]:
            risks.append({
                "factor": label,
                "level": "Moderate",
                "value": f"{val}{unit}",
                "message": f"{label} ({val}{unit}) is above the optimal range. "
                           f"Optimal: {t['optimal_low']}–{t['optimal_high']}{unit}.",
                "recommendation": get_risk_recommendation(field_key, "above_optimal", crop)
            })
        else:
            risks.append({
                "factor": label,
                "level": "Low",
                "value": f"{val}{unit}",
                "message": f"{label} ({val}{unit}) is within the optimal range "
                           f"({t['optimal_low']}–{t['optimal_high']}{unit}).",
                "recommendation": "No action needed — value is within the optimal range."
            })

    # Overall risk
    levels = [r["level"] for r in risks]
    if levels.count("High") >= 2:
        overall = "High"
    elif "High" in levels or levels.count("Moderate") >= 2:
        overall = "Moderate"
    else:
        overall = "Low"

    return {
        "overall_risk": overall,
        "risks": risks,
        "note": ("These risk levels are indicative and based on general "
                 "agricultural thresholds. Crop-specific thresholds are used "
                 f"for {crop} where available. Local verification with an "
                 "agronomist is recommended.")
    }


def get_risk_recommendation(field, direction, crop):
    """Return practical recommendations based on risk factor and direction."""
    recommendations = {
        "soil_moisture": {
            "low": "Increase irrigation frequency. Consider mulching to retain soil moisture.",
            "below_optimal": "Monitor moisture levels and consider supplemental irrigation.",
            "high": "Improve drainage. Reduce irrigation frequency to prevent waterlogging.",
            "above_optimal": "Slightly reduce irrigation. Monitor for signs of overwatering."
        },
        "soil_ph": {
            "low": "Apply agricultural lime to raise soil pH. Test soil regularly.",
            "below_optimal": "Consider light liming to gradually raise pH to the optimal range.",
            "high": "Apply sulfur or acidifying fertilizers to lower soil pH.",
            "above_optimal": "Monitor pH and consider acidifying amendments if trend continues."
        },
        "temperature": {
            "low": "Use protective covers, row covers, or greenhouses to raise temperature.",
            "below_optimal": "Consider planting timing adjustments for warmer periods.",
            "high": "Provide shade, increase irrigation, and consider heat-tolerant varieties.",
            "above_optimal": "Increase watering frequency and consider partial shading."
        },
        "rainfall": {
            "low": "Implement supplemental irrigation. Consider drought-tolerant crop varieties.",
            "below_optimal": "Monitor water needs closely and supplement with irrigation if needed.",
            "high": "Ensure proper field drainage. Watch for flooding and fungal diseases.",
            "above_optimal": "Check drainage systems and monitor for waterlogging."
        },
        "humidity": {
            "low": "Consider overhead irrigation to increase ambient humidity.",
            "below_optimal": "Monitor crop stress indicators and adjust irrigation.",
            "high": "Improve air circulation. Watch for fungal diseases. Consider spacing plants wider.",
            "above_optimal": "Monitor for early signs of fungal diseases and improve ventilation."
        },
    }
    return recommendations.get(field, {}).get(direction, "Monitor conditions and consult local agricultural advisors.")


# -----------------------------
# Home route
# -----------------------------
@app.route("/")
def home():
    return jsonify({
        "message": "Smart Farming Backend is running!",
        "endpoints": [
            "GET  /",
            "POST /api/predict",
            "POST /api/insights",
            "GET  /api/dashboard",
            "POST /api/risk-assessment",
            "GET  /api/reports"
        ]
    })


# -----------------------------
# ML Prediction API
# -----------------------------
@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        if model is None:
            return jsonify({
                "success": False,
                "error": "ML model is not loaded. Check that best_crop_yield_model.joblib exists."
            }), 500

        data = request.get_json()

        # Validate input
        errors = validate_farm_input(data)
        if errors:
            return jsonify({
                "success": False,
                "error": "; ".join(errors)
            }), 400

        # The trained pipeline expects these 20 feature columns.
        # Fields that the user form does not collect get None (the
        # pipeline's imputer / encoder should handle missing values).
        input_data = {
            "region": data.get("region"),
            "crop_type": data.get("crop"),
            "soil_moisture_%": float(data.get("soil_moisture")),
            "soil_pH": float(data.get("soil_ph")),
            "temperature_C": float(data.get("temperature")),
            "rainfall_mm": float(data.get("rainfall")),
            "humidity_%": float(data.get("humidity")),
            "sunlight_hours": float(data.get("sunlight")),
            "irrigation_type": data.get("irrigation_type"),
            "fertilizer_type": None,
            "pesticide_usage_ml": None,
            "total_days": None,
            "latitude": None,
            "longitude": None,
            "NDVI_index": None,
            "crop_disease_status": None,
            "sowing_month": None,
            "sowing_dayofyear": None,
            "harvest_month": None,
            "harvest_dayofyear": None
        }

        # Convert to DataFrame
        input_df = pd.DataFrame([input_data])

        # Actual trained ML model prediction
        prediction = model.predict(input_df)[0]
        prediction = round(float(prediction), 2)

        # Also compute risk assessment inline
        risk_data = assess_risks(data)

        return jsonify({
            "success": True,
            "predicted_yield": prediction,
            "unit": "kg/ha",
            "disclaimer": (
                "This is a model estimate from the trained Random Forest pipeline. "
                "It is not a guaranteed harvest yield. The current model has limited "
                "predictive accuracy (negative R² in evaluation) and should be used "
                "for indicative purposes only."
            ),
            "risk_assessment": risk_data
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# -----------------------------
# Groq AI Agricultural Insights
# -----------------------------
@app.route("/api/insights", methods=["POST"])
def generate_insights():
    try:
        if not client:
            return jsonify({
                "success": False,
                "error": "GROQ_API_KEY is not configured. Set the environment variable and restart."
            }), 500

        farm_data = request.get_json()

        prompt = f"""Analyze this farm data and provide structured agricultural insights:

Farm Details:
- Crop: {farm_data.get('crop', 'N/A')}
- Region: {farm_data.get('region', 'N/A')}
- Soil Moisture: {farm_data.get('soil_moisture', 'N/A')}%
- Soil pH: {farm_data.get('soil_ph', 'N/A')}
- Temperature: {farm_data.get('temperature', 'N/A')}°C
- Rainfall: {farm_data.get('rainfall', 'N/A')} mm
- Humidity: {farm_data.get('humidity', 'N/A')}%
- Sunlight: {farm_data.get('sunlight', 'N/A')} hours/day
- Irrigation: {farm_data.get('irrigation_type', 'N/A')}
- Predicted Yield: {farm_data.get('predicted_yield', 'N/A')} kg/ha

Please provide your response in these sections:
1. **Key Observations** — What stands out about these conditions
2. **Potential Risks** — Agricultural risks based on these conditions
3. **Soil Management** — Recommendations for soil health
4. **Irrigation Advice** — Water management suggestions
5. **Nutrient Management** — Fertilizer and nutrient recommendations
6. **Practical Next Steps** — Actionable steps for the farmer

Keep advice specific to the supplied data. Do not invent missing measurements.
Use simple, practical language."""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an agricultural AI assistant. "
                        "Analyze the supplied farm data carefully. "
                        "Give concise observations, possible risks, "
                        "and practical recommendations. "
                        "Do not invent missing measurements. "
                        "Use simple English."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=1500
        )

        insights = response.choices[0].message.content

        return jsonify({
            "success": True,
            "insights": insights
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# -----------------------------
# Dashboard Analytics API
# -----------------------------
@app.route("/api/dashboard", methods=["GET"])
def dashboard_data():
    try:
        df = pd.read_csv(DATA_PATH)

        average_yield = float(df["yield_kg_per_hectare"].mean())
        minimum_yield = float(df["yield_kg_per_hectare"].min())
        maximum_yield = float(df["yield_kg_per_hectare"].max())
        std_yield = float(df["yield_kg_per_hectare"].std())

        crop_data = (
            df.groupby("crop_type")["yield_kg_per_hectare"]
            .mean()
            .round(2)
            .to_dict()
        )

        region_data = (
            df.groupby("region")["yield_kg_per_hectare"]
            .mean()
            .round(2)
            .to_dict()
        )

        # Additional stats for enhanced dashboard
        crop_count = df["crop_type"].value_counts().to_dict()
        region_count = df["region"].value_counts().to_dict()

        # Crop-wise min/max
        crop_stats = (
            df.groupby("crop_type")["yield_kg_per_hectare"]
            .agg(["mean", "min", "max", "std", "count"])
            .round(2)
            .to_dict(orient="index")
        )

        # Region-wise stats
        region_stats = (
            df.groupby("region")["yield_kg_per_hectare"]
            .agg(["mean", "min", "max", "std", "count"])
            .round(2)
            .to_dict(orient="index")
        )

        # Irrigation type stats
        irrigation_stats = (
            df.groupby("irrigation_type")["yield_kg_per_hectare"]
            .agg(["mean", "count"])
            .round(2)
            .to_dict(orient="index")
        )

        # Environmental averages by crop
        env_by_crop = {}
        for crop in df["crop_type"].unique():
            crop_df = df[df["crop_type"] == crop]
            env_by_crop[crop] = {
                "avg_moisture": round(float(crop_df["soil_moisture_%"].mean()), 2),
                "avg_ph": round(float(crop_df["soil_pH"].mean()), 2),
                "avg_temperature": round(float(crop_df["temperature_C"].mean()), 2),
                "avg_rainfall": round(float(crop_df["rainfall_mm"].mean()), 2),
                "avg_humidity": round(float(crop_df["humidity_%"].mean()), 2),
                "avg_sunlight": round(float(crop_df["sunlight_hours"].mean()), 2),
            }

        # Yield distribution for histogram
        yield_bins = [2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000]
        yield_hist, _ = np.histogram(
            df["yield_kg_per_hectare"].values,
            bins=yield_bins
        )
        yield_distribution = {
            "bins": [f"{yield_bins[i]}–{yield_bins[i+1]}" for i in range(len(yield_bins)-1)],
            "counts": yield_hist.tolist()
        }

        return jsonify({
            "success": True,
            "total_records": int(len(df)),
            "average_yield": round(average_yield, 2),
            "minimum_yield": round(minimum_yield, 2),
            "maximum_yield": round(maximum_yield, 2),
            "std_yield": round(std_yield, 2),
            "crop_yield": crop_data,
            "region_yield": region_data,
            "crop_count": crop_count,
            "region_count": region_count,
            "crop_stats": crop_stats,
            "region_stats": region_stats,
            "irrigation_stats": irrigation_stats,
            "env_by_crop": env_by_crop,
            "yield_distribution": yield_distribution
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# -----------------------------
# Risk Assessment API
# -----------------------------
@app.route("/api/risk-assessment", methods=["POST"])
def risk_assessment():
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "error": "No input data provided"
            }), 400

        risk_data = assess_risks(data)

        return jsonify({
            "success": True,
            **risk_data
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# -----------------------------
# Reports API
# -----------------------------
@app.route("/api/reports", methods=["GET"])
def reports():
    try:
        df = pd.read_csv(DATA_PATH)

        # Crop × Region cross-tabulation
        crop_region = (
            df.groupby(["crop_type", "region"])["yield_kg_per_hectare"]
            .agg(["mean", "min", "max", "count"])
            .round(2)
        )
        crop_region_data = {}
        for (crop, region), row in crop_region.iterrows():
            if crop not in crop_region_data:
                crop_region_data[crop] = {}
            crop_region_data[crop][region] = {
                "mean": row["mean"],
                "min": row["min"],
                "max": row["max"],
                "count": int(row["count"])
            }

        # Irrigation × Crop cross-tabulation
        irr_crop = (
            df.groupby(["irrigation_type", "crop_type"])["yield_kg_per_hectare"]
            .mean()
            .round(2)
        )
        irrigation_crop_data = {}
        for (irr, crop), val in irr_crop.items():
            if irr not in irrigation_crop_data:
                irrigation_crop_data[irr] = {}
            irrigation_crop_data[irr][crop] = val

        # Monthly sowing trends (if sowing_date is available)
        sowing_monthly = {}
        if "sowing_date" in df.columns:
            df["_sowing_dt"] = pd.to_datetime(df["sowing_date"], errors="coerce")
            valid = df.dropna(subset=["_sowing_dt"])
            if len(valid) > 0:
                valid["_sowing_month"] = valid["_sowing_dt"].dt.month
                sowing_counts = valid["_sowing_month"].value_counts().sort_index()
                month_names = [
                    "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                ]
                sowing_monthly = {
                    month_names[int(m)]: int(c)
                    for m, c in sowing_counts.items()
                    if 1 <= int(m) <= 12
                }

                # Average yield by sowing month
                sowing_yield = (
                    valid.groupby("_sowing_month")["yield_kg_per_hectare"]
                    .mean()
                    .round(2)
                )
                sowing_monthly_yield = {
                    month_names[int(m)]: float(v)
                    for m, v in sowing_yield.items()
                    if 1 <= int(m) <= 12
                }
            else:
                sowing_monthly_yield = {}
        else:
            sowing_monthly_yield = {}

        # Environmental correlation with yield
        env_cols = [
            "soil_moisture_%", "soil_pH", "temperature_C",
            "rainfall_mm", "humidity_%", "sunlight_hours"
        ]
        correlations = {}
        for col in env_cols:
            if col in df.columns:
                corr = df[col].corr(df["yield_kg_per_hectare"])
                correlations[col] = round(float(corr), 4) if not pd.isna(corr) else None

        # Summary statistics table
        summary_table = []
        for crop in sorted(df["crop_type"].unique()):
            crop_df = df[df["crop_type"] == crop]
            for region in sorted(crop_df["region"].unique()):
                subset = crop_df[crop_df["region"] == region]
                summary_table.append({
                    "crop": crop,
                    "region": region,
                    "count": int(len(subset)),
                    "avg_yield": round(float(subset["yield_kg_per_hectare"].mean()), 2),
                    "min_yield": round(float(subset["yield_kg_per_hectare"].min()), 2),
                    "max_yield": round(float(subset["yield_kg_per_hectare"].max()), 2),
                    "avg_moisture": round(float(subset["soil_moisture_%"].mean()), 2),
                    "avg_ph": round(float(subset["soil_pH"].mean()), 2),
                    "avg_temp": round(float(subset["temperature_C"].mean()), 2),
                    "avg_rainfall": round(float(subset["rainfall_mm"].mean()), 2),
                })

        return jsonify({
            "success": True,
            "crop_region": crop_region_data,
            "irrigation_crop": irrigation_crop_data,
            "sowing_monthly": sowing_monthly,
            "sowing_monthly_yield": sowing_monthly_yield,
            "correlations": correlations,
            "summary_table": summary_table
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# -----------------------------
# Run server
# -----------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)