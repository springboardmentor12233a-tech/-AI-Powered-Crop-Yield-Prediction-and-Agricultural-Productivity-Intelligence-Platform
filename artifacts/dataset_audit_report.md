# Dataset Audit Report - YieldSense AI

This report presents programmatic dataset audits for the agricultural datasets present in the workspace.

---

## 1. Summary Dashboard

| Metric | Dataset A: Crop Recommendation | Dataset B: Smart Crop Yield Prediction |
| :--- | :--- | :--- |
| **Filename** | `Crop_Recommendation_Dataset.xlsx` | `crop_yield_dataset.csv` |
| **Format** | Microsoft Excel (.xlsx) | Comma Separated Values (.csv) |
| **File Size** | 395,714 bytes (395.7 KB) | 757,884 bytes (757.9 KB) |
| **Row Count** | 7,000 | 10,000 |
| **Column Count** | 5 | 13 |
| **Duplicate Rows** | 0 (0.00%) | 0 (0.00%) |
| **Total Missing Values** | 0 (0.00%) | 4,569 (3.51% of raw matrix) |
| **Target Column** | `Label` (Multiclass Categorical) | `Yield_ton_per_ha` (Continuous Numeric) |
| **ML Workflow Role** | Classification / Crop recommendation | Regression / Crop yield prediction |

---

## 2. Dataset A Profile: Crop Recommendation

### Columns & Data Types
- **Temperature**: `float64` (Numeric feature)
- **Humidity**: `float64` (Numeric feature)
- **pH**: `float64` (Numeric feature)
- **Rainfall**: `float64` (Numeric feature)
- **Label**: `object` (Categorical target)

### Data Quality (Missingness & Duplicates)
- **Missing values**: 0 missing values across all columns.
- **Duplicates**: 0 duplicate rows detected.

### Target Crop Balance
- **Label**: 70 unique values. Each label has **exactly 100 rows** (1.43% of the dataset), representing a perfectly balanced classification target. No class weighting or SMOTE sampling is required.

### Numerical Distribution Summary
- **Temperature (°C)**: Min 6.11, Max 46.79. Mean 23.49, Median 23.34, Std 6.76. Contains 116 soft-plausibility warnings (temperatures above 45°C or below 10°C) which are preserved.
- **Humidity (%)**: Min 6.03, Max 100.00. Mean 71.32, Median 77.24, Std 22.29. Outliers are rare, with 50 rows below 10% humidity.
- **pH**: Min 3.50, Max 9.94. Mean 6.45, Median 6.41, Std 0.67. High-acidity (pH 3.5) and high-alkalinity (pH 9.9) plots are represented.
- **Rainfall (mm)**: Min 20.21, Max 5990.00. Mean 751.48, Median 644.90, Std 825.47. High rainfall observations (> 3,000 mm) occur in 203 rows (primarily under tropical crops like tea, banana, jute) and are preserved.

---

## 3. Dataset B Profile: Smart Crop Yield Prediction

### Columns & Data Types
- **Crop, Region, Soil_Type, Irrigation, Previous_Crop**: `object` (Categorical features)
- **Soil_pH, Rainfall_mm, Temperature_C, Humidity_pct, Fertilizer_Used_kg, Pesticides_Used_kg, Planting_Density**: `float64` (Numeric features)
- **Yield_ton_per_ha**: `float64` (Numeric target)

### Data Quality & Missingness Mitigation
- **Raw Missingness**: 
  - `Irrigation`: 2,538 null values (25.38%).
  - `Previous_Crop`: 2,031 null values (20.31%).
- **Mitigation**: Rather than imputing with default assumptions, we mapped all missing values to `"Unknown"`. Post-processing datasets contain 0 missing values.
- **Duplicates**: 0 duplicate rows detected.
- **Constant / Near-Constant Columns**: None.

### Categorical Columns Distributions (Post-Processing)
- **Crop**: 4 uniform categories (`Rice` 2,536, `Barley` 2,501, `Wheat` 2,486, `Maize` 2,477).
- **Region**: 4 uniform categories (`Region_A` 2,561, `Region_B` 2,501, `Region_D` 2,492, `Region_C` 2,446).
- **Soil_Type**: 3 uniform categories (`Loam` 3,388, `Sandy` 3,328, `Clay` 3,284).
- **Irrigation**: 4 categories (`Unknown` 2,538, `Flood` 2,530, `Drip` 2,472, `Sprinkler` 2,460).
- **Previous_Crop**: 5 categories (`Unknown` 2,031, `Rice` 2,072, `Maize` 1,972, `Barley` 1,965, `Wheat` 1,960).

### Numerical Distribution Summary
Programmatic analysis using IQR identified **zero outliers** across all 8 numerical columns. All ranges are strictly bounded, and value frequencies are symmetrical, which confirms that the dataset is **synthetic/simulated**:
- **Soil_pH**: Min: 5.50 | Max: 7.50 | Mean: 6.52 | Median: 6.52 | Std: 0.57 | Outliers: 0
- **Rainfall_mm**: Min: 200.00 | Max: 1,499.70 | Mean: 843.66 | Median: 845.30 | Std: 373.67 | Outliers: 0
- **Temperature_C**: Min: 15.00 | Max: 35.00 | Mean: 24.98 | Median: 24.90 | Std: 5.79 | Outliers: 0
- **Humidity_pct**: Min: 30.00 | Max: 90.00 | Mean: 60.05 | Median: 60.20 | Std: 17.32 | Outliers: 0
- **Fertilizer_Used_kg**: Min: 50.00 | Max: 300.00 | Mean: 175.08 | Median: 175.00 | Std: 71.96 | Outliers: 0
- **Pesticides_Used_kg**: Min: 0.00 | Max: 50.00 | Mean: 25.06 | Median: 25.30 | Std: 14.35 | Outliers: 0
- **Planting_Density**: Min: 5.00 | Max: 25.00 | Mean: 15.00 | Median: 15.00 | Std: 5.83 | Outliers: 0
- **Yield_ton_per_ha** (Target): Min: 28.45 | Max: 207.21 | Mean: 117.89 | Median: 117.71 | Std: 37.97 | Outliers: 0
