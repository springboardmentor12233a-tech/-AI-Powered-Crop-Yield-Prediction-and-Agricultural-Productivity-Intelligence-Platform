import pandas as pd

# Load cleaned dataset
df = pd.read_csv("datasets/Smart_Farming_Crop_Yield_2024_cleaned.csv")

print("===== DATASET SHAPE =====")
print("Rows:", df.shape[0])
print("Columns:", df.shape[1])

print("\n===== TARGET VARIABLE =====")
print("Target: yield_kg_per_hectare")
print("Minimum:", df["yield_kg_per_hectare"].min())
print("Maximum:", df["yield_kg_per_hectare"].max())
print("Mean:", df["yield_kg_per_hectare"].mean())
print("Median:", df["yield_kg_per_hectare"].median())

print("\n===== CROP TYPE AVERAGE YIELD =====")
print(
    df.groupby("crop_type")["yield_kg_per_hectare"]
    .mean()
    .sort_values(ascending=False)
)

print("\n===== REGION AVERAGE YIELD =====")
print(
    df.groupby("region")["yield_kg_per_hectare"]
    .mean()
    .sort_values(ascending=False)
)

print("\n===== IRRIGATION TYPE AVERAGE YIELD =====")
print(
    df.groupby("irrigation_type")["yield_kg_per_hectare"]
    .mean()
    .sort_values(ascending=False)
)

print("\n===== FERTILIZER TYPE AVERAGE YIELD =====")
print(
    df.groupby("fertilizer_type")["yield_kg_per_hectare"]
    .mean()
    .sort_values(ascending=False)
)