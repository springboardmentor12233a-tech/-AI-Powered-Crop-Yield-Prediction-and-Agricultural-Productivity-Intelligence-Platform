x   # Milestone 1 — Exploratory Data Analysis (EDA)

## 1. Project Overview

### Project Name
AI-Powered Crop Yield Prediction and Agricultural Productivity Intelligence Platform

### Objective
The objective of this project is to analyze agricultural data and build a system that can help predict crop yield using environmental, soil, crop, irrigation, fertilizer, and other agricultural factors.

---

## 2. Dataset

The dataset used for the project is:

`Smart_Farming_Crop_Yield_2024.csv`

### Dataset Information

- Number of Rows: 500
- Number of Columns: 22
- Target Variable: `yield_kg_per_hectare`
- Missing Values: None
- Duplicate Rows: None

The dataset contains information related to soil conditions, weather conditions, crop information, irrigation, fertilizer usage, location, and crop yield.

---

## 3. Data Quality Analysis

The dataset was checked for:

- Missing values
- Duplicate records
- Data types
- Numerical and categorical features
- Basic statistical information

The dataset does not contain duplicate rows, and no missing values were found in the analyzed dataset.

---

## 4. Target Variable Analysis

The target variable is:

`yield_kg_per_hectare`

### Yield Statistics

- Mean Yield: 4037.78 kg/hectare
- Median Yield: 4071.69 kg/hectare
- Minimum Yield: 2023.56 kg/hectare
- Maximum Yield: 5989.29 kg/hectare

The distribution of crop yield was visualized using a histogram to understand the overall spread of yield values.

---

## 5. Crop-wise Yield Analysis

Average yield was calculated for different crop types.

The analysis shows that average crop yield is different across crop types.

The crop-wise comparison helps identify which crops have relatively higher or lower average yields in the dataset.

A bar chart was used to visualize the average yield for each crop type.

---

## 6. Categorical Analysis

Categorical variables were analyzed using visualizations such as box plots.

The analysis included:

- Crop Type
- Region
- Season

These visualizations help compare the distribution of yield across different categories.

The box plots show that yield distributions vary across crop types, regions, and seasons.

---

## 7. Irrigation Analysis

Average yield was calculated for different irrigation types.

### Average Yield by Irrigation Type

| Irrigation Type | Average Yield (kg/hectare) |
|---|---:|
| Sprinkler | 4084.41 |
| Manual | 4070.09 |
| Drip | 4019.45 |
| Unknown | 3972.13 |

Sprinkler irrigation has the highest average yield in this dataset, followed by Manual and Drip irrigation.

The Unknown category has the lowest average yield.

---

## 8. Fertilizer Analysis

Average yield was calculated for different fertilizer types.

### Average Yield by Fertilizer Type

| Fertilizer Type | Average Yield (kg/hectare) |
|---|---:|
| Inorganic | 4087.12 |
| Organic | 4039.28 |
| Mixed | 3972.41 |

Inorganic fertilizer has the highest average yield in the dataset, followed by Organic and Mixed fertilizer.

These results show differences in average yield between fertilizer categories, but they do not prove that fertilizer type directly causes higher or lower yield.

---

## 9. Correlation Analysis

A correlation heatmap was created for numerical features.

Correlation values range from -1 to +1:

- Positive value → variables tend to increase together.
- Negative value → one variable tends to increase when the other decreases.
- Value close to 0 → weak linear relationship.

The correlation analysis was used to understand relationships between numerical agricultural and environmental variables.

---

## 10. Features Most Correlated with Yield

The correlation of numerical features with `yield_kg_per_hectare` was analyzed.

### Correlation with Yield

| Feature | Correlation |
|---|---:|
| rainfall_mm | -0.08 |
| soil_moisture_% | -0.06 |
| pesticide_usage_ml | 0.04 |
| humidity_% | 0.04 |
| latitude | -0.04 |
| NDVI_index | 0.04 |
| temperature_C | 0.03 |
| soil_pH | 0.02 |
| longitude | 0.02 |
| sunlight_hours | 0.02 |

The correlation values are generally close to zero. Therefore, no single numerical feature shows a strong linear correlation with crop yield in this dataset.

These features can still be considered during feature engineering and machine learning because relationships may be non-linear or may depend on combinations of multiple features.

---

## 11. Outlier Detection

Box plots were used to identify possible outliers in numerical features.

The analysis included:

- Soil moisture
- Soil pH
- Temperature
- Rainfall
- Humidity
- Sunlight hours
- Pesticide usage
- Total growing days
- Crop yield
- NDVI index

Outlier detection helps identify unusual agricultural or environmental observations that may require further investigation before machine learning.

---

## 12. Date and Duration Analysis

The sowing date, harvest date, and growing duration were analyzed.

### Growing Duration Statistics

- Number of Records: 500
- Mean Growing Days: 119.50
- Standard Deviation: 16.00
- Minimum: 90 days
- Median: 119 days
- Maximum: 150 days

The growing duration provides useful information about the crop growth cycle and can be considered as a feature for crop-yield prediction.

---

## 13. Key Findings

1. The dataset contains agricultural and environmental information useful for crop-yield analysis.
2. The target variable is `yield_kg_per_hectare`.
3. Crop types show differences in their average yield.
4. Yield also varies across irrigation and fertilizer categories.
5. Sprinkler irrigation has the highest average yield among the irrigation categories shown.
6. Inorganic fertilizer has the highest average yield among the fertilizer categories shown.
7. Correlation analysis shows that the numerical features have mostly weak linear correlations with yield.
8. Rainfall has the strongest negative correlation with yield among the listed numerical features, with a correlation of -0.08.
9. Soil moisture has the second strongest negative correlation with yield, with a correlation of -0.06.
10. Outlier analysis helps identify unusual observations in agricultural and environmental variables.
11. Growing duration provides additional information that may be useful for crop-yield prediction.

---

## 14. EDA Conclusion

The dataset was explored using data-quality checks, statistical analysis, categorical analysis, visualizations, correlation analysis, and outlier detection.

The EDA provides a foundation for the next stages of the project, including data preprocessing, feature engineering, and machine learning model development for crop-yield prediction.

The analysis does not indicate a strong linear relationship between any single numerical feature and crop yield. Therefore, multiple features and their possible interactions should be considered during model development.