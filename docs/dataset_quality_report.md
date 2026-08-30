# YieldSense AI - Dataset Quality & Preprocessing Report

## Executive Summary
The automated data cleaning pipeline processed **500 raw crop records** and produced a sanitized dataset ready for Exploratory Data Analysis (EDA) and Machine Learning model training.

---

## Dataset Overview
- **Raw Input File**: `datasets\raw\Smart_Farming_Crop_Yield_2024.csv`
- **Cleaned Output File**: `datasets\processed\cleaned_crop_yield.csv`
- **Total Initial Rows**: 500
- **Total Cleaned Rows**: 500
- **Duplicates Removed**: 0
- **Total Columns**: 22
- **Secondary Dataset**: Excel sheets found: ['Dataset Catalog', 'Feature Mapping', 'Recommended Collection', 'GitHub Structure', 'Source Notes']

---

## Data Cleaning & Transformation Log

### 1. Missing Values Treatment
- `irrigation_type`: Imputed missing entries with `'Unknown'`.
- `crop_disease_status`: Imputed missing entries with `'Unknown'`.
- Remaining Numerical Features: Imputed via median value strategy.
- **Total Remaining Nulls**: **0**

### 2. Feature Engineering & Date Normalization
- `sowing_date` & `harvest_date`: Converted to standard ISO (`YYYY-MM-DD`).
- `total_days`: Recalculated growing cycle duration as `(harvest_date - sowing_date)`.
- `NDVI_index`: Clipped to valid vegetation range `[0.0, 1.0]`.

---

## Cleaned Schema & Column Data Types

| Column Name | Data Type | Null Count | Sample Value |
| :--- | :--- | :--- | :--- |
| `farm_id` | `str` | 0 | `FARM0001` |
| `region` | `str` | 0 | `North India` |
| `crop_type` | `str` | 0 | `Wheat` |
| `soil_moisture_%` | `float64` | 0 | `35.95` |
| `soil_pH` | `float64` | 0 | `5.99` |
| `temperature_C` | `float64` | 0 | `17.79` |
| `rainfall_mm` | `float64` | 0 | `75.62` |
| `humidity_%` | `float64` | 0 | `77.03` |
| `sunlight_hours` | `float64` | 0 | `7.27` |
| `irrigation_type` | `str` | 0 | `Unknown` |
| `fertilizer_type` | `str` | 0 | `Organic` |
| `pesticide_usage_ml` | `float64` | 0 | `6.34` |
| `sowing_date` | `str` | 0 | `2024-01-08` |
| `harvest_date` | `str` | 0 | `2024-05-09` |
| `total_days` | `int64` | 0 | `122` |
| `yield_kg_per_hectare` | `float64` | 0 | `4408.07` |
| `sensor_id` | `str` | 0 | `SENS0001` |
| `timestamp` | `str` | 0 | `2024-03-19` |
| `latitude` | `float64` | 0 | `14.970941` |
| `longitude` | `float64` | 0 | `82.997689` |
| `NDVI_index` | `float64` | 0 | `0.63` |
| `crop_disease_status` | `str` | 0 | `Mild` |

---
*Report generated automatically by `scripts/preprocess_data.py`.*
