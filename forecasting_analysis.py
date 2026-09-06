import pandas as pd

# Load dataset
df = pd.read_csv("datasets/crop_yield_train.csv")

print("\n===== AVERAGE YIELD BY CROP =====")
print(
    df.groupby("crop_type")["yield_tpha"]
    .mean()
    .sort_values(ascending=False)
)

print("\n===== AVERAGE YIELD BY REGION =====")
print(
    df.groupby("region")["yield_tpha"]
    .mean()
    .sort_values(ascending=False)
)

print("\n===== AVERAGE YIELD BY SEASON =====")
print(
    df.groupby("season")["yield_tpha"]
    .mean()
    .sort_values(ascending=False)
)

print("\n===== OVERALL YIELD STATISTICS =====")
print(df["yield_tpha"].describe())