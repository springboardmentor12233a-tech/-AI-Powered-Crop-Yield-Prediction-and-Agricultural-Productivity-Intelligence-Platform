import os
import json
import pandas as pd
import numpy as np

# Crop-specific optimal pH ranges (Crop-aware assessment rule)
CROP_PH_RANGES = {
    "Rice": {"min": 5.5, "max": 6.8, "optimal": 6.0},
    "Wheat": {"min": 6.0, "max": 7.5, "optimal": 6.5},
    "Maize": {"min": 5.8, "max": 7.2, "optimal": 6.5},
    "Soybean": {"min": 6.0, "max": 7.0, "optimal": 6.5},
    "Cotton": {"min": 5.8, "max": 7.5, "optimal": 6.8}
}

def run_soil_analytics():
    print("=" * 70)
    print("YieldSense AI - Crop-Aware Soil Analytics & Health Assessment Pipeline")
    print("=" * 70)

    dataset_path = os.path.join("datasets", "processed", "cleaned_crop_yield.csv")
    output_json_path = os.path.join("datasets", "processed", "soil_analytics.json")

    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Cleaned dataset not found at {dataset_path}")

    df = pd.read_csv(dataset_path)

    # Validate required soil columns
    required_cols = ["crop_type", "soil_pH", "soil_moisture_%", "NDVI_index", "fertilizer_type"]
    for col in required_cols:
        if col not in df.columns:
            raise KeyError(f"Required soil column '{col}' missing from dataset!")

    crop_types = df["crop_type"].unique().tolist()
    
    overall_avg_pH = float(df["soil_pH"].mean())
    overall_avg_moisture = float(df["soil_moisture_%"].mean())
    overall_avg_ndvi = float(df["NDVI_index"].mean())

    # Soil Health Index Calculation: (pH_balance * 0.35) + (moisture_balance * 0.35) + (ndvi * 0.30)
    def calc_soil_health_index(ph, moisture, ndvi):
        ph_score = max(0, 1.0 - abs(ph - 6.5) / 2.0)
        moisture_score = min(1.0, max(0, moisture / 60.0))
        ndvi_score = min(1.0, max(0, ndvi))
        return round((ph_score * 0.35) + (moisture_score * 0.35) + (ndvi_score * 0.30), 4)

    overall_health_index = calc_soil_health_index(overall_avg_pH, overall_avg_moisture, overall_avg_ndvi)

    crop_soil_analytics = {}

    for crop in crop_types:
        crop_df = df[df["crop_type"] == crop]
        avg_ph = float(crop_df["soil_pH"].mean())
        avg_moist = float(crop_df["soil_moisture_%"].mean())
        avg_ndvi = float(crop_df["NDVI_index"].mean())

        ph_range = CROP_PH_RANGES.get(crop, {"min": 6.0, "max": 7.2, "optimal": 6.5})

        if ph_range["min"] <= avg_ph <= ph_range["max"]:
            ph_status = "Optimal"
            ph_advice = f"Soil pH {avg_ph:.2f} is within the optimal range ({ph_range['min']}-{ph_range['max']}) for {crop}."
        elif avg_ph < ph_range["min"]:
            ph_status = "Slightly Acidic"
            ph_advice = f"Soil pH {avg_ph:.2f} is below optimal ({ph_range['min']}-{ph_range['max']}) for {crop}. Consider agricultural lime application."
        else:
            ph_status = "Slightly Alkaline"
            ph_advice = f"Soil pH {avg_ph:.2f} is above optimal ({ph_range['min']}-{ph_range['max']}) for {crop}. Consider gypsum or organic compost addition."

        moisture_sufficiency = round(min(100.0, (avg_moist / 55.0) * 100.0), 2)
        crop_health_index = calc_soil_health_index(avg_ph, avg_moist, avg_ndvi)

        if crop_health_index >= 0.70:
            fertility_rating = "High Fertility"
        elif crop_health_index >= 0.50:
            fertility_rating = "Moderate Fertility"
        else:
            fertility_rating = "Low Fertility"

        crop_soil_analytics[crop] = {
            "record_count": len(crop_df),
            "average_soil_pH": round(avg_ph, 2),
            "optimal_pH_range": f"{ph_range['min']} - {ph_range['max']}",
            "pH_suitability_status": ph_status,
            "pH_recommendation": ph_advice,
            "average_soil_moisture_percent": round(avg_moist, 2),
            "moisture_sufficiency_percent": moisture_sufficiency,
            "average_NDVI_index": round(avg_ndvi, 3),
            "soil_health_index": crop_health_index,
            "fertility_assessment": fertility_rating
        }

    soil_summary = {
        "status_claim": "Dataset-based Crop-Aware Soil Analytics",
        "data_source": "datasets/processed/cleaned_crop_yield.csv",
        "total_records_analyzed": len(df),
        "global_soil_averages": {
            "soil_pH": round(overall_avg_pH, 2),
            "soil_moisture_percent": round(overall_avg_moisture, 2),
            "NDVI_index": round(overall_avg_ndvi, 3),
            "overall_soil_health_index": overall_health_index
        },
        "crop_specific_soil_breakdown": crop_soil_analytics,
        "general_reference_note": "Crop-aware pH ranges are applied specifically per crop type (Rice 5.5-6.8, Wheat 6.0-7.5, Maize 5.8-7.2, Soybean 6.0-7.0, Cotton 5.8-7.5)."
    }

    os.makedirs(os.path.dirname(output_json_path), exist_ok=True)
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(soil_summary, f, indent=2)

    print(f"Successfully generated soil analytics for {len(crop_types)} crop types.")
    print(f"Output saved to: {output_json_path}")
    print("=" * 70)

if __name__ == "__main__":
    run_soil_analytics()
