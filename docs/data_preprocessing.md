# YieldSense AI – Data Preprocessing

## 1. Objective

The objective of the data preprocessing stage is to clean, validate, transform, and prepare the agricultural dataset for exploratory data analysis and machine learning.

The preprocessing workflow ensures that the dataset is consistent, free from critical data-quality issues, and suitable for model development.

---

## 2. Input Dataset

Dataset:

`Smart_Farming_Crop_Yield_2024.csv`

Original dataset dimensions:

- Rows: 500
- Columns: 22

Target variable:

`yield_kg_per_hectare`

---

## 3. Data Quality Checks

The following checks were performed:

- Duplicate row detection
- Missing-value analysis
- Unique farm ID validation
- Unique sensor ID validation
- Farm ID and sensor ID consistency
- Date validation
- Crop-cycle validation
- Numerical feature inspection
- Categorical feature inspection

### Results

- Duplicate rows: 0
- Unique farm IDs: 500
- Unique sensor IDs: 500
- Farm/sensor mismatches: 0
- Observations outside crop cycle: 0

The basic data-quality checks passed successfully.

---

## 4. Missing Value Handling

Missing values were identified in:

- `irrigation_type`
- `crop_disease_status`

These categorical missing values were handled during preprocessing using an explicit `Unknown` category.

After preprocessing:

- Training missing values: 0
- Testing missing values: 0

---

## 5. Feature Engineering

Date-related information was transformed into useful numerical features.

The following features were generated:

- `sowing_month`
- `sowing_day`
- `harvest_month`
- `harvest_day`
- `observation_month`
- `observation_day`
- `days_since_sowing`
- `days_to_harvest`
- `crop_cycle_progress`

The crop-cycle features provide temporal information about the stage of crop development at the time of observation.

---

## 6. Feature Selection

The following identifier columns were excluded from the machine-learning feature set:

- `farm_id`
- `sensor_id`

The prediction target was:

`yield_kg_per_hectare`

The remaining agricultural, environmental, geographical, temporal, and categorical variables were used as input features.

---

## 7. Feature Categories

### Categorical Features

- `region`
- `crop_type`
- `irrigation_type`
- `fertilizer_type`
- `crop_disease_status`

### Numerical Features

- `soil_moisture_%`
- `soil_pH`
- `temperature_C`
- `rainfall_mm`
- `humidity_%`
- `sunlight_hours`
- `pesticide_usage_ml`
- `total_days`
- `latitude`
- `longitude`
- `NDVI_index`
- `sowing_month`
- `sowing_day`
- `observation_month`
- `observation_day`
- `days_since_sowing`
- `crop_cycle_progress`

---

## 8. Train-Test Split

The dataset was divided into:

- Training samples: 400
- Testing samples: 100

The target variable was separated from the input features before model development.

---

## 9. Preprocessing Pipeline

A preprocessing pipeline was implemented using Scikit-learn.

Categorical variables were transformed using one-hot encoding.

Numerical variables were retained as numerical features.

Unknown categorical values were handled explicitly.

The preprocessing pipeline produced:

- Training processed shape: `(400, 38)`
- Testing processed shape: `(100, 38)`

Therefore, the final processed feature space contains **38 features**.

---

## 10. Final Validation

Final preprocessing validation confirmed:

- Training missing values: 0
- Testing missing values: 0
- Training shape: 400 × 38
- Testing shape: 100 × 38
- Data-quality checks passed

The dataset is therefore ready for the next stages of the YieldSense AI workflow.

---

## 11. Next Stage

The next stage is Exploratory Data Analysis (EDA), followed by machine-learning model development.

The EDA will investigate:

- Crop-wise yield patterns
- Region-wise yield patterns
- Environmental factors
- Irrigation and fertilizer effects
- Disease status
- NDVI relationship with yield
- Feature correlations
- Important agricultural patterns