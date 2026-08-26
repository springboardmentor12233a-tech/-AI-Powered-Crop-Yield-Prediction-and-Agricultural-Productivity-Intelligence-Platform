import pandas as pd

file_path = "datasets/Smart_Farming_Crop_Yield_2024.csv"
df = pd.read_csv(file_path)

print("\n===== IRRIGATION TYPE =====")
print(df["irrigation_type"].value_counts(dropna=False))

print("\n===== CROP DISEASE STATUS =====")
print(df["crop_disease_status"].value_counts(dropna=False))

print("\n===== CROP TYPE =====")
print(df["crop_type"].value_counts())

print("\n===== REGION =====")
print(df["region"].value_counts())

print("\n===== FERTILIZER TYPE =====")
print(df["fertilizer_type"].value_counts())