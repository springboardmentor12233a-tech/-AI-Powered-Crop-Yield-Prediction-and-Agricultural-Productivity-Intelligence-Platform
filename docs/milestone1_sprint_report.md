# YieldSense AI: Crop Yield Prediction & Agricultural Productivity Intelligence Platform

## Milestone 1 Summary Report: Project Initialization & Core Data Foundation
**Author**: Data Engineering & Architecture Lead  
**Target Audience**: Sprint Review Panel, Technical Stakeholders, and Project Sponsors  

---

## 1. Executive Summary & Project Title
**Project Title**: *YieldSense AI — Crop Yield Prediction & Agricultural Productivity Intelligence Platform*  

This document serves as the formal review report for **Milestone 1 (Weeks 1 & 2)**. The goal of this milestone was to establish a production-grade data foundation and environmental infrastructure for YieldSense AI. This platform is designed to assist farmers, regional agronomists, and administrators by forecasting crop yield, estimating seasonal harvest outputs, and offering crop recommendations based on meteorological and soil properties. 

In this milestone, we successfully designed and built the raw data ingestion pipelines, implemented quality-assurance validations, generated key statistical profiles, modeled PostgreSQL relational tables, and scaffolded the FastAPI backend and Next.js frontend environments.

---

## 2. Milestone 1 Objectives
The core objectives for Milestone 1 were derived from the authoritative project specification and finalized through stakeholder alignment:
1. **Initialize Workspace Architecture**: Create standard python package folders, configuration handlers, and logging infrastructure.
2. **Source and Profile Agricultural Datasets**: Locate, audit, and document the attributes, ranges, and target classes of the selected datasets.
3. **Build Data Preprocessing Pipelines**: Develop reproducible, modular cleaning workflows to handle whitespace formatting, missing cells, and outliers.
4. **Implement Data Validation Checks**: Write validation engines that differentiate between invalid data (hard errors) and unusual but valid agronomic observations (soft warnings).
5. **Design Relational & Telemetry Schemas**: Create PostgreSQL table schemas, indexes, and custom enums, and design a MongoDB document schema for future IoT sensor telemetry.
6. **Execute Exploratory Data Analysis (EDA)**: Programmatically plot distributions and correlations to discover potential data patterns and detect data leakage.
7. **Scaffold Local Development Environments**: Scaffold backend API modules (FastAPI) with role-based JWT authentication and initialize the frontend application structure (Next.js).

---

## 3. Dataset Sourcing & Citations

YieldSense AI relies on two separate, independent agricultural datasets to feed its recommendation and forecasting modules:

### Dataset A: Crop Recommendation Dataset
*   **Source**: Kaggle Open Datasets ([Crop Recommendation Dataset](https://www.kaggle.com/datasets/arkabhowmik/crop-recommendation)).
*   **Role**: Powers the **Crop Recommendation Module** (multiclass classification).
*   **Attributes**: 7,000 observations containing 5 columns: `Temperature` (°C), `Humidity` (%), `pH` (acidity), `Rainfall` (mm), and `Label` (target crop).
*   **Citation Key**: `[Bhowmik, A. (2020). Crop Recommendation Dataset]`
*   **Key Findings**: Features a perfectly balanced target catalog of **70 unique crop species** (100 samples per crop), making it highly suitable for training classification models.

### Dataset B: Smart Crop Yield Prediction Dataset
*   **Source**: Kaggle Open Datasets ([Smart Crop Yield Prediction Dataset](https://www.kaggle.com/datasets/miadul/smart-crop-yield-predication-dataset)).
*   **Role**: Powers the **Yield Estimation Module** (continuous numeric regression).
*   **Attributes**: 10,000 observations containing 13 columns (soil properties, environmental conditions, management inputs, and crop yields).
*   **Citation Key**: `[Islam, M. (2023). Smart Crop Yield Prediction Dataset]`
*   **Key Findings**: Symmetrical feature distributions with zero outliers, confirming its simulated nature.

---

## 4. Preprocessing & Quality Assurance Workflows

To ensure data readiness, we developed two modular preprocessors in `src/data/`.

### Category Imputation Correction (Avoiding Data Fabrication)
In raw Dataset B, `Irrigation` had 2,538 missing values (25.38% null) and `Previous_Crop` had 2,031 missing values (20.31% null). 
- *Why we corrected this*: The initial implementation made assumptions, automatically converting empty cells in `Irrigation` to `"Rainfed"` and `Previous_Crop` to `"Fallow"`. Fabricating agricultural records without historical data creates a biased model.
- *How we corrected this*: We modified the preprocessor to map all empty cells to the explicit category `"Unknown"`. This preserves data completeness without inventing records.

```python
# Segment from src/data/smart_crop_yield_preprocessing.py
# Fills empty categories with 'Unknown' to avoid bias
df["Irrigation"] = df["Irrigation"].fillna("Unknown")
df["Previous_Crop"] = df["Previous_Crop"].fillna("Unknown")

# Trim whitespace to prevent duplicate categories (e.g. 'Rice ' vs 'Rice')
for col in ["Crop", "Region", "Soil_Type", "Irrigation", "Previous_Crop"]:
    df[col] = df[col].astype(str).str.strip()
```

### Refactoring the Range Validation Logic
A core data quality task was building range validators in `src/data/validation.py`.
- *Why we corrected this*: The first validation script deleted or rejected rows that had extreme values (like rainfall above 3,000 mm). However, high monsoon rainfall is natural in tropical agriculture for crops like Jute, Tea, and Coconuts. Deleting these rows would strip the model of valuable edge cases.
- *How we corrected this*: We refactored validation logic into two categories:
  1.  **Hard Constraints**: Checked values that violate physical laws (e.g., pH outside [0, 14], negative weights, humidity > 100%). These throw a `ValidationError` and stop the pipeline.
  2.  **Soft Warnings**: Checked values that represent extreme weather conditions (e.g., rainfall > 3000 mm, temperature > 45°C). These print log warnings for agronomists but preserve the data.

```python
# Segment from src/data/validation.py
# Hard constraints vs Soft Warnings validator snippet
def validate_numerical_ranges(df, config, dataset_name):
    for col, rules in config.items():
        val_min = df[col].min()
        val_max = df[col].max()
        
        # 1. Hard Physical Constraints
        if val_min < rules["hard_min"] or val_max > rules["hard_max"]:
            raise ValidationError(f"[{dataset_name}] Hard constraint violated in {col}.")
            
        # 2. Soft Agronomic Warnings
        if val_min < rules["soft_min"]:
            logger.warning(f"[{dataset_name}] Soft Warning: {col} min ({val_min}) is low.")
        if val_max > rules["soft_max"]:
            logger.warning(f"[{dataset_name}] Soft Warning: {col} max ({val_max}) is high.")
```

---

## 5. Exploratory Data Analysis (EDA)

The EDA script (`notebooks/eda.py`) generated 8 visualizations saved in `artifacts/eda/`:
1.  **Dataset A Target Balance**: Verifies that each of the 70 crop labels holds exactly 100 rows.
2.  **Dataset B Target Symmetries**: Yield shows a clean normal distribution centered at 117.89 ton/ha.
3.  **Correlations Heatmap**: Reveals that weather/soil features in Dataset B have near-zero correlation with yield, while management inputs (fertilizers, pesticides) show a strong linear correlation, confirming its simulated nature.

---

## 6. How and Why Objectives Were Achieved

We met the objectives through structured engineering decisions:

### A. Why We Keep Dataset A and Dataset B Separate
Some project reviews suggest merging all raw files into a single unified table. We successfully defended keeping them separate:
- **ML Task Mismatch**: Dataset A is a **multiclass classification** task (predicting one of 70 crop types). Dataset B is a **continuous regression** task (predicting crop yield in tons/ha).
- **No Joint Key**: There is no logical row-level key (such as farm plot ID or timestamp) connecting them. Merging them would result in a massive cartesian product (duplicating millions of rows) and corrupting predictions.
- **Range Differences**: Rainfall in Dataset A reaches 5,990 mm (monsoons), while Dataset B limits rainfall to 1,500 mm.

### B. Relational & Telemetry Schema Designs
We designed a hybrid schema in `docs/database_schema.md`:
- **PostgreSQL (Structured Application Store)**: Implements relational integrity constraints. Tables include `users`, `farms`, `plots`, `soil_observations`, `weather_observations`, `crop_recommendations`, and `yield_predictions`. Custom enums are utilized to prevent invalid string entries.
- **MongoDB (IoT Telemetry)**: Proposed for future soil probe telemetry (soil moisture, pH, and soil N/P/K updates).

### C. Environment Scaffolding & API Authentication
To make the platform operational, we scaffolded the following:
- **Next.js (TypeScript/Tailwind CSS)**: Scaffaffolded inside a nested `frontend/` directory (with local git initialized bypassed to protect the workspace repository).
- **FastAPI backend (`src/api/`)**: Built API routers for token authentication and model predictions:
  - Mock **JWT/RBAC tokens** are signed for three user roles: `farmer`, `agronomist`, and `admin`.
  - Predictions and recommendations routes validate incoming JSON payloads using Pydantic, ensuring that input ranges match actual dataset features before returning mock model calculations.

---

## 7. Sprint Review Outcomes & Commit Readiness

### Verification Check Results
Running our preprocessors and CLI audit tool verifies:
- **Preserved Rows**: Dataset A contains exactly 7,000 rows; Dataset B contains exactly 10,000 rows. Zero rows were lost during preprocessing.
- **Preserved Raw Data**: All raw files are untouched in `data/raw/`.
- **Zero Nulls**: All processed CSVs contain zero missing values.
- **Tests Passed**: Run test script `test_api.py` executed against our local FastAPI server and passed all 6 endpoint tests (login, profiles, predictions validation, and error blocking).

**Milestone 1 is complete, verified, and 100% ready for Git commit.**
