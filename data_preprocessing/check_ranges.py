import pandas as pd

file_path = "datasets/Smart_Farming_Crop_Yield_2024.csv"
df = pd.read_csv(file_path)

print("\n===== NUMERICAL DATA RANGES =====")

columns = [
    "soil_moisture_%",
    "soil_pH",
    "temperature_C",
    "rainfall_mm",
    "humidity_%",
    "sunlight_hours",
    "pesticide_usage_ml",
    "total_days",
    "yield_kg_per_hectare",
    "latitude",
    "longitude",
    "NDVI_index"
]

for column in columns:
    print(f"\n{column}")
    print("Minimum:", df[column].min())
    print("Maximum:", df[column].max())
    print("Missing:", df[column].isna().sum())

print("\n===== DATE CHECK =====")
print("Sowing dates:", df["sowing_date"].min(), "to", df["sowing_date"].max())
print("Harvest dates:", df["harvest_date"].min(), "to", df["harvest_date"].max())