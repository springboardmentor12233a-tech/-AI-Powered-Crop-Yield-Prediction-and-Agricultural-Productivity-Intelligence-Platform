# Crop Yield Prediction — Model Evaluation & Comparison

This report presents the actual measured evaluation metrics for crop yield forecasting models trained on Dataset B (`smart_crop_yield_cleaned.csv`).

## 1. Model Performance Comparison Table

| Model | 5-Fold CV R² | Test MAE (ton/ha) | Test MSE | Test RMSE (ton/ha) | Test R² | Notes |
|---|---:|---:|---:|---:|---:|---|
| **Ridge Regression** | 0.9825 | 4.08 | 25.81 | 5.08 | 0.9821 | Selected optimal model |
| **Linear Regression** | 0.9824 | 4.08 | 25.82 | 5.08 | 0.9821 | Candidate model |
| **Gradient Boosting Regressor** | 0.9811 | 4.22 | 27.54 | 5.25 | 0.9809 | Candidate model |
| **XGBoost Regressor** | 0.9811 | 4.23 | 27.66 | 5.26 | 0.9808 | Candidate model |
| **Random Forest Regressor** | 0.9800 | 4.32 | 28.87 | 5.37 | 0.9800 | Candidate model |
| **Dummy (Mean Baseline)** | -0.0011 | 32.61 | 1446.20 | 38.03 | -0.0015 | Baseline dummy mean model |

## 2. Evaluation Observations

- **Data Splitting**: Evaluated using 80% training (8,000 rows) and 20% testing (2,000 rows) with 5-fold cross-validation on the training set.
- **Linear Models**: Linear Regression and Ridge achieved an R² of ~0.9821, reflecting the simulated linear relationship between input management factors and yield in Dataset B.
- **Tree Ensembles**: Random Forest and Gradient Boosting / XGBoost showed strong generalization with consistent CV and test scores.
- **Best Model**: **Ridge Regression** achieved the highest test R² (0.9821) and lowest test RMSE (5.08 ton/ha).
