def analyze_soil_health(
    soil_ph: float,
    nitrogen_ppm: float,
    phosphorus_ppm: float,
    potassium_ppm: float,
    moisture_percent: float,
    organic_matter_percent: float = 1.8,
    target_crop: str = "Wheat"
):
    """
    Precision soil analysis workflow: assesses chemical balance, health score,
    fertilizer recommendations, and crop suitability.
    """
    # 1. pH Evaluation
    if soil_ph < 6.0:
        ph_status = "Acidic"
        ph_action = "Apply Agricultural Lime (Calcium Carbonate) at 2.5 t/ha to elevate pH."
    elif soil_ph > 7.5:
        ph_status = "Alkaline / Saline"
        ph_action = "Apply Gypsum (Calcium Sulfate) or elemental sulfur to decrease alkalinity."
    else:
        ph_status = "Optimal Neutral"
        ph_action = "Soil pH is in the optimum range for maximum nutrient assimilation."

    # 2. Nitrogen Status (Standard arable range: 1.0 - 2.5 %)
    if nitrogen_ppm < 1.2:
        n_status = "Deficient"
        n_action = "Apply Urea (46% N) top-dressing split at crown root initiation."
    elif nitrogen_ppm > 2.8:
        n_status = "Excess"
        n_action = "Withhold supplemental nitrogen to avoid excessive vegetative lodging."
    else:
        n_status = "Adequate"
        n_action = "Maintain scheduled basal maintenance dosage."

    # 3. Phosphorus Status (Standard: 0.8 - 1.8 %)
    if phosphorus_ppm < 0.9:
        p_status = "Deficient"
        p_action = "Apply DAP (Di-Ammonium Phosphate) or Single Super Phosphate (SSP)."
    else:
        p_status = "Adequate"
        p_action = "Phosphorus levels satisfy root establishment requirements."

    # 4. Potassium Status (Standard: 1.0 - 2.0 %)
    if potassium_ppm < 1.0:
        k_status = "Deficient"
        k_action = "Apply MOP (Muriate of Potash) to boost disease resistance & grain weight."
    else:
        k_status = "Adequate"
        k_action = "Potassium levels sufficient for osmotic regulation."

    # 5. Moisture Status
    if moisture_percent < 25.0:
        moisture_status = "Moisture Stressed (Dry)"
        irrigation_rec = "Immediate scheduled irrigation needed (approx 50mm depth)."
    elif moisture_percent > 65.0:
        moisture_status = "Waterlogged"
        irrigation_rec = "Ensure active furrow drainage to prevent root hypoxia."
    else:
        moisture_status = "Optimal Moisture Field Capacity"
        irrigation_rec = "Moisture within ideal absorption threshold."

    # Compute overall Soil Fertility Health Score (0-100)
    score = 100
    if ph_status != "Optimal Neutral": score -= 15
    if n_status != "Adequate": score -= 15
    if p_status != "Adequate": score -= 10
    if k_status != "Adequate": score -= 10
    if moisture_status != "Optimal Moisture Field Capacity": score -= 15

    health_score = max(35, score)

    # Crop suitability matching
    suitable_crops = []
    if 6.0 <= soil_ph <= 7.5:
        suitable_crops.extend(["Wheat", "Corn", "Barley", "Soybean"])
    if 5.5 <= soil_ph <= 7.0:
        suitable_crops.append("Rice")
    if soil_ph >= 6.5:
        suitable_crops.append("Cotton")

    return {
        "overall_health_score": health_score,
        "fertility_tier": "Class I - Prime Agricultural Soil" if health_score >= 80 else "Class II - Moderately Productive Soil" if health_score >= 60 else "Class III - Amendment Required",
        "parameters": {
            "soil_ph": {"value": soil_ph, "status": ph_status, "remediation": ph_action},
            "nitrogen": {"value": nitrogen_ppm, "unit": "% / ppm", "status": n_status, "remediation": n_action},
            "phosphorus": {"value": phosphorus_ppm, "unit": "% / ppm", "status": p_status, "remediation": p_action},
            "potassium": {"value": potassium_ppm, "unit": "% / ppm", "status": k_status, "remediation": k_action},
            "moisture": {"value": moisture_percent, "unit": "%", "status": moisture_status, "remediation": irrigation_rec},
            "organic_matter": {"value": organic_matter_percent, "unit": "%", "status": "Moderate" if organic_matter_percent >= 1.5 else "Low"}
        },
        "target_crop": target_crop,
        "crop_suitability": suitable_crops,
        "fertilizer_prescription": [
            ph_action,
            n_action,
            p_action,
            k_action
        ]
    }
