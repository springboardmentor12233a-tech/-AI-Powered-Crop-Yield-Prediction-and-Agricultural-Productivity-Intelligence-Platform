# YieldSense AI - Agricultural Datasets Overview

This directory contains the raw and processed datasets used by the **YieldSense AI** Forecasting System.

## Project Structure
- `raw/`: Unaltered source files separated by catalog/domain.
  - `faostat/`: FAOSTAT Crop Production references.
  - `kaggle_crop_yield/`: Downloaded Kaggle Crop Yield dataset.
  - `usda/`: USDA agricultural census statistics.
  - `weather/`: Historical temperature and rainfall logs.
  - `soil/`: Chemical and organic soil profile maps.
- `processed/`: Formatted, cleaned, and standardized datasets optimized for machine learning.

---

## Dataset 1: Kaggle Crop Yield Prediction (Active)

- **Dataset Name**: Crop Yield Prediction Dataset
- **Source**: Public Kaggle ML Repository / Explore-AI Public Dataset Mirror
- **Official / Download URL**: [Explore-AI Public Crop Yield Mirror](https://raw.githubusercontent.com/Explore-AI/Public-Data/master/Data/Python/Crop_yield.csv)
- **File Format**: CSV
- **Number of Rows**: 1,000
- **Number of Columns**: 9
- **License / Usage**: Public Domain CC0 / Educational Use
- **Description**: Contains 1,000 historical observations mapping agricultural growth attributes, weather parameters, and fertilizer inputs to final crop yields.

### Attribute Reference
| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `Region` | Categorical (String) | Geographic region (East, West, North, South) |
| `Temperature` | Numerical (Float) | Average seasonal temperature in °C |
| `Rainfall` | Numerical (Float) | Average seasonal rainfall in mm (contains anomalous negative values) |
| `Soil_Type` | Categorical (String) | Physical soil classification (Clay, Sandy, Loam, Silt, Peaty) |
| `Fertilizer_Usage`| Numerical (Float) | Amount of chemical fertilizer applied in kg/acre |
| `Pesticide_Usage` | Numerical (Float) | Amount of chemical pesticide applied in kg/acre |
| `Irrigation` | Binary (Integer) | Flag indicating if manual irrigation was active (1: Yes, 0: No) |
| `Crop_Variety` | Categorical (String) | Cultivar subclass (Variety A, Variety B, Variety C) |
| `Yield` | Numerical (Float) | Final crop yield output in tons/acre (target variable, contains anomalies) |

### Why it is useful for YieldSense AI
This dataset serves as the foundational matrix for validating our preprocessing module and training the machine learning pipeline in Milestone 2. It models complex non-linear interactions between weather factors (rainfall, temperature), inputs (fertilizer, pesticide, irrigation), and target yields. It also includes key negative-value anomalies in `Rainfall` and `Yield` columns that let us test the robustness of our pipeline.

---

## Dataset 2: FAOSTAT Crop Production (Documented Reference)

- **Dataset Name**: FAOSTAT Crop Production Indicators
- **Source**: Food and Agriculture Organization (FAO) of the United Nations
- **Official / Download URL**: [FAOSTAT Production Portal](https://www.fao.org/faostat/en/#data/QCL)
- **File Format**: CSV / JSON API
- **License / Usage**: Open access under FAO terms.
- **Description**: Broad, country-level aggregate datasets showing annual crop yields (hg/ha), production quantities (tonnes), and harvested areas (hectares) globally. Used to evaluate regional yield distributions and historical trends.

---

## Dataset 3: USDA Agricultural Data (Documented Reference)

- **Dataset Name**: USDA Quick Stats
- **Source**: United States Department of Agriculture (USDA) National Agricultural Statistics Service (NASS)
- **Official / Download URL**: [USDA Quick Stats Database](https://quickstats.nass.usda.us/api)
- **File Format**: CSV API
- **License / Usage**: Open government data.
- **Description**: Historical crop acreage, production yield data, and demographic summaries at local, county, and state levels across the United States. Used for comparative analysis of high-yield modern farms.
