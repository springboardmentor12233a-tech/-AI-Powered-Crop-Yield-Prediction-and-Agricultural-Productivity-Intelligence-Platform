# Model Performance Diagnostic Report

## 1. Problem Statement
The Random Forest yield prediction model currently deployed in production exhibits a negative R² score (-0.0525) on the test set. This diagnostic investigation aims to identify the root causes of this performance metric without modifying production code or models, and to recommend a path forward that aligns with project milestones.

## 2. Current Model
- **Algorithm**: Random Forest Regressor
- **File**: `models/random_forest_yield_model.joblib`

## 3. Current Metrics (Test Set)
- **MAE**: 1069.26 kg/ha
- **RMSE**: 1205.67 kg/ha
- **R²**: -0.0525

## 4. Dataset Characteristics
- **Total records**: 500
- **Training records**: 400
- **Test records**: 100
- **Number of features**: 38 (after preprocessing)
- **Target Variable**: `yield_kg_per_hectare`
- **Target Mean**: ~4032.93 kg/ha
- **Target Range**: 2023.56 to 5998.29 kg/ha

## 5. Train/Test Distribution Comparison
- **Training Target**: Mean 4037.78, Std 1174.19
- **Testing Target**: Mean 4013.53, Std 1181.11
- **Conclusion**: There is no significant distribution shift between the training and testing datasets. The target and features are similarly distributed across the split.

## 6. Baseline Performance
A simple baseline model that always predicts the mean of the training set (4037.78 kg/ha) for every test sample yields:
- **Baseline MAE**: 1051.41 kg/ha
- **Baseline RMSE**: 1175.44 kg/ha
- **Baseline R²**: -0.0004
**Conclusion**: The Random Forest model (RMSE 1205.67) actually performs slightly worse than the naive mean baseline (RMSE 1175.44).

## 7. Cross-Validation R² (Training Set Only)
- **Mean CV R²**: -0.0465 (Std: 0.0220)
- **Mean CV RMSE**: 1193.35 kg/ha
**Conclusion**: The model exhibits poor performance not only on the test set but also during cross-validation. This rules out an unlucky train/test split as the cause.

## 8. Feature-Target Relationships
Correlations between features and the target variable are exceptionally weak. 
- **Highest correlations**:
  - `crop_type_Soybean`: 0.113
  - `soil_moisture_%`: -0.110
  - `crop_type_Rice`: -0.073
- **Conclusion**: The dataset lacks strong predictive signals. All features have a linear correlation magnitude of less than 0.12 with the target.

## 9. Feature Importance
The top features relied upon by the Random Forest model:
1. `longitude` (Importance: 0.093, Correlation: -0.013)
2. `soil_moisture_%` (Importance: 0.087)
3. `pesticide_usage_ml` (Importance: 0.085)
4. `temperature_C` (Importance: 0.078)
- **Conclusion**: The model relies heavily on geographic coordinates (`longitude`) to partition the data, despite it having almost zero linear correlation with yield. This indicates the model is forced to find spurious, localized non-linear splits in the noise to attempt to minimize error.

## 10. Residual Analysis
- **Mean Residual**: -6.55 kg/ha (Model predictions are well-centered on average).
- **Residual Std Dev**: 1211.72 kg/ha.
- **Min/Max Residual**: -2037.79 / 2159.56 kg/ha.

## 11. Actual vs Predicted Distribution
- **Actual Test Yield Std Dev**: 1181.11 kg/ha
- **Predicted Yield Std Dev**: 169.05 kg/ha
- **Predicted Range**: 3518.12 to 4420.62 kg/ha (Actual range: 2080.21 to 5970.39 kg/ha).
**Conclusion**: The model is severely underfitting. Because there is no strong signal in the features, the Random Forest trees correctly learn that predicting extreme values leads to massive errors, so the ensemble collapses its predictions into a narrow band around the global mean (~4020 kg/ha).

## 12. Model Comparison
During Milestone 2, Random Forest (CV RMSE: 1193.35) was chosen because it outperformed Linear Regression (CV RMSE: 1255.02) and Decision Trees (CV RMSE: 1237.69). 
- **Was the decision defensible?** Yes, mechanically. Random Forest achieved the lowest CV RMSE among the evaluated algorithms. However, all evaluated models failed to extract meaningful signal from this dataset, as none substantially beat the baseline mean RMSE of 1175.44.

## 13. Root Causes Identified
1. **Extremely Weak Feature Signal**: The provided dataset lacks predictive relationships between inputs and crop yield (all correlations < 0.12). 
2. **High Target Variance**: The target variable has a massive standard deviation (~1174 kg/ha) relative to the lack of feature signal, acting essentially as random noise.
3. **Severe Underfitting**: To minimize catastrophic errors on noise, the Random Forest predictions regress strongly to the mean.

## 14. Root Causes NOT Supported by Evidence
- **Train/Test Distribution Shift**: Refuted (distributions match).
- **Target Leakage**: Refuted (no artificially perfect predictors exist).
- **Preprocessing Mismatch**: Refuted (features are processed perfectly and the same way for train/test).

## 15. Overall Conclusion
The negative R² (-0.0525) is not a bug in the code, the preprocessing pipeline, or the Random Forest hyperparameters. It is an inherent limitation of the specific dataset provided, which appears to lack sufficient signal to predict crop yields accurately. The model acts as a slightly noisy mean-estimator. 

## 16. Recommendation
**OPTION A: KEEP CURRENT MODEL**
- The dataset is the fundamental bottleneck; hyperparameter tuning or changing algorithms will not magically generate signal from noise.
- The Random Forest model was legitimately selected based on having the lowest comparative CV RMSE during Milestone 2. 
- Attempting to artificially improve the model would require faking the dataset, which violates the integrity of the project and contradicts already submitted Milestone 1 and 2 reports. We should proceed with the current robust engineering pipeline.
