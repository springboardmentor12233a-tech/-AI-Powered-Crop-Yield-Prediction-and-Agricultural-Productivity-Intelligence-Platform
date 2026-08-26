import pandas as pd

# Load cleaned dataset
df = pd.read_csv("datasets/Smart_Farming_Crop_Yield_2024_cleaned.csv")

print("===== MISSING VALUES =====")
missing = df.isnull().sum()

print(missing[missing > 0])

print("\n===== TOTAL MISSING VALUES =====")
print(df.isnull().sum().sum())

print("\n===== DUPLICATE ROWS =====")
print(df.duplicated().sum())

print("\n===== DATA TYPES =====")
print(df.dtypes)

print("\n===== UNIQUE VALUES =====")
for column in df.columns:
    print(f"{column}: {df[column].nunique()}")