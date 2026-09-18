"""
YieldSense AI — Dataset Generator
Generates a realistic crop yield prediction dataset inspired by the
Kaggle Crop Yield Prediction Dataset structure.
"""
import numpy as np
import pandas as pd

np.random.seed(42)
N = 2200

CROPS = ["Rice", "Wheat", "Maize", "Sugarcane", "Cotton", "Soybean", "Barley", "Sorghum"]
SOIL_TYPES = ["Loamy", "Sandy", "Clay", "Silty", "Peaty", "Chalky"]
REGIONS = ["North", "South", "East", "West", "Central"]
WEATHER_CONDITIONS = ["Sunny", "Rainy", "Cloudy", "Windy", "Stormy"]

crop_base_yield = {
    "Rice": 2400, "Wheat": 1800, "Maize": 2200, "Sugarcane": 4500,
    "Cotton": 900, "Soybean": 1400, "Barley": 1600, "Sorghum": 1300,
}
soil_effect = {
    "Loamy": 200, "Sandy": -150, "Clay": 50, "Silty": 150, "Peaty": -100, "Chalky": -200,
}
weather_effect = {
    "Sunny": 100, "Rainy": 80, "Cloudy": 0, "Windy": -120, "Stormy": -300,
}

crops = np.random.choice(CROPS, N)
soil_types = np.random.choice(SOIL_TYPES, N)
regions = np.random.choice(REGIONS, N)
weather_conditions = np.random.choice(WEATHER_CONDITIONS, N)
fertilizer_used = np.random.randint(0, 2, N)
irrigation_used = np.random.randint(0, 2, N)
rainfall_mm = np.clip(np.random.normal(900, 300, N), 100, 2500).round(1)
temperature_c = np.clip(np.random.normal(27, 6, N), 10, 45).round(1)
nitrogen = np.random.randint(40, 140, N)
phosphorus = np.random.randint(20, 100, N)
potassium = np.random.randint(30, 120, N)
soil_ph = np.clip(np.random.normal(6.5, 0.8, N), 4.5, 8.5).round(2)

yields = []
for i in range(N):
    base = crop_base_yield[crops[i]]
    y = (base
         + soil_effect[soil_types[i]]
         + weather_effect[weather_conditions[i]]
         + fertilizer_used[i] * 300
         + irrigation_used[i] * 250
         + (rainfall_mm[i] - 900) * 0.3
         + (27 - abs(temperature_c[i] - 27)) * 10
         + nitrogen[i] * 1.5
         + phosphorus[i] * 0.8
         + potassium[i] * 0.5
         + np.random.normal(0, 150))
    yields.append(max(200, round(y, 1)))

df = pd.DataFrame({
    "Crop": crops,
    "Rainfall_mm": rainfall_mm,
    "Temperature_C": temperature_c,
    "Fertilizer_Used": fertilizer_used,
    "Irrigation_Used": irrigation_used,
    "Weather_Condition": weather_conditions,
    "Soil_Type": soil_types,
    "Region": regions,
    "Nitrogen": nitrogen,
    "Phosphorus": phosphorus,
    "Potassium": potassium,
    "Soil_pH": soil_ph,
    "Yield_kg_per_acre": yields,
})

df.to_csv("crop_yield.csv", index=False)
print(f"Dataset generated: {len(df)} rows, {len(df.columns)} columns")
print(df.head())
print(df.describe())
