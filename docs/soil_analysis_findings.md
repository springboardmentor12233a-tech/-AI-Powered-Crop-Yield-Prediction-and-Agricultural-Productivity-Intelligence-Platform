# Soil Analysis Findings

This document summarizes the findings from analyzing the historical soil data in our dataset (400 training records) to determine its relationship with agricultural yield. The test set (100 records) was strictly excluded from this analysis.

## 1. Soil Analysis Overview

The purpose of this analysis is to evaluate historical soil conditions against crop yield in the YieldSenseAI dataset. By observing these historical associations, we can provide a data-driven foundation for assessing soil suitability for new records.

## 2. Soil Variables Used

The dataset contains two primary numerical features directly representing soil conditions:
*   `soil_moisture_%`
*   `soil_pH`

## 3. Basic Soil Statistics

Based on the 400 training records, the overall descriptive statistics for the soil variables are:

| Variable | Mean | Std Dev | Min | 25% | Median (50%) | 75% | Max |
|---|---|---|---|---|---|---|---|
| **Soil Moisture (%)** | 26.87 | 10.01 | 10.27 | 18.07 | 25.82 | 36.25 | 44.93 |
| **Soil pH** | 6.55 | 0.58 | 5.51 | 6.07 | 6.58 | 7.04 | 7.50 |

## 4. Soil-Yield Relationships

Overall Pearson correlations between the soil variables and yield across the entire training dataset:

*   **Soil Moisture (%)**: -0.110 (weak negative association, p=0.027)
*   **Soil pH**: +0.041 (weak positive association, p=0.418)

*Note: The negative association of soil moisture indicates that, on average across all crops, higher soil moisture in this dataset slightly correlates with lower yields.*

## 5. Soil Range Analysis

When categorizing the numerical soil variables into quartiles (low, medium-low, medium-high, high), we observe the following patterns:

*   **Soil Moisture (%)**: The `medium-low` quartile (approximately 18% to 25.8%) corresponds with the highest historical average yield (4209 kg/ha). Conversely, the `high` moisture quartile (>36.2%) shows a significantly lower average yield (3763 kg/ha).
*   **Soil pH**: Interestingly, the `high` quartile (>7.04) and `low` quartile (<6.07) showed slightly higher yields (~4108 kg/ha and 4045 kg/ha, respectively) compared to the medium ranges. This suggests crop-specific associations are likely present at varying pH levels.

## 6. Crop-Specific Soil Findings

Because historical soil-yield associations vary by crop, crop-specific analysis yields more useful insights than aggregated data:

*   **Cotton (n=88)**: Demonstrated the strongest negative correlation with soil moisture (-0.215), indicating that higher moisture is more notably associated with lower yield for cotton in this dataset.
*   **Wheat (n=78)**: Also showed a noticeable negative correlation with soil moisture (-0.162). Wheat had the lowest average soil moisture recorded among all crops (25.0%).
*   **Rice (n=61)** and **Maize (n=83)**: Both showed a weak positive correlation with soil pH (~+0.120), indicating a slight association between higher pH levels and better yields for these specific crops.
*   **Soybean (n=90)**: Showed the highest average yield (4285 kg/ha) but displayed very little correlation with soil moisture (-0.052) or pH (-0.007).

## 7. Region-Specific Findings

Regional differences are observed in the training data:
*   **South India** recorded the highest average soil moisture (29.44%) and highest soil pH (6.69). It also reported the highest average yield (4182 kg/ha).
*   **Central USA** reported the lowest average soil pH (6.37) and a moderate average yield (3977 kg/ha).

## 8. Soil Suitability Analysis

**Methodology:**
Given the relatively weak overall linear correlations and the heavy dependence on crop type, an arbitrary "0-100 Suitability Score" is not statistically justified. 

Instead, the data-driven soil suitability analysis answers: *"How does the supplied soil condition compare with soil conditions historically observed for the selected crop, and what soil-yield associations are present in the training data?"*

This is accomplished by:
1.  Checking which overall historical quartile the input falls into, and stating whether that quartile was associated with an above-average or below-average yield in the overall training data.
2.  Checking if the input falls within the middle 50% of historically observed values (the 25th to 75th percentile) for the requested crop. This describes common historical planting conditions, not a biological optimum.
3.  Reporting any observed crop-specific correlations (e.g., stating if moisture has a negative historical correlation with yield for the selected crop).
These analyses do not establish causation.

## 9. Important Agricultural Insights

1.  **High Soil Moisture Association**: The highest soil-moisture quartile (>36.2% in this dataset) was associated with a lower average yield than the other quartiles. At the crop level, this negative association is particularly noticeable for crops like Cotton and Wheat.
2.  **No Universal pH**: No single soil pH range can be identified as a universal optimum from this dataset; different crops show different historical associations across the pH spectrum (e.g., Rice and Maize showed slight positive historical associations between soil pH and yield in this dataset, while the relationships varied across crops).
3.  **Regional Confounding**: South India has the highest average soil moisture and the highest yields. Yet, at the crop level, moisture is negatively correlated with yield. This suggests that regional factors (perhaps sunlight, distinct crop varieties, or farming practices) may be confounding the aggregated soil moisture-yield relationship.

## 10. Limitations

*   **Dataset Size**: The analysis was strictly limited to the 400 training records. When segmenting by crop (e.g., 61 records for Rice), the sample sizes become quite small, which increases the likelihood of statistical noise.
*   **Observational Data (No Causation)**: All findings represent historical associations. For instance, lower yield associated with high soil moisture does *not* prove that the moisture caused the low yield (it could indicate poor drainage in generally lower-yielding fields).
*   **Non-Linearity**: Simple Pearson correlations may miss non-linear relationships (e.g., if the highest yields are historically associated with exactly 20% moisture, but yields are lower at 10% and 30%).
*   **Missing Variables**: Soil health is vastly more complex than just moisture and pH (e.g., nitrogen, phosphorus, potassium, organic matter). The model and analysis are constrained by what is available in the data.
