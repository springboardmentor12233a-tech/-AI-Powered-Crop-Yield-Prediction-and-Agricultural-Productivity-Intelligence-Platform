# Weather Impact Analysis Findings

This document summarizes the findings from analyzing the historical weather data in our dataset (400 training records) to determine its relationship with agricultural yield.

## 1. Overview of Weather Statistics

Based on the 400 training records, the basic statistics for the weather variables and target yield are:

| Variable | Mean | Median | Min | Max | Std Dev |
|---|---|---|---|---|---|
| Temperature (°C) | 24.58 | 24.51 | 15.00 | 34.84 | 5.31 |
| Rainfall (mm) | 182.14 | 190.22 | 50.17 | 298.96 | 72.00 |
| Humidity (%) | 65.30 | 65.45 | 40.23 | 90.00 | 14.71 |
| Sunlight (hours) | 7.02 | 7.02 | 4.01 | 10.00 | 1.69 |
| Yield (kg/ha) | 4037.78 | 4071.69 | 2023.56 | 5998.29 | 1174.19 |

## 2. Weather-Yield Correlations

Overall, the observed Pearson correlations between individual weather variables and yield across the entire dataset are very weak:

*   **Temperature**: +0.018 (weak positive)
*   **Rainfall**: -0.068 (weak negative)
*   **Humidity**: +0.014 (weak positive)
*   **Sunlight**: +0.004 (weak positive)

## 3. Important Weather Ranges

When dividing the variables into quartiles (low, medium-low, medium-high, high), we observe the following associations with average yield:

*   **Temperature**: The `medium-low` range shows the highest average yield (4216 kg/ha), while the `low` range shows the lowest (3850 kg/ha).
*   **Rainfall**: The `low` range shows the highest average yield (4197 kg/ha). The `medium-low` range has the lowest (3892 kg/ha).
*   **Humidity**: `medium-low` (4097 kg/ha) and `high` (4098 kg/ha) have marginally better yields than `medium-high` (3928 kg/ha).
*   **Sunlight**: `medium-low` (4219 kg/ha) is associated with the highest average yield, while `low` sunlight (3857 kg/ha) has the lowest.

## 4. Crop-Specific Findings

The relationships between weather and yield vary considerably when segmented by crop type:

*   **Rice (n=61)**: Shows a notable negative correlation with rainfall (-0.238) and a positive correlation with humidity (+0.122).
*   **Maize (n=83)**: Shows the strongest positive correlation with sunlight (+0.178) and a negative correlation with rainfall (-0.108).
*   **Wheat (n=78)**: Correlates positively with temperature (+0.161) and negatively with rainfall (-0.140).
*   **Soybean (n=90)**: Has a slight positive correlation with rainfall (+0.097) but negative with sunlight (-0.098).
*   **Cotton (n=88)**: Generally weak negative correlations across the board (e.g., -0.128 with humidity).

## 5. Region-Specific Findings

Regional variations exist in the dataset:
*   **South India** had the highest average yield (4182 kg/ha) and also experienced the highest average rainfall (189.25 mm) and sunlight (7.24 hours).
*   **South USA** had the lowest average yield (3945 kg/ha), with the lowest average rainfall (169.7 mm).

## 6. Monthly / Seasonal Findings

*   **Sowing Month**: Months 1, 2, and 3 have very similar average yields (~4000 - 4070 kg/ha), indicating no strong association with the sowing month in this dataset.
*   **Observation Month**: Most observation months average ~3900 - 4150 kg/ha. However, **Month 8** shows a starkly lower average yield (3094 kg/ha). Month 8 also coincides with the lowest average rainfall (168 mm) and highest humidity (74.7%).

## 7. Combined Weather Conditions

Interaction terms (e.g., Temperature × Rainfall) and combinations (Temperature × Rainfall × Humidity × Sunlight) were tested. The overall combined correlation remained very weak (-0.056). Simple combinations do not appear to explain the variance much better than individual variables.

## 8. Weather Impact Score Justification

A simple linear "Weather Impact Score" was proposed by normalizing each variable and weighting it by the sign and magnitude of its overall correlation. This score achieved a correlation of **+0.072** with yield.

**Is it justified?**
Given the extreme weakness of the overall correlations and the fact that weather-yield relationships are heavily dependent on the specific `crop_type` (e.g., rainfall helps soybean but hurts rice in this dataset), a single, universal linear weather impact score is **not well-justified**. Any scoring mechanism should be heavily parameterized by crop type rather than aggregated globally.

## 9. Main Agricultural Insights (Dataset-Specific)

1.  **Variable with the strongest relationship**: Rainfall has the strongest overall relationship (negative), but when segmented, Sunlight for Maize (+0.178) and Rainfall for Rice (-0.238) are the most notable drivers.
2.  **Ranges associated with higher yields**: Medium-low temperature and sunlight, low rainfall.
3.  **Ranges associated with lower yields**: Low temperature and sunlight, medium-low rainfall.
4.  **Crop variance**: Yes, the relationships vary significantly. What works for Wheat (higher temp) doesn't work for Cotton.
5.  **Regional variance**: South India outperforms South USA on average, with distinct weather profiles.
6.  **Monthly patterns**: Observation month 8 is a major outlier with significantly lower yields.

## 10. Limitations

*   **Small Sample Size**: With only 400 training records, splitting the data by crop type or region leaves very small sample sizes (e.g., 61 records for Rice). Findings from these small subsets may be noise rather than true agricultural patterns.
*   **Association vs. Causation**: The relationships identified are purely correlational. For example, lower yield in Observation Month 8 could be due to factors outside of weather that occur simultaneously in that month.
*   **Non-linear Relationships**: The weak linear correlations suggest that if a true relationship exists, it is likely non-linear (e.g., crop yield drops only at extreme weather limits), which correlation coefficients do not capture well.
