import pandas as pd

df = pd.read_csv("../dataset/soil_weather_yield_train.csv")

print("\n=== CORRELATION WITH YIELD ===")
numeric = df.select_dtypes(include="number")
print(
    numeric.corr()["yield_tpha"]
    .sort_values(ascending=False)
)

print("\n=== FERTILIZER vs YIELD ===")
print(
    df[["fertilizer_amount", "yield_tpha"]]
    .describe()
)

print("\n=== CROP COUNTS ===")
print(df["crop_type"].value_counts())

print("\n=== REGION COUNTS ===")
print(df["region"].value_counts())

print("\n=== SEASON COUNTS ===")
print(df["season"].value_counts())

print("\n=== FERTILIZER RANGE BY CROP ===")
print(
    df.groupby("crop_type")["fertilizer_amount"]
    .agg(["min", "max", "mean"])
)

print("\n=== YIELD RANGE BY CROP ===")
print(
    df.groupby("crop_type")["yield_tpha"]
    .agg(["min", "max", "mean"])
)