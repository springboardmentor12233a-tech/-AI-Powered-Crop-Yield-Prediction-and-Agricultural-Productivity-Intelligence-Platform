import pandas as pd

# Load actual Milestone 2 dataset
df = pd.read_csv("datasets/crop_yield_train.csv")

# Weather-related features
weather_features = [
    "avg_temperature",
    "total_rainfall",
    "sunlight_hours",
    "soil_moisture"
]

print("\n===== WEATHER ANALYTICS =====")

# Basic statistics
print("\n--- Weather Statistics ---")
print(df[weather_features].describe().round(2))

# Correlation with crop yield
print("\n--- Correlation with Crop Yield ---")
correlation = (
    df[weather_features + ["yield_tpha"]]
    .corr()["yield_tpha"]
    .drop("yield_tpha")
    .sort_values(ascending=False)
)

print(correlation.round(4))

# Average yield by rainfall groups
df["rainfall_group"] = pd.qcut(
    df["total_rainfall"],
    q=4,
    labels=["Low", "Moderate", "High", "Very High"]
)

print("\n--- Average Yield by Rainfall Level ---")
print(
    df.groupby(
        "rainfall_group",
        observed=True
    )["yield_tpha"]
    .mean()
    .round(3)
)

# Average yield by temperature groups
df["temperature_group"] = pd.qcut(
    df["avg_temperature"],
    q=4,
    labels=["Low", "Moderate", "High", "Very High"]
)

print("\n--- Average Yield by Temperature Level ---")
print(
    df.groupby(
        "temperature_group",
        observed=True
    )["yield_tpha"]
    .mean()
    .round(3)
)

# Save weather analysis results
weather_summary = df[weather_features + ["yield_tpha"]].describe().round(3)
weather_summary.to_csv("weather_analytics_summary.csv")

correlation.to_csv(
    "weather_yield_correlation.csv",
    header=["Correlation"]
)

print("\nWeather analytics files created successfully.")