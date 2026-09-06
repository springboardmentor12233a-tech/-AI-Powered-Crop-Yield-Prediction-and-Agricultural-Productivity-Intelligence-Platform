import pandas as pd

# Load Milestone 2 dataset
df = pd.read_csv("datasets/crop_yield_train.csv")

target = "yield_tpha"

# Soil-related features
soil_features = [
    "soil_ph",
    "soil_moisture",
    "nitrogen_content",
    "phosphorus_content",
    "potassium_content"
]

print("=" * 60)
print("SOIL ANALYSIS WORKFLOW")
print("=" * 60)

# --------------------------------------------------
# 1. Soil statistics
# --------------------------------------------------
print("\n1. SOIL FEATURE STATISTICS")
print(df[soil_features].describe())

# --------------------------------------------------
# 2. Correlation with crop yield
# --------------------------------------------------
print("\n2. CORRELATION WITH CROP YIELD")

soil_correlation = df[soil_features + [target]].corr()[target]
soil_correlation = soil_correlation.drop(target).sort_values(
    ascending=False
)

print(soil_correlation)

# Save correlation results
soil_correlation.to_csv("soil_yield_correlation.csv")

# --------------------------------------------------
# 3. Soil pH analysis
# --------------------------------------------------
print("\n3. AVERAGE YIELD BY SOIL pH GROUP")

df["soil_ph_group"] = pd.qcut(
    df["soil_ph"],
    q=4,
    labels=["Low", "Moderate", "High", "Very High"],
    duplicates="drop"
)

ph_analysis = df.groupby(
    "soil_ph_group",
    observed=False
)[target].mean()

print(ph_analysis)

# --------------------------------------------------
# 4. Nitrogen analysis
# --------------------------------------------------
print("\n4. AVERAGE YIELD BY NITROGEN GROUP")

df["nitrogen_group"] = pd.qcut(
    df["nitrogen_content"],
    q=4,
    labels=["Low", "Moderate", "High", "Very High"],
    duplicates="drop"
)

nitrogen_analysis = df.groupby(
    "nitrogen_group",
    observed=False
)[target].mean()

print(nitrogen_analysis)

# --------------------------------------------------
# 5. Phosphorus analysis
# --------------------------------------------------
print("\n5. AVERAGE YIELD BY PHOSPHORUS GROUP")

df["phosphorus_group"] = pd.qcut(
    df["phosphorus_content"],
    q=4,
    labels=["Low", "Moderate", "High", "Very High"],
    duplicates="drop"
)

phosphorus_analysis = df.groupby(
    "phosphorus_group",
    observed=False
)[target].mean()

print(phosphorus_analysis)

# --------------------------------------------------
# 6. Potassium analysis
# --------------------------------------------------
print("\n6. AVERAGE YIELD BY POTASSIUM GROUP")

df["potassium_group"] = pd.qcut(
    df["potassium_content"],
    q=4,
    labels=["Low", "Moderate", "High", "Very High"],
    duplicates="drop"
)

potassium_analysis = df.groupby(
    "potassium_group",
    observed=False
)[target].mean()

print(potassium_analysis)

# --------------------------------------------------
# 7. Soil moisture analysis
# --------------------------------------------------
print("\n7. AVERAGE YIELD BY SOIL MOISTURE GROUP")

df["moisture_group"] = pd.qcut(
    df["soil_moisture"],
    q=4,
    labels=["Low", "Moderate", "High", "Very High"],
    duplicates="drop"
)

moisture_analysis = df.groupby(
    "moisture_group",
    observed=False
)[target].mean()

print(moisture_analysis)

# --------------------------------------------------
# 8. Save summary
# --------------------------------------------------
summary = pd.DataFrame({
    "pH_group": ph_analysis,
    "nitrogen_group": nitrogen_analysis,
    "phosphorus_group": phosphorus_analysis,
    "potassium_group": potassium_analysis,
    "soil_moisture_group": moisture_analysis
})

summary.to_csv("soil_analysis_summary.csv")

print("\n" + "=" * 60)
print("Soil analysis completed successfully.")
print("Saved: soil_yield_correlation.csv")
print("Saved: soil_analysis_summary.csv")
print("=" * 60)