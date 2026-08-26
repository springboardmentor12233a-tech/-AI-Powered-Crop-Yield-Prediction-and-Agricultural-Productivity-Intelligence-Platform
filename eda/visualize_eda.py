import pandas as pd
import matplotlib.pyplot as plt
import os

# Load cleaned dataset
df = pd.read_csv("datasets/Smart_Farming_Crop_Yield_2024_cleaned.csv")

# Create output folder
os.makedirs("eda/plots", exist_ok=True)

# 1. Yield Distribution
plt.figure(figsize=(8, 5))
plt.hist(df["yield_kg_per_hectare"], bins=20)
plt.xlabel("Yield (kg per hectare)")
plt.ylabel("Number of Farms")
plt.title("Distribution of Crop Yield")
plt.tight_layout()
plt.savefig("eda/plots/yield_distribution.png")
plt.close()

# 2. Yield by Crop Type
crop_yield = (
    df.groupby("crop_type")["yield_kg_per_hectare"]
    .mean()
    .sort_values(ascending=False)
)

plt.figure(figsize=(8, 5))
crop_yield.plot(kind="bar")
plt.xlabel("Crop Type")
plt.ylabel("Average Yield (kg per hectare)")
plt.title("Average Yield by Crop Type")
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig("eda/plots/yield_by_crop.png")
plt.close()

# 3. Yield by Region
region_yield = (
    df.groupby("region")["yield_kg_per_hectare"]
    .mean()
    .sort_values(ascending=False)
)

plt.figure(figsize=(8, 5))
region_yield.plot(kind="bar")
plt.xlabel("Region")
plt.ylabel("Average Yield (kg per hectare)")
plt.title("Average Yield by Region")
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig("eda/plots/yield_by_region.png")
plt.close()

# 4. Yield by Irrigation Type
irrigation_yield = (
    df.groupby("irrigation_type")["yield_kg_per_hectare"]
    .mean()
    .sort_values(ascending=False)
)

plt.figure(figsize=(8, 5))
irrigation_yield.plot(kind="bar")
plt.xlabel("Irrigation Type")
plt.ylabel("Average Yield (kg per hectare)")
plt.title("Average Yield by Irrigation Type")
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig("eda/plots/yield_by_irrigation.png")
plt.close()

# 5. Yield by Fertilizer Type
fertilizer_yield = (
    df.groupby("fertilizer_type")["yield_kg_per_hectare"]
    .mean()
    .sort_values(ascending=False)
)

plt.figure(figsize=(8, 5))
fertilizer_yield.plot(kind="bar")
plt.xlabel("Fertilizer Type")
plt.ylabel("Average Yield (kg per hectare)")
plt.title("Average Yield by Fertilizer Type")
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig("eda/plots/yield_by_fertilizer.png")
plt.close()

print("===== EDA VISUALIZATION COMPLETED =====")
print("Plots saved in: eda/plots/")