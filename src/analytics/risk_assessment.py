from typing import Dict, Any, List

def assess_agricultural_risks(
    crop: str,
    soil_ph: float,
    soil_type: str,
    rainfall_mm: float,
    temperature_c: float,
    humidity_pct: float,
    fertilizer_kg: float,
    pesticides_kg: float,
    irrigation: str,
    previous_crop: str,
    predicted_yield: float = None
) -> Dict[str, Any]:
    """
    Evaluates agronomic risk factors into Low, Moderate, or High risk categories
    based strictly on available soil, weather, management, and historical rotation data.
    
    Risk Factors Evaluated:
    1. Soil pH Suitability Risk (Extreme acidity/alkalinity)
    2. Moisture & Irrigation Risk (Extreme drought or waterlogging without proper drainage)
    3. Monoculture / Crop Rotation Risk (Pest buildup from repetitive crop cycles)
    4. Input Intensity Risk (Overuse or deficit of fertilizers/pesticides)
    5. Yield Expectation Risk (Below regional average benchmarks)
    """
    risk_factors: List[Dict[str, str]] = []
    risk_score = 0  # 0 to 10 scale
    
    # 1. Soil pH Risk Evaluation
    if soil_ph < 5.5:
        risk_score += 2
        risk_factors.append({
            "factor": "Soil Acidity Risk",
            "severity": "Moderate",
            "description": f"Soil pH of {soil_ph:.1f} indicates strong acidity, which restricts phosphorus and calcium availability. Apply agricultural lime."
        })
    elif soil_ph > 8.2:
        risk_score += 2
        risk_factors.append({
            "factor": "Soil Alkalinity Risk",
            "severity": "Moderate",
            "description": f"Soil pH of {soil_ph:.1f} indicates alkaline soil, inducing micronutrient deficiencies (Zinc, Iron). Apply gypsum or elemental sulfur."
        })
    else:
        risk_factors.append({
            "factor": "Soil Reaction Status",
            "severity": "Low",
            "description": f"Soil pH of {soil_ph:.1f} is well-buffered and suitable for optimum nutrient absorption."
        })
        
    # 2. Moisture & Rainfall Risk Evaluation
    if rainfall_mm < 350 and irrigation in ["Unknown", "Flood"]:
        risk_score += 3
        risk_factors.append({
            "factor": "Moisture Deficit Risk",
            "severity": "High",
            "description": f"Rainfall of {rainfall_mm:.0f}mm is low. Ensure dedicated drip or sprinkler irrigation to prevent drought stress."
        })
    elif rainfall_mm > 1200 and soil_type == "Clay":
        risk_score += 2
        risk_factors.append({
            "factor": "Waterlogging Risk",
            "severity": "Moderate",
            "description": f"Heavy rainfall ({rainfall_mm:.0f}mm) on Clay soil poses waterlogging and root rot risks. Ensure adequate field drainage channels."
        })
    else:
        risk_factors.append({
            "factor": "Water Availability",
            "severity": "Low",
            "description": f"Rainfall and irrigation combination provides acceptable moisture supply."
        })
        
    # 3. Crop Rotation & Monoculture Risk
    if previous_crop.strip().lower() == crop.strip().lower() and crop.strip().lower() != "unknown":
        risk_score += 2
        risk_factors.append({
            "factor": "Monoculture Pest & Depletion Risk",
            "severity": "Moderate",
            "description": f"Planting {crop} consecutively after {previous_crop} increases vulnerability to crop-specific soil pathogens and nutrient depletion. Consider rotating with a legume."
        })
    else:
        risk_factors.append({
            "factor": "Crop Rotation Safety",
            "severity": "Low",
            "description": f"Previous crop ({previous_crop}) provides healthy agronomic rotation benefits for {crop}."
        })
        
    # 4. Agro-Chemical Input Risk
    if fertilizer_kg > 300:
        risk_score += 1
        risk_factors.append({
            "factor": "High Fertilizer Intensity",
            "severity": "Moderate",
            "description": f"Application rate of {fertilizer_kg:.0f} kg/ha is high. Monitor for nutrient leaching and lodging risks."
        })
    elif fertilizer_kg < 40:
        risk_score += 1
        risk_factors.append({
            "factor": "Sub-Optimal Fertilizer Supply",
            "severity": "Moderate",
            "description": f"Low fertilizer application ({fertilizer_kg:.0f} kg/ha) may cap full yield potential."
        })
        
    # 5. Yield Level Assessment
    if predicted_yield is not None:
        if predicted_yield < 2.5:
            risk_score += 2
            risk_factors.append({
                "factor": "Low Yield Forecast",
                "severity": "High",
                "description": f"Forecasted yield of {predicted_yield:.2f} ton/ha is below optimal productivity thresholds. Re-evaluate soil conditioning and planting density."
            })
        elif predicted_yield >= 5.0:
            risk_factors.append({
                "factor": "Yield Potential",
                "severity": "Low",
                "description": f"Projected yield of {predicted_yield:.2f} ton/ha reflects high productivity under current management conditions."
            })
            
    # Calculate Overall Risk Level
    if risk_score >= 5:
        overall_risk = "High"
        summary = "Multiple environmental or management factors present elevated risks to yield productivity. Targeted mitigation required."
        color_badge = "red"
    elif risk_score >= 2:
        overall_risk = "Moderate"
        summary = "Standard agricultural risk profile. Moderate management adjustments recommended to maintain target yield."
        color_badge = "amber"
    else:
        overall_risk = "Low"
        summary = "Favorable agricultural conditions. Low risk of biotic or abiotic yield suppression."
        color_badge = "emerald"
        
    return {
        "overall_risk": overall_risk,
        "risk_score": risk_score,
        "summary": summary,
        "color_badge": color_badge,
        "risk_factors": risk_factors
    }
