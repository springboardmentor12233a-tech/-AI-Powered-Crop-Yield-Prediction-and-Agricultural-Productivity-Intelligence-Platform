# Data Dictionary - YieldSense AI

This document details all columns present in the raw and processed datasets of the **YieldSense AI** platform.

---

## Dataset A: Crop Recommendation
**Purpose**: Agricultural crop recommendation based on weather and soil pH conditions.  
**Raw Source File**: `data/raw/Crop_Recommendation_Dataset.xlsx` (Excel)  
**Processed File**: `data/processed/crop_recommendation_cleaned.csv` (CSV)

| Column Name | Data Type | Category | ML Role | Range / Unique Count | Meaning / Description | Preprocessing Applied |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Temperature** | `float64` | Weather / Environment | Feature | 6.11 to 46.79 °C | Ambient atmospheric temperature in degrees Celsius. | Range validated. Extreme values preserved. |
| **Humidity** | `float64` | Weather / Environment | Feature | 6.03 to 100.00 % | Relative atmospheric humidity percentage. | Range validated. Bounded within logical 100% limit. |
| **pH** | `float64` | Soil | Feature | 3.50 to 9.94 | Soil acidity or alkalinity levels (pH scale: 0–14). | Range validated. Bounded within logical scale. |
| **Rainfall** | `float64` | Weather / Environment | Feature | 20.21 to 5990.00 mm | Cumulative water precipitation volume in millimeters. Note that the specific aggregation period (e.g. annual, seasonal) is not officially defined by the dataset source. The maximum value of 5990 mm is treated as a potential data-quality or extreme plausibility observation and is preserved. | Range validated. Extreme values preserved. |
| **Label** | `object` (string) | Crop | **Target** | 70 unique classes (100 rows each) | The recommended crop classification name (e.g., Rice, Maize, Coffee). | Whitespace trimmed (`strip()`). |

*Note: Soil nutrients (Nitrogen, Phosphorous, Potassium) are **not** present in the raw crop recommendation dataset.*

---

## Dataset B: Smart Crop Yield Prediction
**Purpose**: Continuous yield forecasting based on agricultural management decisions and local environmental conditions.  
**Raw Source File**: `data/raw/crop_yield_dataset.csv` (CSV)  
**Processed File**: `data/processed/smart_crop_yield_cleaned.csv` (CSV)

| Column Name | Data Type | Category | ML Role | Range / Unique Count | Meaning / Description | Preprocessing Applied |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Crop** | `object` (string) | Crop | Feature | 4 unique crops (Maize, Barley, Rice, Wheat) | The current crop species planted in the field. | Whitespace trimmed. |
| **Region** | `object` (string) | Geographic | Feature | 4 unique regions (Region_A, Region_B, Region_C, Region_D) | The geographic location identifier of the farm. | Whitespace trimmed. |
| **Soil_Type** | `object` (string) | Soil | Feature | 3 unique types (Sandy, Loam, Clay) | The physical soil texture classification of the plot. | Whitespace trimmed. |
| **Soil_pH** | `float64` | Soil | Feature | 5.50 to 7.50 | The measured soil pH level in the field. | Range validated. |
| **Rainfall_mm** | `float64` | Weather / Environment | Feature | 200.00 to 1499.70 mm | The seasonal precipitation volume recorded in millimeters. | Range validated. |
| **Temperature_C** | `float64` | Weather / Environment | Feature | 15.00 to 35.00 °C | The mean seasonal temperature recorded in degrees Celsius. | Range validated. |
| **Humidity_pct** | `float64` | Weather / Environment | Feature | 30.00 to 90.00 % | The average relative humidity level percentage. | Range validated. |
| **Fertilizer_Used_kg** | `float64` | Management | Feature | 50.00 to 300.00 kg | Mass of agricultural fertilizer applied to the soil in kilograms per crop cycle. | Range validated. |
| **Irrigation** | `object` (string) | Management | Feature | 4 unique categories (Sprinkler, Flood, Drip, Unknown) | The method of water delivery applied to the crop. | Raw dataset contained 2,538 missing values (25.38% NaN), which were filled with the explicit category `"Unknown"`. |
| **Pesticides_Used_kg** | `float64` | Management | Feature | 0.00 to 50.00 kg | Mass of chemical pest control agent applied in kilograms. | Range validated. |
| **Planting_Density** | `float64` | Management | Feature | 5.00 to 25.00 | Number of individual plants sown per unit area (plants/m²). | Range validated. |
| **Previous_Crop** | `object` (string) | Agricultural history | Feature | 5 unique categories (Rice, Barley, Wheat, Maize, Unknown) | The crop harvested from this field in the immediate preceding agricultural cycle. | Raw dataset contained 2,031 missing values (20.31% NaN), which were filled with the explicit category `"Unknown"`. |
| **Yield_ton_per_ha** | `float64` | Production | **Target** | 28.45 to 207.21 ton/ha | Crop harvest productivity output in metric tons per hectare. | Target validated. |
