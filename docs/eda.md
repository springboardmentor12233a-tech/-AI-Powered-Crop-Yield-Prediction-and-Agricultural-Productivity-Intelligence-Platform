# Exploratory Data Analysis (EDA)

## YieldSenseAI – Crop Yield Prediction & Agricultural Productivity Intelligence Platform

## 1. Objective

Exploratory Data Analysis (EDA) was performed to understand the processed agricultural dataset, identify data-quality issues, study the target variable, and analyze relationships between agricultural features and crop yield.

The EDA was performed on the processed training dataset:

`data/processed/train_processed.csv`

The test dataset was kept separate for final model evaluation.

---

## 2. Dataset Overview

The processed training dataset contains:

- **Rows:** 400
- **Columns:** 39
- **Target Variable:** `yield_kg_per_hectare`

The dataset contains numerical features and one-hot encoded categorical features.

### Main Feature Categories

- Soil characteristics
- Weather conditions
- Crop information
- Geographical information
- Vegetation information
- Irrigation information
- Fertilizer information
- Crop disease status
- Crop growth and time-related features

---

## 3. Data Quality Analysis

### Missing Values

The dataset was checked for missing values.

**Result:**

- No missing values were found.

### Duplicate Records

The dataset was checked for duplicate rows.

**Result:**

- No duplicate rows were found.

Therefore, the processed training dataset was considered clean for further analysis.

---

## 4. Target Variable Analysis

The target variable is:

`yield_kg_per_hectare`

It represents crop yield in kilograms per hectare.

### Target Statistics

| Statistic | Value |
|---|---:|
| Number of records | 400 |
| Mean | 4037.78 kg/hectare |
| Median | 4071.69 kg/hectare |
| Minimum | 2023.56 kg/hectare |
| Maximum | 5998.29 kg/hectare |

The mean and median are relatively close, indicating that the target does not show extreme skewness.

---

## 5. Crop Yield Distribution

A histogram and KDE plot were used to visualize the distribution of crop yield.

The target values range approximately from:

**2023.56 to 5998.29 kg/hectare**

The distribution analysis helps understand the range and concentration of crop-yield values available for model training.

---

## 6. Outlier Analysis

A boxplot was used to identify potential outliers in crop yield.

The analysis did not reveal any extreme target values that required removal.

Therefore, no yield records were removed based solely on the boxplot analysis.

---

## 7. Feature Distribution Analysis

Distribution analysis was performed on the numerical agricultural features.

The analyzed features include:

- Soil moisture
- Soil pH
- Temperature
- Rainfall
- Humidity
- Sunlight hours
- Pesticide usage
- Total crop-cycle days
- Latitude
- Longitude
- NDVI index
- Sowing information
- Observation information
- Days since sowing
- Crop cycle progress

Since the data has already been scaled during preprocessing, the distributions represent transformed values rather than the original measurement units.

---

## 8. Correlation Analysis

Pearson correlation was calculated between numerical features and crop yield.

### Strongest Positive Correlation

`num__pesticide_usage_ml`

Correlation:

**0.0599**

### Strongest Negative Correlation

`num__soil_moisture_%`

Correlation:

**-0.1105**

All individual numerical features show relatively weak linear correlation with crop yield.

This indicates that crop yield may depend on the combined effect and interaction of multiple agricultural and environmental factors rather than a single feature.

---

## 9. Correlation Matrix

A correlation heatmap was generated to analyze relationships between numerical features.

Several time-related features showed strong relationships with each other.

In particular:

- `num__days_since_sowing`
- `num__crop_cycle_progress`

showed a very strong correlation.

Other relationships were also observed between observation-related and crop-cycle features.

These highly correlated features will be considered during feature selection before model training.

---

## 10. Crop Type Analysis

Average crop yield was calculated for each crop type.

The analyzed crop types were:

- Soybean
- Wheat
- Maize
- Cotton
- Rice

### Findings

- **Highest average yield:** Soybean
- **Lowest average yield:** Rice

The differences between crop types provide useful information for the prediction model.

---

## 11. Region Analysis

Average crop yield was analyzed across geographical regions.

The regions included:

- South India
- East Africa
- North India
- Central USA
- South USA

### Findings

- **Highest average yield:** South India
- **Lowest average yield:** South USA

This indicates that geographical information may contribute to crop-yield prediction.

---

## 12. Irrigation Analysis

Average crop yield was compared across irrigation types:

- Drip
- Sprinkler
- Manual
- Unknown

### Findings

- **Highest average yield:** Drip
- **Lowest average yield:** Unknown

The differences are relatively small, so irrigation type should be considered together with other agricultural features.

---

## 13. Fertilizer Analysis

Average crop yield was analyzed for different fertilizer types:

- Inorganic
- Organic
- Mixed

### Findings

- **Highest average yield:** Inorganic
- **Lowest average yield:** Mixed

These results represent patterns observed in the current dataset and do not establish a causal relationship.

---

## 14. Disease Status Analysis

Average crop yield was compared across crop disease-status categories:

- Mild
- Moderate
- Severe
- Unknown

### Findings

- **Highest average yield:** Mild
- **Lowest average yield:** Moderate

Disease status may provide useful information for predicting crop yield.

---

## 15. Key EDA Findings

The major findings from the EDA are:

1. The dataset contains **400 records and 39 columns**.
2. No missing values were found.
3. No duplicate records were found.
4. The target variable is `yield_kg_per_hectare`.
5. Mean crop yield is **4037.78 kg/hectare**.
6. Median crop yield is **4071.69 kg/hectare**.
7. Crop yield ranges from **2023.56 to 5998.29 kg/hectare**.
8. Pesticide usage has the strongest positive linear correlation with yield.
9. Soil moisture has the strongest negative linear correlation with yield.
10. Individual numerical features have relatively weak linear correlations with yield.
11. Soybean has the highest average yield among the crop types.
12. Rice has the lowest average yield among the crop types.
13. South India has the highest average yield among the analyzed regions.
14. South USA has the lowest average yield among the analyzed regions.
15. Drip irrigation has the highest average yield among irrigation categories.
16. Inorganic fertilizer has the highest average yield among fertilizer categories.
17. Mild disease status has the highest average yield among disease categories.
18. Several time-related features are highly correlated and should be considered during feature selection.

---

## 16. EDA Conclusion

The Exploratory Data Analysis stage has been completed successfully.

The analysis confirms that the processed dataset is clean and suitable for machine learning experimentation.

EDA provided insights into:

- Dataset quality
- Target distribution
- Potential outliers
- Feature distributions
- Feature correlations
- Crop-wise yield variation
- Region-wise yield variation
- Irrigation-wise yield variation
- Fertilizer-wise yield variation
- Disease-status-wise yield variation

The next stage is **Feature Selection and Machine Learning Model Development**.

### Project Workflow

```text
Dataset Collection
        ↓
Data Preprocessing
        ↓
Processed Training & Testing Data
        ↓
Exploratory Data Analysis (EDA)
        ↓
Feature Selection
        ↓
Model Training
        ↓
Model Evaluation
        ↓
Best Model Selection
        ↓
Prediction System