# Model Data Readiness Report - YieldSense AI

This report defines the feature matrices, validation strategies, encoding rules, and leakage mitigation recommendations for the machine learning models to be trained in **Milestone 2**.

---

## 1. Pipeline 1: Crop Recommendation (Classification)

### Features & Target
- **Target ($y_A$)**: `Label` (Categorical object target, 70 unique crop classes).
- **Features ($X_A$)**:
  - `Temperature` (numeric)
  - `Humidity` (numeric)
  - `pH` (numeric)
  - `Rainfall` (numeric)

### Train/Validation/Test Strategy
- **Train/Test Split**: **80% training / 20% testing** random split.
  - Training Set: 5,600 rows.
  - Testing Set: 1,400 rows.
- **Stratification**: Strict stratification on target `Label` **must** be applied (`stratify=y` in Scikit-Learn) to ensure that each of the 70 crop classes has exactly 80 rows in the training set and 20 rows in the testing set.
- **Validation**: 5-Fold Stratified Cross-Validation on the training split to optimize hyperparameters.

### Encoding & Scaling Requirements
- **Target Encoding**: Encode target `Label` using `sklearn.preprocessing.LabelEncoder` (converting 70 text labels to integers 0–69).
- **Feature Scaling**: 
  - Tree-based models (Random Forest, XGBoost) are scale-invariant. No scaling is required.
  - Gradient or distance-based algorithms (SVM, KNN, Neural Networks) require standard scaling (`StandardScaler` fitted on the training split only and applied to train/test).

---

## 2. Pipeline 2: Crop Yield Prediction (Regression)

### Features & Target
- **Target ($y_B$)**: `Yield_ton_per_ha` (Continuous numeric target).
- **Features ($X_B$)**:
  - *Categorical Features*: `Crop` (4 unique), `Region` (4 unique), `Soil_Type` (3 unique), `Irrigation` (4 unique - including `'Unknown'`), `Previous_Crop` (5 unique - including `'Unknown'`).
  - *Numerical Features*: `Soil_pH`, `Rainfall_mm`, `Temperature_C`, `Humidity_pct`, `Fertilizer_Used_kg`, `Pesticides_Used_kg`, `Planting_Density`.

### Train/Validation/Test Strategy
- **Train/Test Split**: **80% training / 20% testing** random split.
  - Training Set: 8,000 rows.
  - Testing Set: 2,000 rows.
- **Validation**: 5-Fold Cross-Validation on the training split.
- **Temporal Splitting**: No temporal indicators (years, seasons) or plot coordinates exist. Standard random K-Fold split is mathematically appropriate.

### Encoding & Scaling Requirements
- **Categorical Encoding**: One-Hot Encoding (OHE) is recommended for categorical features. Due to low cardinalities, this adds only a few columns:
  - `Crop` $\rightarrow$ 4 binary columns
  - `Region` $\rightarrow$ 4 binary columns
  - `Soil_Type` $\rightarrow$ 3 binary columns
  - `Irrigation` $\rightarrow$ 4 binary columns
  - `Previous_Crop` $\rightarrow$ 5 binary columns
- **Feature Scaling**: Optional for tree-based models, but mandatory for linear models.

---

## 3. Data Leakage Assessment & Mitigation

### Post-Harvest Management Variables
The columns `Fertilizer_Used_kg` and `Pesticides_Used_kg` represent seasonal cumulative inputs.
- **The Risk**: In real-world application, yield predictions are requested at planting time, before seasonal chemical application quantities are known. Training models with actual totals creates a **data leakage** bug.
- **Mitigation Recommendation**: 
  - For Milestone 2 training, evaluate model sensitivity by training **Model A (Pre-season)** without chemical columns, and **Model B (In-season)** including them (treated as planned target limits).

---

## 4. Model Training Status
- **DO NOT train final ML models yet.** No Random Forest, XGBoost, LightGBM, or neural networks have been trained in this step. Model training belongs strictly to **Milestone 2** in the project specification.
