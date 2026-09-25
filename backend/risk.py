def _level(value):
    if value in ("High", "Critical"):
        return "High"
    if value in ("Medium", "Warning", "Needs Attention"):
        return "Moderate"
    if value in ("Low", "Suitable", "Good"):
        return "Low"
    return "Unavailable"


def calculate_risk(weather_analysis=None, soil_analysis=None, predicted_yield=None):
    weather_analysis = weather_analysis or {}
    soil_analysis = soil_analysis or {}
    weather_risks = weather_analysis.get("risks", [])
    soil_risks = soil_analysis.get("warnings", [])
    weather_level = "High" if any("critical" in risk.lower() for risk in weather_risks) else "Moderate" if weather_risks else "Low"
    soil_level = "High" if any("critical" in risk.lower() for risk in soil_risks) else "Moderate" if soil_risks else "Low" if soil_analysis.get("availableCount") else "Unavailable"
    yield_level = "Unavailable"
    if predicted_yield is not None:
        try:
            yield_level = "High" if float(predicted_yield) < 2 else "Moderate" if float(predicted_yield) < 4 else "Low"
        except (TypeError, ValueError):
            yield_level = "Unavailable"
    available = [level for level in (weather_level, soil_level, yield_level) if level != "Unavailable"]
    overall = "High" if "High" in available else "Moderate" if "Moderate" in available else "Low" if available else "Unavailable"
    return {
        "weather_risk": weather_level,
        "soil_risk": soil_level,
        "yield_risk": yield_level,
        "overall_risk": overall,
        "weather_risks": weather_risks,
        "soil_risks": soil_risks,
    }
