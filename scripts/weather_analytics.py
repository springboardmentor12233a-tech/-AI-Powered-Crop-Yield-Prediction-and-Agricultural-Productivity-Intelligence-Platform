import os
import json
import pandas as pd
import numpy as np

def run_weather_analytics():
    print("=" * 70)
    print("YieldSense AI - Dataset-based Weather Analytics Pipeline")
    print("=" * 70)

    dataset_path = os.path.join("datasets", "processed", "cleaned_crop_yield.csv")
    output_json_path = os.path.join("datasets", "processed", "weather_analytics.json")

    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Cleaned dataset not found at {dataset_path}")

    df = pd.read_csv(dataset_path)

    # Validate required weather columns
    required_cols = ["region", "rainfall_mm", "temperature_C", "humidity_%", "sunlight_hours"]
    for col in required_cols:
        if col not in df.columns:
            raise KeyError(f"Required weather column '{col}' missing from dataset!")

    unique_regions = df["region"].unique().tolist()
    
    # Calculate overall dataset averages
    avg_rainfall = float(df["rainfall_mm"].mean())
    avg_temp = float(df["temperature_C"].mean())
    avg_humidity = float(df["humidity_%"].mean())
    avg_sunlight = float(df["sunlight_hours"].mean())

    # Define helper scoring functions
    def calc_rainfall_adequacy(rainfall):
        # Optimal crop rainfall benchmark: 150mm - 250mm
        if 150 <= rainfall <= 250:
            return 95.0
        elif 100 <= rainfall < 150 or 250 < rainfall <= 300:
            return 80.0
        elif 50 <= rainfall < 100 or 300 < rainfall <= 400:
            return 60.0
        else:
            return 40.0

    def calc_temp_stress(temp):
        # Optimal crop temp: 20C - 30C. High stress above 35C or below 15C
        if 20 <= temp <= 30:
            return 15.0  # Low stress
        elif 15 <= temp < 20 or 30 < temp <= 35:
            return 45.0  # Moderate stress
        else:
            return 80.0  # High stress

    def calc_humidity_balance(humidity):
        if 50 <= humidity <= 70:
            return 90.0
        elif 40 <= humidity < 50 or 70 < humidity <= 80:
            return 75.0
        else:
            return 55.0

    def calc_sunlight_score(sunlight):
        if 6 <= sunlight <= 9:
            return 92.0
        elif 4 <= sunlight < 6 or 9 < sunlight <= 11:
            return 78.0
        else:
            return 60.0

    regional_analytics = {}

    for region in unique_regions:
        reg_df = df[df["region"] == region]
        r_rainfall = float(reg_df["rainfall_mm"].mean())
        r_temp = float(reg_df["temperature_C"].mean())
        r_humidity = float(reg_df["humidity_%"].mean())
        r_sunlight = float(reg_df["sunlight_hours"].mean())

        rain_score = calc_rainfall_adequacy(r_rainfall)
        temp_stress = calc_temp_stress(r_temp)
        hum_score = calc_humidity_balance(r_humidity)
        sun_score = calc_sunlight_score(r_sunlight)

        # Overall weather impact score (0-100, higher is more favorable)
        overall_score = round(
            (rain_score * 0.35) + ((100 - temp_stress) * 0.30) + (hum_score * 0.20) + (sun_score * 0.15), 2
        )

        regional_analytics[region] = {
            "record_count": int(len(reg_df)),
            "average_rainfall_mm": round(r_rainfall, 2),
            "average_temperature_C": round(r_temp, 2),
            "average_humidity_percent": round(r_humidity, 2),
            "average_sunlight_hours": round(r_sunlight, 2),
            "rainfall_adequacy_score": round(rain_score, 2),
            "temperature_stress_risk": round(temp_stress, 2),
            "humidity_balance_score": round(hum_score, 2),
            "sunlight_exposure_score": round(sun_score, 2),
            "overall_weather_score": overall_score
        }

    overall_weather = {
        "status_claim": "Dataset-based Weather Analytics",
        "data_source": "datasets/processed/cleaned_crop_yield.csv",
        "total_records_analyzed": int(len(df)),
        "available_regions": unique_regions,
        "global_averages": {
            "rainfall_mm": round(avg_rainfall, 2),
            "temperature_C": round(avg_temp, 2),
            "humidity_percent": round(avg_humidity, 2),
            "sunlight_hours": round(avg_sunlight, 2)
        },
        "regional_breakdown": regional_analytics
    }

    os.makedirs(os.path.dirname(output_json_path), exist_ok=True)
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(overall_weather, f, indent=2)

    print(f"Successfully generated weather analytics for {len(unique_regions)} regions.")
    print(f"Output saved to: {output_json_path}")
    print("=" * 70)

if __name__ == "__main__":
    run_weather_analytics()
