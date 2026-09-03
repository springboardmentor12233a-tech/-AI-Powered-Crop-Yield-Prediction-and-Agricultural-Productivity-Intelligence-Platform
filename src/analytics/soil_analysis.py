import os
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "data", "processed")
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")

def classify_soil_ph(ph_value: float) -> dict:
    """Classifies soil pH according to standard USDA agronomic standards."""
    if ph_value < 5.5:
        category = "Strongly Acidic"
        guidance = "Liming (calcium carbonate) recommended to raise pH for acid-sensitive crops like legumes."
        suitable_crops = ["Tea", "Potato", "Blueberry", "Sweet Potato"]
    elif 5.5 <= ph_value < 6.5:
        category = "Moderately Acidic"
        guidance = "Optimal range for many cereal grains and tubers. Minor lime application optional."
        suitable_crops = ["Rice", "Maize", "Wheat", "Soybean", "Groundnut"]
    elif 6.5 <= ph_value <= 7.5:
        category = "Neutral"
        guidance = "Ideal agronomic condition for maximum nutrient bioavailability and microbial activity."
        suitable_crops = ["Wheat", "Barley", "Rice", "Cotton", "Sugarcane", "Chickpea"]
    elif 7.5 < ph_value <= 8.5:
        category = "Moderately Alkaline"
        guidance = "High calcium content. Acid-forming fertilizers (e.g., ammonium sulfate) can help balance."
        suitable_crops = ["Barley", "Cotton", "Sugar Beet", "Mustard"]
    else:
        category = "Strongly Alkaline"
        guidance = "Gypsum or organic matter treatment required to lower sodicity and improve drainage."
        suitable_crops = ["Barley", "Date Palm"]
        
    return {
        "ph": float(round(ph_value, 2)),
        "category": category,
        "guidance": guidance,
        "recommended_crops": suitable_crops
    }

def get_soil_analysis_summary():
    """Calculates soil analysis metrics and texture comparisons from the datasets."""
    rec_path = os.path.join(DATA_DIR, "crop_recommendation_cleaned.csv")
    yield_path = os.path.join(DATA_DIR, "smart_crop_yield_cleaned.csv")
    
    df_rec = pd.read_csv(rec_path)
    df_yield = pd.read_csv(yield_path)
    
    # Soil pH summary from both datasets
    ph_stats_rec = {
        "min": float(round(df_rec["pH"].min(), 2)),
        "max": float(round(df_rec["pH"].max(), 2)),
        "mean": float(round(df_rec["pH"].mean(), 2)),
        "std": float(round(df_rec["pH"].std(), 2))
    }
    
    ph_stats_yield = {
        "min": float(round(df_yield["Soil_pH"].min(), 2)),
        "max": float(round(df_yield["Soil_pH"].max(), 2)),
        "mean": float(round(df_yield["Soil_pH"].mean(), 2)),
        "std": float(round(df_yield["Soil_pH"].std(), 2))
    }
    
    # Yield by Soil Type (Dataset B)
    soil_yield_perf = {}
    for soil_type in ["Clay", "Loam", "Sandy"]:
        soil_df = df_yield[df_yield["Soil_Type"] == soil_type]
        soil_yield_perf[soil_type] = {
            "record_count": int(len(soil_df)),
            "avg_yield_ton_ha": float(round(soil_df["Yield_ton_per_ha"].mean(), 2)),
            "min_yield": float(round(soil_df["Yield_ton_per_ha"].min(), 2)),
            "max_yield": float(round(soil_df["Yield_ton_per_ha"].max(), 2)),
            "crops_grown": list(soil_df["Crop"].unique())
        }
        
    # Crop yield by Soil Type breakdown
    crop_soil_pivot = df_yield.groupby(["Crop", "Soil_Type"])["Yield_ton_per_ha"].mean().unstack().round(2).to_dict()
    
    return {
        "crop_recommendation_ph_stats": ph_stats_rec,
        "yield_dataset_ph_stats": ph_stats_yield,
        "soil_texture_performance": soil_yield_perf,
        "crop_soil_interaction": crop_soil_pivot
    }

def generate_soil_analysis_report():
    """Generates the artifacts/soil_analysis_report.md markdown file."""
    data = get_soil_analysis_summary()
    report_path = os.path.join(ARTIFACTS_DIR, "soil_analysis_report.md")
    
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# Soil Analysis & Edaphic Intelligence Report\n\n")
        f.write("## 1. Soil Module Scope & Nutrients Limitation\n\n")
        f.write("> [!IMPORTANT]\n")
        f.write("> **Dataset Limitation Notice on Soil Nutrients (N, P, K)**:\n")
        f.write("> The current static project datasets (`crop_yield_dataset.csv` and `Crop_Recommendation_Dataset.xlsx`) **do NOT contain Nitrogen (N), Phosphorus (P), or Potassium (K)** measurements. Soil analysis is therefore based on **Soil pH** and **Soil Texture Classification (Clay, Loam, Sandy)**. Soil N/P/K fields are reserved for future live IoT sensor telemetry.\n\n")
        
        f.write("## 2. Soil pH Profiling & Distributions\n\n")
        ph_a = data["crop_recommendation_ph_stats"]
        ph_b = data["yield_dataset_ph_stats"]
        f.write(f"- **Dataset A (Recommendation)**: pH ranges from {ph_a['min']} to {ph_a['max']} (Mean: {ph_a['mean']}, Std: {ph_a['std']}). Accommodates both highly acidic (pH 3.5 for Tea) and alkaline crops.\n")
        f.write(f"- **Dataset B (Yield Prediction)**: Soil pH ranges from {ph_b['min']} to {ph_b['max']} (Mean: {ph_b['mean']}, Std: {ph_b['std']}), representing standard agricultural arable land.\n\n")
        
        f.write("## 3. Soil Texture Performance (Dataset B)\n\n")
        f.write("| Soil Texture | Records | Mean Yield (ton/ha) | Min Yield | Max Yield | Suitable Crops |\n")
        f.write("|:---|:---:|:---:|:---:|:---:|:---|\n")
        for soil, stats in data["soil_texture_performance"].items():
            f.write(f"| **{soil}** | {stats['record_count']} | {stats['avg_yield_ton_ha']} | {stats['min_yield']} | {stats['max_yield']} | {', '.join(stats['crops_grown'])} |\n")
            
        f.write("\n## 4. Soil pH Classification Guide\n\n")
        f.write("| pH Range | Classification | Agronomic Guidance | Recommended Crops |\n")
        f.write("|:---|:---|:---|:---|\n")
        sample_phs = [5.0, 6.0, 7.0, 8.0, 9.0]
        for val in sample_phs:
            info = classify_soil_ph(val)
            f.write(f"| **{info['ph']}** | {info['category']} | {info['guidance']} | {', '.join(info['recommended_crops'])} |\n")

    print(f"Generated: {report_path}")

if __name__ == "__main__":
    generate_soil_analysis_report()
