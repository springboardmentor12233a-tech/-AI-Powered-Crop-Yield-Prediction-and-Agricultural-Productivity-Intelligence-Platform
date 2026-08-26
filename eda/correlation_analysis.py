import pandas as pd

# Load cleaned dataset
df = pd.read_csv("datasets/Smart_Farming_Crop_Yield_2024_cleaned.csv")

print("===== NUMERICAL COLUMNS =====")
numeric_df = df.select_dtypes(include=["number"])
print(numeric_df.columns.tolist())

print("\n===== CORRELATION WITH TARGET =====")

target = "yield_kg_per_hectare"

correlation = (
    numeric_df.corr()[target]
    .drop(target)
    .sort_values(ascending=False)
)

print(correlation)

print("\n===== STRONGEST POSITIVE RELATIONSHIPS =====")
print(correlation.head(5))

print("\n===== STRONGEST NEGATIVE RELATIONSHIPS =====")
print(correlation.tail(5))