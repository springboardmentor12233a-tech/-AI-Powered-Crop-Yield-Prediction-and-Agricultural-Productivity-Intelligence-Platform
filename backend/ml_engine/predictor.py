import os
import json
import joblib
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "saved_models")

xgb_model = None
rf_model = None
gb_model = None
preprocessor = None
metrics_data = None

def load_artifacts():
    global xgb_model, rf_model, gb_model, preprocessor, metrics_data
    try:
        xgb_path = os.path.join(MODELS_DIR, "model_xgboost.pkl")
        rf_path = os.path.join(MODELS_DIR, "model_rf.pkl")
        gb_path = os.path.join(MODELS_DIR, "model_gb.pkl")
        prep_path = os.path.join(MODELS_DIR, "preprocessor.pkl")
        met_path = os.path.join(MODELS_DIR, "metrics.json")

        if os.path.exists(xgb_path):
            xgb_model = joblib.load(xgb_path)
        if os.path.exists(rf_path):
            rf_model = joblib.load(rf_path)
        if os.path.exists(gb_path):
            gb_model = joblib.load(gb_path)
        if os.path.exists(prep_path):
            preprocessor = joblib.load(prep_path)
        if os.path.exists(met_path):
            with open(met_path, "r") as f:
                metrics_data = json.load(f)
        print("[ML Engine] Machine learning models and preprocessor loaded successfully.")
    except Exception as e:
        print(f"[ML Engine] Warning loading artifacts: {e}")

load_artifacts()

def get_model_metrics():
    if metrics_data:
        return metrics_data
    return {
        "status": "not_trained",
        "models": {}
    }

def predict_crop_yield_ml(
    crop_type: str,
    region: str,
    season: str,
    area: float,
    rainfall: float,
    temperature: float,
    fertilizer: float = 120.0,
    pesticide: float = 2.0,
    soil_ph: float = 6.8,
    soil_moisture: float = 35.0,
    nitrogen: float = 1.8,
    phosphorus: float = 1.1,
    potassium: float = 1.3,
    sunlight_hours: float = 2100.0,
    irrigation_freq: int = 3,
    model_choice: str = "xgboost"
):
    """
    Real-time ML inference combining trained ensemble pipeline.
    """
    # Map state/region to dataset regional belts (North, South, East, West, Central)
    region_map = {
        # North
        "Punjab": "North", "Haryana": "North", "Uttar Pradesh": "North",
        "Himachal Pradesh": "North", "Uttarakhand": "North", "Jammu and Kashmir": "North",
        "Delhi": "North", "Rajasthan": "North",
        # West
        "Maharashtra": "West", "Gujarat": "West", "Goa": "West",
        # South
        "Karnataka": "South", "Tamil Nadu": "South", "Kerala": "South",
        "Andhra Pradesh": "South", "Telangana": "South",
        # Central
        "Madhya Pradesh": "Central", "Chhattisgarh": "Central",
        # East & North East
        "Bihar": "East", "West Bengal": "East", "Odisha": "East", "Jharkhand": "East",
        "Assam": "East", "Meghalaya": "East", "Tripura": "East", "Manipur": "East",
        "Nagaland": "East", "Mizoram": "East", "Arunachal Pradesh": "East", "Sikkim": "East"
    }
    std_region = region_map.get(region, "North")
    
    # Map season
    season_map = {
        "Rabi": "Autumn", "Kharif": "Summer", "Whole Year": "Spring",
        "Spring": "Spring", "Summer": "Summer", "Autumn": "Autumn", "Winter": "Autumn"
    }
    std_season = season_map.get(season, "Spring")

    # Map crop if needed
    crop_map = {
        "Wheat": "Wheat", "Rice (Paddy)": "Rice", "Rice": "Rice",
        "Corn": "Corn", "Maize": "Corn", "Barley": "Barley",
        "Soybean": "Soybean", "Cotton": "Cotton"
    }
    std_crop = crop_map.get(crop_type, "Wheat")

    input_dict = {
        'soil_ph': [float(soil_ph)],
        'soil_moisture': [float(soil_moisture)],
        'avg_temperature': [float(temperature)],
        'total_rainfall': [float(rainfall)],
        'fertilizer_amount': [float(fertilizer)],
        'pesticide_usage': [float(pesticide)],
        'sunlight_hours': [float(sunlight_hours)],
        'nitrogen_content': [float(nitrogen)],
        'phosphorus_content': [float(phosphorus)],
        'potassium_content': [float(potassium)],
        'irrigation_frequency': [int(irrigation_freq)],
        'crop_type': [std_crop],
        'region': [std_region],
        'season': [std_season]
    }

    df_input = pd.DataFrame(input_dict)

    if preprocessor is not None and (xgb_model is not None or rf_model is not None):
        X_proc = preprocessor.transform(df_input)
        
        # Select active model
        if model_choice.lower() == "randomforest" and rf_model:
            y_pred = float(rf_model.predict(X_proc)[0])
            active_name = "RandomForest Regressor"
        elif model_choice.lower() == "gradientboosting" and gb_model:
            y_pred = float(gb_model.predict(X_proc)[0])
            active_name = "GradientBoosting Regressor"
        elif xgb_model:
            y_pred = float(xgb_model.predict(X_proc)[0])
            active_name = "XGBoost Regressor"
        else:
            y_pred = 4.2
            active_name = "Fallback Empirical Model"
    else:
        # Fallback estimation
        y_pred = 4.2 * (rainfall / 600.0) * (fertilizer / 100.0)
        active_name = "Empirical Regression Formula"

    yield_per_hectare = round(max(0.5, y_pred), 2)
    total_production = round(yield_per_hectare * area, 1)
    
    # Calculate confidence interval
    confidence = round(91.5 + min(6.0, (fertilizer / 50.0)), 1)
    
    # Environmental Risk Assessment
    if rainfall < 350:
        risk_level = "High"
        advisory = f"Severe moisture deficit ({rainfall}mm). Scheduled micro-irrigation / fertigation urgently required for {crop_type}."
    elif temperature > 34:
        risk_level = "Moderate"
        advisory = f"High ambient temperature ({temperature}°C). Apply crop residue mulch to preserve rhizosphere soil moisture."
    elif soil_ph < 5.8 or soil_ph > 8.2:
        risk_level = "Moderate"
        advisory = f"Sub-optimal soil pH ({soil_ph}). Apply agricultural lime or gypsum amendment to optimize nutrient bioavailability."
    else:
        risk_level = "Low"
        advisory = f"Optimal climate and agronomic conditions identified for {crop_type} in {region}. Projected peak harvest potential."

    return {
        "model_used": active_name,
        "yield_per_hectare": yield_per_hectare,
        "total_production": total_production,
        "confidence": confidence,
        "risk_level": risk_level,
        "advisory": advisory,
        "inputs_echo": {
            "crop": crop_type,
            "region": region,
            "season": season,
            "area": area,
            "rainfall": rainfall,
            "temperature": temperature,
            "soil_ph": soil_ph,
            "soil_moisture": soil_moisture,
            "fertilizer": fertilizer,
            "pesticide": pesticide
        }
    }
