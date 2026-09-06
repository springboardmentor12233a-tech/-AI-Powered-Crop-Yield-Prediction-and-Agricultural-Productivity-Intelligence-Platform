import pandas as pd

print("=" * 70)
print("AGRICULTURAL FORECASTING REPORT")
print("=" * 70)

# Load actual Milestone 2 dataset
df = pd.read_csv("datasets/crop_yield_train.csv")

target = "yield_tpha"

# --------------------------------------------------
# 1. Overall yield statistics
# --------------------------------------------------
overall_mean = df[target].mean()
overall_median = df[target].median()
overall_min = df[target].min()
overall_max = df[target].max()

print("\n1. OVERALL YIELD STATISTICS")
print(f"Mean Yield   : {overall_mean:.3f} t/ha")
print(f"Median Yield : {overall_median:.3f} t/ha")
print(f"Minimum Yield: {overall_min:.3f} t/ha")
print(f"Maximum Yield: {overall_max:.3f} t/ha")

# --------------------------------------------------
# 2. Crop-level forecasting analysis
# --------------------------------------------------
crop_yield = (
    df.groupby("crop_type")[target]
    .mean()
    .sort_values(ascending=False)
)

print("\n2. AVERAGE YIELD BY CROP")
print(crop_yield)

# --------------------------------------------------
# 3. Region-level analysis
# --------------------------------------------------
region_yield = (
    df.groupby("region")[target]
    .mean()
    .sort_values(ascending=False)
)

print("\n3. AVERAGE YIELD BY REGION")
print(region_yield)

# --------------------------------------------------
# 4. Season-level analysis
# --------------------------------------------------
season_yield = (
    df.groupby("season")[target]
    .mean()
    .sort_values(ascending=False)
)

print("\n4. AVERAGE YIELD BY SEASON")
print(season_yield)

# --------------------------------------------------
# 5. Weather forecasting indicators
# --------------------------------------------------
weather_features = [
    "avg_temperature",
    "total_rainfall",
    "sunlight_hours",
    "soil_moisture"
]

weather_corr = (
    df[weather_features + [target]]
    .corr()[target]
    .drop(target)
    .sort_values(ascending=False)
)

print("\n5. WEATHER-YIELD RELATIONSHIPS")
print(weather_corr)

# --------------------------------------------------
# 6. Soil forecasting indicators
# --------------------------------------------------
soil_features = [
    "soil_ph",
    "soil_moisture",
    "nitrogen_content",
    "phosphorus_content",
    "potassium_content"
]

soil_corr = (
    df[soil_features + [target]]
    .corr()[target]
    .drop(target)
    .sort_values(ascending=False)
)

print("\n6. SOIL-YIELD RELATIONSHIPS")
print(soil_corr)

# --------------------------------------------------
# 7. Generate forecasting report
# --------------------------------------------------
best_crop = crop_yield.index[0]
best_region = region_yield.index[0]
best_season = season_yield.index[0]

report = f"""
AGRICULTURAL FORECASTING REPORT
================================

Project:
YieldSense AI - AI-Powered Crop Yield Prediction
and Agricultural Productivity Intelligence Platform

Dataset:
crop_yield_train.csv

Dataset Size:
{df.shape[0]} rows x {df.shape[1]} columns

Target:
yield_tpha (tonnes/hectare)


1. FORECASTING OBJECTIVE
------------------------

The agricultural forecasting module analyzes historical
crop, regional, seasonal, weather and soil information
to identify patterns associated with crop yield.

These patterns can support future yield estimation and
agricultural decision-making.


2. HISTORICAL YIELD SUMMARY
---------------------------

Average Yield   : {overall_mean:.3f} t/ha
Median Yield    : {overall_median:.3f} t/ha
Minimum Yield   : {overall_min:.3f} t/ha
Maximum Yield   : {overall_max:.3f} t/ha


3. CROP-LEVEL ANALYSIS
----------------------

"""

for crop, value in crop_yield.items():
    report += f"{crop}: {value:.3f} t/ha\n"

report += f"""
Highest historical average crop:
{best_crop}


4. REGION-LEVEL ANALYSIS
------------------------

"""

for region, value in region_yield.items():
    report += f"{region}: {value:.3f} t/ha\n"

report += f"""
Highest historical average region:
{best_region}


5. SEASONAL ANALYSIS
--------------------

"""

for season, value in season_yield.items():
    report += f"{season}: {value:.3f} t/ha\n"

report += f"""
Highest historical average season:
{best_season}


6. WEATHER INDICATORS
---------------------

"""

for feature, value in weather_corr.items():
    report += f"{feature}: correlation = {value:.4f}\n"

report += """
The weather relationships indicate how historical weather
variables are associated with crop yield in this dataset.
They should not be interpreted as direct causal effects.


7. SOIL INDICATORS
------------------

"""

for feature, value in soil_corr.items():
    report += f"{feature}: correlation = {value:.4f}\n"

report += """
Soil variables provide additional information for crop
yield analysis and can be combined with weather and
agricultural input variables in the prediction system.


8. FORECASTING WORKFLOW
-----------------------

Historical agricultural data
        |
        v
Data preprocessing
        |
        v
Feature engineering
        |
        v
Weather + Soil + Crop + Region + Season analysis
        |
        v
Machine Learning model
        |
        v
Yield prediction
        |
        v
Agricultural forecasting insight


9. FORECASTING APPLICATION
--------------------------

The forecasting module can support:

- Crop yield estimation
- Seasonal production planning
- Regional yield comparison
- Weather impact analysis
- Soil condition analysis
- Agricultural resource planning
- Data-driven decision support


10. CONCLUSION
--------------

YieldSense AI combines machine learning with historical
agricultural analysis to support crop yield forecasting.

Historical crop, region, season, weather and soil patterns
are analyzed before generating predictions.

The forecasting system should be used as a decision-support
tool. Predictions are estimates and actual agricultural
outcomes can vary because of weather changes, disease,
pests, farming practices and other real-world conditions.
"""

# Save report
output_file = "agricultural_forecasting_report.txt"

with open(output_file, "w", encoding="utf-8") as file:
    file.write(report)

print("\n" + "=" * 70)
print("AGRICULTURAL FORECASTING REPORT GENERATED")
print("=" * 70)
print(f"Saved: {output_file}")