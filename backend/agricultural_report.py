import logging
from .prediction import predict_yield
from .weather_analysis import load_historical_weather_analysis, assess_weather
from .soil_analysis import load_historical_soil_analysis, assess_soil_suitability

logger = logging.getLogger(__name__)

def generate_agricultural_report(input_dict: dict) -> dict:
    """
    Combines yield prediction, weather analysis, and soil analysis into a structured
    agricultural forecasting report, strictly using cautious terminology.
    """
    crop_type = input_dict.get('crop_type')
    region = input_dict.get('region')

    # 1. Yield Prediction
    try:
        predicted_yield = predict_yield(input_dict)
    except Exception as e:
        logger.error(f"Failed to predict yield for report: {e}")
        predicted_yield = None

    # 2. Weather Analysis
    try:
        weather_analysis_data = load_historical_weather_analysis()
        weather_assessment = assess_weather(crop_type, region, input_dict, weather_analysis_data)
    except Exception as e:
        logger.error(f"Failed to generate weather analysis for report: {e}")
        weather_assessment = None

    # 3. Soil Analysis
    try:
        soil_analysis_data = load_historical_soil_analysis()
        soil_assessment = assess_soil_suitability(crop_type, region, input_dict, soil_analysis_data)
    except Exception as e:
        logger.error(f"Failed to generate soil analysis for report: {e}")
        soil_assessment = None

    # 4. Construct Final Report
    report = {
        "crop_type": crop_type,
        "region": region,
        "yield_prediction": {
            "predicted_yield_kg_per_hectare": round(float(predicted_yield), 2) if predicted_yield is not None else None,
            "unit": "kg/hectare",
            "context": "This is a predicted yield based on the supplied parameters."
        },
        "historical_weather_context": weather_assessment,
        "historical_soil_context": soil_assessment,
        "overall_agricultural_forecasting_summary": {
            "summary": "This report combines predicted yield with historical weather and soil contexts observed in the training data.",
            "limitations": "These findings are based on historical associations and do not establish causation. They should not be interpreted as absolute biological requirements or guarantees of yield."
        }
    }

    return report
