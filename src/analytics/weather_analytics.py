import os
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "data", "processed")
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")

def get_weather_analytics_summary():
    """Calculates statistical weather distributions and crop climatic envelopes from the processed datasets."""
    rec_path = os.path.join(DATA_DIR, "crop_recommendation_cleaned.csv")
    yield_path = os.path.join(DATA_DIR, "smart_crop_yield_cleaned.csv")
    
    df_rec = pd.read_csv(rec_path)
    df_yield = pd.read_csv(yield_path)
    
    # Dataset A Climate Envelopes
    rec_weather_stats = {
        "temperature": {
            "min": float(round(df_rec["Temperature"].min(), 2)),
            "max": float(round(df_rec["Temperature"].max(), 2)),
            "mean": float(round(df_rec["Temperature"].mean(), 2)),
            "std": float(round(df_rec["Temperature"].std(), 2))
        },
        "humidity": {
            "min": float(round(df_rec["Humidity"].min(), 2)),
            "max": float(round(df_rec["Humidity"].max(), 2)),
            "mean": float(round(df_rec["Humidity"].mean(), 2)),
            "std": float(round(df_rec["Humidity"].std(), 2))
        },
        "rainfall": {
            "min": float(round(df_rec["Rainfall"].min(), 2)),
            "max": float(round(df_rec["Rainfall"].max(), 2)),
            "mean": float(round(df_rec["Rainfall"].mean(), 2)),
            "std": float(round(df_rec["Rainfall"].std(), 2))
        }
    }
    
    # Dataset B Yield vs Weather Impact
    yield_weather_stats = {
        "temperature_c": {
            "min": float(round(df_yield["Temperature_C"].min(), 2)),
            "max": float(round(df_yield["Temperature_C"].max(), 2)),
            "mean": float(round(df_yield["Temperature_C"].mean(), 2))
        },
        "humidity_pct": {
            "min": float(round(df_yield["Humidity_pct"].min(), 2)),
            "max": float(round(df_yield["Humidity_pct"].max(), 2)),
            "mean": float(round(df_yield["Humidity_pct"].mean(), 2))
        },
        "rainfall_mm": {
            "min": float(round(df_yield["Rainfall_mm"].min(), 2)),
            "max": float(round(df_yield["Rainfall_mm"].max(), 2)),
            "mean": float(round(df_yield["Rainfall_mm"].mean(), 2))
        }
    }
    
    # Top Crops Optimal Climate Profiles (Dataset A)
    popular_crops = ["Rice", "Maize", "Banana", "Jute", "Tea", "Coffee", "Cotton", "Chickpea", "Apple", "Mango"]
    crop_profiles = {}
    for crop in popular_crops:
        if crop in df_rec["Label"].values:
            crop_df = df_rec[df_rec["Label"] == crop]
            crop_profiles[crop] = {
                "opt_temp_range": f"{crop_df['Temperature'].min():.1f}°C - {crop_df['Temperature'].max():.1f}°C",
                "avg_temp": float(round(crop_df["Temperature"].mean(), 1)),
                "opt_humidity_range": f"{crop_df['Humidity'].min():.1f}% - {crop_df['Humidity'].max():.1f}%",
                "avg_humidity": float(round(crop_df["Humidity"].mean(), 1)),
                "opt_rainfall_range": f"{crop_df['Rainfall'].min():.1f}mm - {crop_df['Rainfall'].max():.1f}mm",
                "avg_rainfall": float(round(crop_df["Rainfall"].mean(), 1))
            }
            
    return {
        "crop_recommendation_weather": rec_weather_stats,
        "yield_forecasting_weather": yield_weather_stats,
        "crop_climatic_profiles": crop_profiles
    }

def generate_weather_analytics_report():
    """Generates the artifacts/weather_analytics_report.md markdown file."""
    data = get_weather_analytics_summary()
    report_path = os.path.join(ARTIFACTS_DIR, "weather_analytics_report.md")
    
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# Weather Analytics & Agro-Meteorological Intelligence Report\n\n")
        f.write("## 1. Executive Overview\n\n")
        f.write("The YieldSense AI Weather Analytics Module analyzes historical meteorological metrics (Temperature, Relative Humidity, and Precipitation) across both Dataset A and Dataset B to provide crop-specific climate suitability assessments and sensitivity factors.\n\n")
        
        f.write("## 2. Dataset Weather Distributions\n\n")
        f.write("### Dataset A (Crop Recommendation - 7,000 Records)\n\n")
        rec_w = data["crop_recommendation_weather"]
        f.write(f"- **Temperature**: Range: {rec_w['temperature']['min']}°C to {rec_w['temperature']['max']}°C (Mean: {rec_w['temperature']['mean']}°C, Std: {rec_w['temperature']['std']}°C)\n")
        f.write(f"- **Humidity**: Range: {rec_w['humidity']['min']}% to {rec_w['humidity']['max']}% (Mean: {rec_w['humidity']['mean']}%, Std: {rec_w['humidity']['std']}%)\n")
        f.write(f"- **Rainfall**: Range: {rec_w['rainfall']['min']} mm to {rec_w['rainfall']['max']} mm (Mean: {rec_w['rainfall']['mean']} mm, Std: {rec_w['rainfall']['std']} mm)\n\n")
        
        f.write("### Dataset B (Smart Crop Yield - 10,000 Records)\n\n")
        yield_w = data["yield_forecasting_weather"]
        f.write(f"- **Temperature**: Range: {yield_w['temperature_c']['min']}°C to {yield_w['temperature_c']['max']}°C (Mean: {yield_w['temperature_c']['mean']}°C)\n")
        f.write(f"- **Humidity**: Range: {yield_w['humidity_pct']['min']}% to {yield_w['humidity_pct']['max']}% (Mean: {yield_w['humidity_pct']['mean']}%)\n")
        f.write(f"- **Rainfall**: Range: {yield_w['rainfall_mm']['min']} mm to {yield_w['rainfall_mm']['max']} mm (Mean: {yield_w['rainfall_mm']['mean']} mm)\n\n")
        
        f.write("## 3. Crop Climatic Tolerance Profiles (Sample Crops)\n\n")
        f.write("| Crop Variety | Temperature Range | Avg Temp | Humidity Range | Avg Humidity | Rainfall Range | Avg Rainfall |\n")
        f.write("|:---|:---:|:---:|:---:|:---:|:---:|:---:|\n")
        for crop, prof in data["crop_climatic_profiles"].items():
            f.write(f"| **{crop}** | {prof['opt_temp_range']} | {prof['avg_temp']}°C | {prof['opt_humidity_range']} | {prof['avg_humidity']}% | {prof['opt_rainfall_range']} | {prof['avg_rainfall']} mm |\n")
            
        f.write("\n## 4. Key Agronomic Insights & Limitations\n\n")
        f.write("1. **Static Historical Analysis**: Weather data analyzed is derived from static project datasets. Real-time live weather feeds require third-party meteorological API integration.\n")
        f.write("2. **Micro-climate Envelopes**: Extreme tropical crops (e.g., Tea, Jute) thrive in high-humidity (>80%) and high-precipitation (>2,000 mm) regions, whereas arid crops (e.g., Bajra, Mustard) require lower moisture.\n")
        f.write("3. **Yield Impact**: In Dataset B, weather variables provide baseline growing conditions while management factors (fertilizers, irrigation) account for production variance.\n")

    print(f"Generated: {report_path}")

if __name__ == "__main__":
    generate_weather_analytics_report()
