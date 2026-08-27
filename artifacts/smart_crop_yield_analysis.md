# Smart Crop Yield Dataset Analysis - YieldSense AI

This report provides a detailed analysis of Dataset B (**Smart Crop Yield Prediction**), profiling its variables, regression target, data quality, and suitability for yield forecasting.

---

## 1. Dataset Overview
- **Path**: `data/raw/crop_yield_dataset.csv`
- **Processed Path**: `data/processed/smart_crop_yield_cleaned.csv`
- **Dimensions**: 10,000 observations, 13 columns.
- **ML Target**: `Yield_ton_per_ha` (Continuous numeric regression).

---

## 2. Actual Schema & Variable Classification

- **Numerical Features**: `Soil_pH`, `Rainfall_mm`, `Temperature_C`, `Humidity_pct`, `Fertilizer_Used_kg`, `Pesticides_Used_kg`, `Planting_Density`.
- **Categorical Features**: `Crop`, `Region`, `Soil_Type`, `Irrigation`, `Previous_Crop`.
- **Regression Target**: `Yield_ton_per_ha`.

---

## 3. Data Quality & Imputation

- **Duplicates**: 0 duplicate records.
- **Missing Values**:
  - `Irrigation`: 2,538 missing values (25.38%).
  - `Previous_Crop`: 2,031 missing values (20.31%).
  - *Mitigation*: To avoid fabricating agricultural facts, all missing cells are mapped to `"Unknown"`. Post-processing datasets contain 0 missing values.
- **Categorical Splits (Post-Processing)**:
  - **Crop** (4): Rice (2,536), Barley (2,501), Wheat (2,486), Maize (2,477).
  - **Region** (4): Region_A (2,561), Region_B (2,501), Region_D (2,492), Region_C (2,446).
  - **Soil_Type** (3): Loam (3,388), Sandy (3,328), Clay (3,284).
  - **Irrigation** (4): Unknown (2,538), Flood (2,530), Drip (2,472), Sprinkler (2,460).
  - **Previous_Crop** (5): Unknown (2,031), Rice (2,072), Maize (1,972), Barley (1,965), Wheat (1,960).

---

## 4. Target Statistics & Numerical Ranges
The regression target exhibits a highly symmetric distribution:
- **Yield (ton/ha)**: Min: 28.45 | Max: 207.21 | Mean: 117.89 | Median: 117.71 | Std: 37.97.
- **Outlier Assessment**: Zero outliers were identified in any numerical column. The distributions of soil pH, temperature, humidity, rainfall, fertilizer, and planting density are highly uniform/normal with no anomalies or extreme skewness.
- **Simulated Properties**: The lack of outliers, uniform categorical categories, and near-zero correlation (e.g. soil pH and rainfall have correlations of -0.01 and +0.00 with yield) confirm that the dataset is fully simulated.

---

## 5. Potential Data Leakage Features
- **`Fertilizer_Used_kg` & `Pesticides_Used_kg`**: These are seasonal application totals. In a production environment, farmers predict yield at planting time, *before* chemical application. If actual, post-harvest chemical values are used, this causes **data leakage** because that data is not available at prediction time.
- **Recommendation**: Retain these features but classify them as "problematic" in the leakage assessment and train models both with and without them to evaluate sensitivity.
