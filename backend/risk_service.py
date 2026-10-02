from typing import Dict, Any, List

def evaluate_climate_and_pest_risk(
    crop: str = "Wheat",
    state: str = "Punjab",
    season: str = "Rabi",
    temperature: float = 22.0,
    rainfall: float = 650.0,
    humidity_percent: float = 68.0,
    soil_ph: float = 6.8
) -> Dict[str, Any]:
    """
    Evaluates Agro-Climatic Risks and computes Pest & Disease Vulnerability Alerts.
    """
    # 1. Climate Risk Sub-score Calculations
    # Drought Risk
    crop_water_demand = {
        'Wheat': 550, 'Rice': 1250, 'Maize': 600, 'Cotton': 800,
        'Sugarcane': 1800, 'Soybean': 500, 'Barley': 450
    }
    demand = crop_water_demand.get(crop, 550)
    rainfall_deficit = max(0, demand - rainfall)
    drought_risk_pct = min(98.0, round((rainfall_deficit / demand) * 100.0, 1))

    # Heat Stress Risk
    if temperature > 34:
        heat_stress_pct = min(95.0, round(((temperature - 30) / 10) * 100.0, 1))
    elif temperature < 10 and season.lower() in ['rabi', 'winter']:
        heat_stress_pct = 15.0 # Low heat stress, but watch frost
    else:
        heat_stress_pct = max(10.0, round((temperature / 35.0) * 25.0, 1))

    # Frost Risk
    frost_risk_pct = 75.0 if (temperature < 6.0 and season.lower() in ['rabi', 'winter']) else 12.0

    # Flood Risk
    flood_risk_pct = min(95.0, round(((rainfall - 800) / 400) * 100.0, 1)) if rainfall > 800 else 8.0

    # Overall Composite Climate Risk Score (%)
    overall_risk_score = round((drought_risk_pct * 0.4) + (heat_stress_pct * 0.3) + (frost_risk_pct * 0.15) + (flood_risk_pct * 0.15), 1)

    if overall_risk_score >= 60.0:
        risk_level = "High"
        risk_color = "#ef4444" # Red
        risk_badge = "High Risk"
    elif overall_risk_score >= 30.0:
        risk_level = "Medium"
        risk_color = "#f59e0b" # Yellow / Amber
        risk_badge = "Medium Risk"
    else:
        risk_level = "Low"
        risk_color = "#10b981" # Green
        risk_badge = "Low Risk"

    # 2. Pest & Disease Warning Alerts Logic
    pest_alerts = []

    if crop.lower() in ['wheat', 'barley']:
        if temperature >= 15 and temperature <= 25 and humidity_percent >= 60:
            pest_alerts.append({
                "id": "PEST-01",
                "name": "Yellow Rust (Stripe Rust)",
                "scientific_name": "Puccinia striiformis",
                "risk_level": "High Risk",
                "risk_percentage": 82.5,
                "color": "#ef4444",
                "trigger": f"Favorable high humidity ({humidity_percent}%) & optimal temp ({temperature}°C)",
                "symptoms": "Yellow pustules arranged in linear stripes on upper leaves",
                "prevention": "Spray Propiconazole 25% EC @ 1 ml/L or Tebuconazole @ 1.5 ml/L of water."
            })
        pest_alerts.append({
            "id": "PEST-02",
            "name": "Wheat Aphids",
            "scientific_name": "Macrosiphum miscanthi",
            "risk_level": "Medium Risk",
            "risk_percentage": 48.0,
            "color": "#f59e0b",
            "trigger": "Cloudy weather and moderate thermal range during earhead emergence",
            "symptoms": "Nymphs and adults suck sap from tender earheads and leaves",
            "prevention": "Spray Imidacloprid 17.8 SL @ 0.5 ml/L or Thiamethoxam 25 WG @ 0.2 g/L."
        })

    elif crop.lower() in ['rice', 'paddy']:
        if humidity_percent >= 75:
            pest_alerts.append({
                "id": "PEST-03",
                "name": "Rice Blast Disease",
                "scientific_name": "Magnaporthe oryzae",
                "risk_level": "High Risk",
                "risk_percentage": 88.0,
                "color": "#ef4444",
                "trigger": f"High relative humidity ({humidity_percent}%) & leaf wetness",
                "symptoms": "Spindle-shaped lesions with grayish centers on leaves and neck nodes",
                "prevention": "Apply Tricyclazole 75 WP @ 0.6 g/L or Isoprothiolane 40 EC @ 1.5 ml/L."
            })
        pest_alerts.append({
            "id": "PEST-04",
            "name": "Brown Plant Hopper (BPH)",
            "scientific_name": "Nilaparvata lugens",
            "risk_level": "Medium Risk",
            "risk_percentage": 52.0,
            "color": "#f59e0b",
            "trigger": "Dense canopy spacing and stagnant field water",
            "symptoms": "Hopper burn drying patches in circular spots across paddy fields",
            "prevention": "Spray Pymetrozine 50 WG @ 0.6 g/L; drain stagnant water from field."
        })

    elif crop.lower() in ['maize', 'corn']:
        pest_alerts.append({
            "id": "PEST-05",
            "name": "Fall Armyworm (FAW)",
            "scientific_name": "Spodoptera frugiperda",
            "risk_level": "High Risk",
            "risk_percentage": 79.0,
            "color": "#ef4444",
            "trigger": "Warm ambient temperature and whorl stage growth",
            "symptoms": "Ragged defoliation holes and sawdust-like frass in central whorls",
            "prevention": "Apply Emamectin Benzoate 5 SG @ 0.4 g/L or Chlorantraniliprole 18.5 SC @ 0.4 ml/L into whorls."
        })

    elif crop.lower() == 'cotton':
        pest_alerts.append({
            "id": "PEST-06",
            "name": "Pink Bollworm",
            "scientific_name": "Pectinophora gossypiella",
            "risk_level": "High Risk",
            "risk_percentage": 84.0,
            "color": "#ef4444",
            "trigger": "Boll formation stage & flowering transition",
            "symptoms": "Rosetted flowers and entry holes in green bolls with lint staining",
            "prevention": "Deploy PB-Rope L pheromone dispensers @ 80 ropes/acre or spray Profenofos 50 EC @ 2 ml/L."
        })

    else:
        pest_alerts.append({
            "id": "PEST-07",
            "name": "General Foliage Blight & Aphid Risk",
            "scientific_name": "Pathogen Complex",
            "risk_level": "Low Risk",
            "risk_percentage": 22.0,
            "color": "#10b981",
            "trigger": "Normal agro-meteorological conditions",
            "symptoms": "Minor leaf spots on lower canopy leaves",
            "prevention": "Prophylactic neem oil spray (10,000 ppm) @ 3 ml/L."
        })

    return {
        "crop": crop,
        "state": state,
        "season": season,
        "climate_risk_summary": {
            "overall_risk_score": overall_risk_score,
            "risk_level": risk_level,
            "risk_badge": risk_badge,
            "risk_color": risk_color,
            "drought_risk_percentage": drought_risk_pct,
            "heat_stress_percentage": heat_stress_pct,
            "frost_risk_percentage": frost_risk_pct,
            "flood_risk_percentage": flood_risk_pct
        },
        "pest_disease_alerts": pest_alerts,
        "mitigation_strategy": f"Maintain monitored field scouting for {crop} in {state}. Follow preventive spray windows when climate risk exceeds 40%."
    }
