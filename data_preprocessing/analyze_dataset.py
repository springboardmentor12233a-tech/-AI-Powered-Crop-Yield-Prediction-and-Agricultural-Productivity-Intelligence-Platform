import pandas as pd

# Load the raw dataset
file_path = "datasets/Smart_Farming_Crop_Yield_2024.csv"
df = pd.read_csv(file_path)

print("\n===== DATASET OVERVIEW =====")
print("Rows:", df.shape[0])
print("Columns:", df.shape[1])

print("\n===== COLUMN NAMES =====")
for column in df.columns:
    print(column)

print("\n===== DATA TYPES =====")
print(df.dtypes)

print("\n===== MISSING VALUES =====")
print(df.isnull().sum())

print("\n===== DUPLICATE ROWS =====")
print(df.duplicated().sum())

print("\n===== FIRST 5 ROWS =====")
print(df.head())

print("\n===== NUMERICAL SUMMARY =====")
print(df.describe())