# Crop Recommendation Dataset Analysis - YieldSense AI

This report provides a detailed analysis of Dataset A (**Crop Recommendation**), profiling its variables, target classes, data quality, and suitability for the recommendation engine.

---

## 1. Dataset Overview
- **Path**: `data/raw/Crop_Recommendation_Dataset.xlsx`
- **Processed Path**: `data/processed/crop_recommendation_cleaned.csv`
- **Dimensions**: 7,000 observations, 5 columns.
- **ML Target**: `Label` (Categorical multiclass classification).

---

## 2. Target Column & Class Distribution
- **Unique Crops**: Programmatically calculated to be exactly **70 unique crop classes** (e.g., Rice, Maize, Chickpea, Blackgram, Aleovera, Ashwagandha, Coriander, Coffee, Sweet Potato, Rosemary).
- **Samples per Crop**: Exactly **100 rows per crop label**.
- **Class Balance**: The dataset is perfectly balanced. Each crop represents exactly 1.43% of the total dataset. No down-sampling or synthetic sampling (like SMOTE) is required.
- **Whitespace / Casing Inconsistencies**: Trimming whitespaces (`str.strip()`) was applied to prevent duplicate categories caused by trailing spaces (e.g. `'Rice '` vs `'Rice'`). The casing is standard title casing.

---

## 3. Data Quality & Outlier Assessment
- **Missing Values**: 0.00% missing values.
- **Duplicates**: 0.00% duplicate records.
- **Plausibility & Outliers**:
  - **pH**: Bounded between 3.50 and 9.94. A pH of 3.5 is highly acidic (plausible for specialized crops like tea or blueberry), and 9.94 is highly alkaline. No records violate the physical pH scale (0–14).
  - **Humidity**: Ranges from 6.03% to 100.00%. Bounded within the logical percentage limit [0, 100].
  - **Temperature**: Ranges from 6.10°C to 46.79°C. Soft warnings were logged for extreme temperatures (< 10°C and > 45°C), which represent extreme winter/arid climates, but these rows are valid and preserved.
  - **Rainfall**: Bounded between 20.21 mm and **5,989.99 mm**. A value of 5,989.99 mm is exceptionally high but plausible for high-monsoon tropical regions where crops like Jute, Tea, and Coconut thrive. Because these correspond to specific agronomic profiles, they are retained as valuable edge cases rather than deleted as anomalies. The specific aggregation period for rainfall is undefined in the source data.

---

## 4. Suitability and Limitations for YieldSense AI

### Suitability:
- Highly suitable for the **Crop Recommendation Module** outlined in Section 5 of the PDF spec.
- Provides a wide crop catalog (70 species) with a perfectly balanced structure.

### Limitations:
- **Absence of Soil Nutrients**: Public versions of Kaggle's crop recommendation dataset typically contain soil Nitrogen (N), Phosphorus (P), and Potassium (K) measurements. **The local Excel file in this workspace does not contain these columns.** Recommending crops is restricted to soil pH and meteorological inputs (temperature, humidity, rainfall). We must not claim nutrient support.
- **Agrometeorological Agnosticism**: No coordinates, seasons, or soil classification types are included, limiting geo-spatial adaptation.
