---
title: "AgriYield AI"
subtitle: "Milestone 1 Documentation — Requirements and Dataset Exploration"
author: "OVS Varun"
date: "September 2026"
lang: en-IN
---

\vspace*{5cm}

# AI-Based Agricultural Yield Analysis and Forecasting

## Milestone 1: Requirements and Dataset Preparation

AgriYield AI is an agricultural intelligence project intended to support data-driven crop-yield analysis and future forecasting. The system is designed to help farmers, agricultural organisations and planners understand historical crop performance, cultivated area, production and yield at district level.

This Milestone 1 report records the initial dataset exploration and data-quality assessment completed in `combined_eda.ipynb`. It follows the supplied milestone-document format while accurately reflecting the work present in the project.

\vfill

**Submitted by:** OVS Varun  
**Email:** orugantivarun.2007@gmail.com

\newpage

# 1. Project Objective

The objective of AgriYield AI is to build the data foundation for an agricultural productivity and crop-yield forecasting system. The project will use historical district-level agricultural records to analyse crop patterns and prepare suitable features for later machine-learning work.

The project aims to:

- analyse crop-wise cultivated area, production and yield;
- compare yield behaviour across states, districts and years;
- identify data-quality concerns before modelling;
- prepare a structured dataset suitable for crop-yield prediction; and
- support future agricultural insights, recommendations and productivity forecasting.

For modelling, **crop yield (kg per hectare)** is a continuous numerical value. A future yield-prediction task will therefore be treated as a **regression problem**. The present notebook is an exploratory-data-analysis (EDA) milestone; it does not yet train a prediction model.

# 2. Data Source and Dataset Details

The analysis uses the project dataset:

`datasets/ICRISAT_District_Level_Data.csv`

The dataset contains historical district-level agricultural observations for India. Each row represents a district-year record, and the crop information is stored in wide format.

| Dataset property | Value |
|---|---:|
| Total records | 12,418 |
| Total columns | 80 |
| Time coverage | 1978–2017 |
| Years represented | 40 |
| States | 20 |
| District names | 311 |
| Missing values | 0 |
| Exact duplicate rows | 0 |

The columns include district and state identifiers, year, crop area (1000 ha), crop production (1000 tons), and crop yield (kg per ha). There are 29 area-related variables, 23 production-related variables and 23 yield-related variables, alongside the identifier and location fields.

\newpage

# 3. Process Followed

## Step 1: Environment Setup

The EDA was carried out in Jupyter Notebook using Python. The following libraries are imported in `combined_eda.ipynb`:

- `pandas` for dataset loading and tabular analysis;
- `numpy` for numerical operations;
- `matplotlib.pyplot` for visualisation; and
- `seaborn` for statistical charts.

## Step 2: Data Exploration

The dataset was loaded into a pandas DataFrame and inspected using `head()`, `shape`, `columns`, `dtypes`, `info()` and `describe()`.

The initial inspection found 75 floating-point columns, 3 integer columns and 2 categorical text columns (`State Name` and `Dist Name`). Core identifiers are `Dist Code`, `Year` and `State Code`.

## Step 3: Data Quality Checks

The notebook checks null values, duplicate rows, state/district coverage, negative numerical values and zero values.

Results:

- No missing values were found.
- No exact duplicate rows were found.
- No repeated Year–State–District keys were found.
- 4,354 negative numeric cells occur across 1,160 rows. In this historical dataset, these values must be investigated before modelling; they may be coded unavailable values rather than genuine measurements.
- Zero values are common for several crops. They should not automatically be treated as missing because a zero can mean the crop was not cultivated or not recorded in that district-year.

Thus, the dataset is structurally complete, but negative and zero values need crop-aware handling during the modelling-preparation stage.

\newpage

# 4. Exploratory Data Analysis

## Graph 1: State-Year Coverage

![Number of years of data by state](/tmp/agri_report_assets/years_by_state.png){ width=82% }

**Observation:** The dataset provides 40 years of coverage for the participating states. This consistent time span supports comparative trend analysis across states.

## Graph 2: Crop Observation Distribution

![Positive yield observations by crop](/tmp/agri_report_assets/crop_observations.png){ width=82% }

**Observation:** Crop coverage is not uniform. Rice has the highest number of positive-yield records (11,550), followed by minor pulses, maize, chickpea and wheat. This is important when selecting a target crop or building a generalised model.

\newpage

# 5. Data Analysis (Continued)

## Graph 3: Distribution of Crop Yield

![Distribution of positive crop yields](/tmp/agri_report_assets/yield_distribution.png){ width=82% }

**Observation:** The positive-yield data are right-skewed. The median is 846.15 kg/ha, compared with a mean of 1,260.36 kg/ha, showing the influence of high-yield crop observations. The plotted x-axis is limited to the 99th percentile so that the main distribution remains readable.

## Graph 4: Average Yield by Crop

![Average positive yield by crop](/tmp/agri_report_assets/avg_yield_crop.png){ width=82% }

**Observation:** Average yield differs substantially by crop. Sugarcane has the highest average positive yield (about 5,596.41 kg/ha), followed by wheat, maize and rice. This confirms that crop identity is a key feature for any combined yield model.

\newpage

# 6. Relationship Analysis and Feature Preparation

## Graph 5: Correlation Between Area, Production and Yield

![Correlation heatmap](/tmp/agri_report_assets/correlation.png){ width=68% }

**Observation:** Cultivated area and production have a strong positive correlation (0.74). Production and yield have a moderate positive correlation (0.32), while area and yield have a weak correlation (0.06). This indicates that higher cultivated area alone does not imply higher yield per hectare.

## Dataset Reshaping Used in the Notebook

The source data is in wide format: each crop has separate area, production and yield columns. To make crop-wise analysis possible, the notebook reshapes these columns into long tables:

- `yield_long`: Year, State Name, Dist Name, Crop, Yield
- `area_long`: Year, State Name, Dist Name, Crop, Area
- `production_long`: Year, State Name, Dist Name, Crop, Production

These long-format tables are then combined to create a crop-level analytical table. This is an appropriate structure for later regression modelling, because each record can describe one crop in one district and year.

## Recommended Feature Engineering for the Next Milestone

- Replace negative sentinel values with missing values after validating their source meaning.
- Retain meaningful zeros separately from unavailable values.
- Use `Year`, `State Name`, `Dist Name`, `Crop`, `Area`, and `Production` as candidate predictors, depending on the intended prediction scenario.
- One-hot encode categorical features such as state, district and crop.
- Scale numerical predictors when using algorithms sensitive to feature magnitude.
- Split training and test data by time where possible, so the model is evaluated on future-like records.

\newpage

# 7. Challenges Faced

1. **Wide dataset structure:** Crop values are stored in many separate columns, requiring reshaping before crop-level analysis.
2. **Mixed data semantics:** Negative values and zeros require different treatment; neither can be removed blindly.
3. **Uneven crop coverage:** Some crops have fewer positive observations than others, which can affect model reliability.
4. **High-yield outliers:** The positive-yield distribution contains 15,981 potential IQR outliers. These require crop-specific investigation rather than automatic deletion.
5. **Multiple target choices:** The dataset includes yields for 23 crops, so the next milestone must define whether to predict one crop or construct a unified crop-level model.

# 8. Outcome of Milestone 1

- The ICRISAT district-level dataset was loaded and understood.
- Dataset structure, types, time coverage and geographic coverage were documented.
- Missing values, exact duplicate rows and duplicate location-time keys were checked.
- Negative and zero values were identified as important data-preparation considerations.
- The crop data was reorganised conceptually from wide to long form for crop-wise analysis.
- State coverage, crop coverage, yield distribution, average crop yield and feature correlations were visualised.
- A clear preprocessing plan was established for regression modelling in the next milestone.

# 9. Conclusion

Milestone 1 establishes a reliable exploratory foundation for AgriYield AI. The selected ICRISAT dataset is complete in terms of missing values and duplicate records, covers 40 years of district-level history, and contains rich crop area, production and yield information. The EDA also shows that careful handling of negative values, zeros, crop imbalance and outliers is essential before model training.

The next milestone can proceed with a clearly defined target, cleaning rules, long-format feature table, encoding/scaling workflow and time-aware regression evaluation.

\vfill

**Submitted by:** OVS Varun  
**Email:** orugantivarun.2007@gmail.com
