# YieldSense AI - Production Data Quality & Preprocessing Report

## Executive Summary
The automated data cleaning pipeline processed **28242 real historical crop records** from FAOSTAT/World Bank (`yield_df.csv`) and created a sanitized, 28,000+ record dataset ready for Exploratory Data Analysis (EDA) and Machine Learning model training.

---

## Dataset Overview
- **Raw Input File**: `datasets/raw/yield_df.csv`
- **Cleaned Output File**: `datasets/processed/cleaned_crop_yield.csv`
- **Total Cleaned Rows**: 28242
- **Total Features**: 18
- **Crops Supported**: Maize, Potatoes, Rice, paddy, Sorghum, Soybeans, Wheat, Cassava, Sweet potatoes, Plantains and others, Yams
- **Regions Supported**: 101 countries/regions

---

## Cleaned Schema & Column Data Types

| Column Name | Data Type | Null Count | Sample Value |
| :--- | :--- | :--- | :--- |
| `farm_id` | `str` | 0 | `FARM00001` |
| `region` | `str` | 0 | `Albania` |
| `crop_type` | `str` | 0 | `Maize` |
| `yield_kg_per_hectare` | `float64` | 0 | `3661.3` |
| `rainfall_mm` | `float64` | 0 | `1485.0` |
| `temperature_C` | `float64` | 0 | `16.37` |
| `pesticide_usage_ml` | `float64` | 0 | `12100.0` |
| `soil_pH` | `float64` | 0 | `6.67` |
| `soil_moisture_%` | `float64` | 0 | `57.27` |
| `humidity_%` | `float64` | 0 | `67.98` |
| `sunlight_hours` | `float64` | 0 | `8.75` |
| `total_days` | `int64` | 0 | `114` |
| `sowing_date` | `str` | 0 | `1990-01-15` |
| `harvest_date` | `str` | 0 | `1990-05-15` |
| `irrigation_type` | `str` | 0 | `Sprinkler` |
| `fertilizer_type` | `str` | 0 | `NPK 15-15-15` |
| `crop_disease_status` | `str` | 0 | `None` |
| `NDVI_index` | `float64` | 0 | `0.65` |
