import pandas as pd

# Load raw dataset
input_file = "datasets/Smart_Farming_Crop_Yield_2024.csv"
output_file = "datasets/Smart_Farming_Crop_Yield_2024_cleaned.csv"

df = pd.read_csv(input_file)

# Handle missing categorical values
df["irrigation_type"] = df["irrigation_type"].fillna("Unknown")
df["crop_disease_status"] = df["crop_disease_status"].fillna("Unknown")

# Convert date columns to datetime
df["sowing_date"] = pd.to_datetime(df["sowing_date"])
df["harvest_date"] = pd.to_datetime(df["harvest_date"])

# Save cleaned dataset
df.to_csv(output_file, index=False)

print("===== CLEANING COMPLETE =====")
print("Original rows:", 500)
print("Cleaned rows:", len(df))
print("Output file:", output_file)

print("\n===== REMAINING MISSING VALUES =====")
print(df.isnull().sum())

print("\nCleaned dataset saved successfully.")