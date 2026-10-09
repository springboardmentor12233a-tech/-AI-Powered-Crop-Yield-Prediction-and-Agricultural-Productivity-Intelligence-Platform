# YieldSense AI — Milestone 4 Model Validation

## 1. Milestone 4 Objective

This validation addresses the Milestone 4 requirement:

"Validate prediction models and forecasting accuracy."

The purpose is to verify the performance metrics, prediction capabilities, and accuracy of the machine learning models deployed within the YieldSense AI platform without modifying the existing production artifacts.

## 2. Validation Scope

The YieldSense AI ML implementation consists of two main components:
- **Crop Yield Prediction**: A regression model that forecasts crop yield (tons per hectare) based on environmental and agricultural inputs.
- **Crop Recommendation**: A classification model that identifies the most suitable crop based on local climate and soil characteristics.

## 3. Dataset and Target Variables

Based on the actual project metadata, the models were trained on the following datasets:

**Yield Prediction Model**
- **Dataset**: Smart Crop Yield Prediction Dataset
- **Size**: 10,000 records
- **Target Variable**: `Yield_ton_per_ha` (Continuous numerical)

**Crop Recommendation Model**
- **Dataset**: Crop Recommendation Dataset
- **Size**: 7,000 records
- **Target Variable**: `Label` (Categorical, 70 unique crop classes)

## 4. Yield Prediction Model

**Forecasting Accuracy Context**: Within the context of the YieldSense AI implementation, "forecasting accuracy" refers to supervised regression accuracy. The model predicts future agricultural yields using point-in-time environmental features rather than time-series methodologies.

| Metric | Recorded Value | Interpretation |
|--------|---------------|----------------|
| **Model Name** | YieldSense Crop Yield Regressor | Existing production model identifier. |
| **Model Type** | Linear Regression | The algorithm used for the final pipeline. |
| **Input Features** | `Soil_pH`, `Rainfall_mm`, `Temperature_C`, `Humidity_pct`, `Fertilizer_Used_kg`, `Pesticides_Used_kg`, `Planting_Density`, `Crop`, `Region`, `Soil_Type`, `Irrigation`, `Previous_Crop` | Mix of categorical and numerical features. |
| **Target Variable** | `Yield_ton_per_ha` | The predicted outcome. |
| **Validation Approach**| 5-Fold Cross Validation + Holdout (20%) | Methodology used during training. |
| **R² Score** | 0.9821 | Explains 98.21% of the variance in crop yield. |
| **MAE** | 4.0765 ton/ha | The average absolute error of predictions. |
| **RMSE** | 5.0806 ton/ha | The root mean squared error, penalizing larger deviations. |

## 5. Crop Recommendation Model

| Metric | Recorded Value | Interpretation |
|--------|---------------|----------------|
| **Model Name** | YieldSense Crop Recommendation Classifier | Existing production model identifier. |
| **Model Type** | Random Forest Classifier | The algorithm used for classification. |
| **Input Features** | `Temperature`, `Humidity`, `pH`, `Rainfall` | Continuous environmental variables. |
| **Target Classes** | 70 distinct crop varieties | The output classification space. |
| **Validation Approach**| 5-Fold Cross Validation + Holdout (20%) | Methodology used during training. |
| **Accuracy** | 0.9586 | Correctly identifies the optimal crop 95.86% of the time. |
| **Precision (Weighted)** | 0.9593 | Low false positive rate across all classes. |
| **Recall (Weighted)** | 0.9586 | Low false negative rate across all classes. |
| **F1-score (Weighted)** | 0.9573 | Harmonic mean of precision and recall. |

## 6. Model Validation Results

| Model | Primary Metric | Result | Status |
|-------|---------------|--------|--------|
| Crop Yield Prediction | Test R² | 0.9821 | ✅ Confirmed |
| Crop Recommendation | Test Accuracy | 0.9586 | ✅ Confirmed |

## 7. Prediction/Inference Verification

The existing automated test suite (`pytest tests/`) was executed to verify the inference pipeline.

- **Tests Executed**: 15
- **Passed**: 15
- **Failed**: 0
- **Model Inference Status**: Both yield prediction and crop recommendation successfully generated valid results through the API layer.
- **Input Validation**: Handled correctly.

## 8. Validation Findings

**Confirmed Findings:**
- The ML inference pipelines are fully functional and return valid predictions.
- Both models demonstrate exceptionally high validation metrics on their respective test sets.
- The system correctly handles data preprocessing and scaling during inference.

**Warnings:**
- **InconsistentVersionWarning**: The `scikit-learn` version used during the training of the Crop Recommendation Model (v1.5.0) differs from the runtime environment (v1.9.1). The `joblib` unpickling process generates warnings regarding `StandardScaler`, `DecisionTreeClassifier`, `RandomForestClassifier`, `Pipeline`, and `LabelEncoder`.

## 9. Milestone 4 Status

**Requirement**: "Validate prediction models and forecasting accuracy"

**Status**: PASS WITH LIMITATIONS

The models achieve strong performance metrics and successfully generate predictions. However, the presence of `scikit-learn` version mismatch warnings for the Crop Recommendation model introduces a limitation requiring attention for long-term maintainability.

## 10. Conclusion

The YieldSense AI prediction models have been successfully validated. The forecasting approach is implemented as robust supervised regression and classification, achieving excellent accuracy (R² = 0.9821, Accuracy = 95.86%). The API successfully serves predictions, though an environment mismatch warning exists for the crop recommendation artifact. The system meets the core validation requirements for Milestone 4.

## 11. Evidence / Screenshot Placeholders

[SCREENSHOT: Yield Model Validation Metrics]

[SCREENSHOT: Crop Recommendation Metrics]

[SCREENSHOT: Successful Yield Prediction]

[SCREENSHOT: Successful Crop Recommendation]

[SCREENSHOT: Test Execution Results]
