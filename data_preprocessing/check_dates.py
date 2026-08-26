import pandas as pd

file_path = "datasets/Smart_Farming_Crop_Yield_2024.csv"
df = pd.read_csv(file_path)

# Convert date columns
df["sowing_date"] = pd.to_datetime(df["sowing_date"])
df["harvest_date"] = pd.to_datetime(df["harvest_date"])

# Calculate actual growing period
df["calculated_days"] = (
    df["harvest_date"] - df["sowing_date"]
).dt.days

print("\n===== DATE CONSISTENCY CHECK =====")

print("Sowing date type:", df["sowing_date"].dtype)
print("Harvest date type:", df["harvest_date"].dtype)

print("\nRows where harvest date is before sowing date:")
print((df["harvest_date"] < df["sowing_date"]).sum())

print("\nRows where calculated days differ from total_days:")
print((df["calculated_days"] != df["total_days"]).sum())

print("\n===== GROWING PERIOD COMPARISON =====")
print(
    df[["sowing_date", "harvest_date", "total_days", "calculated_days"]]
    .head(10)
)