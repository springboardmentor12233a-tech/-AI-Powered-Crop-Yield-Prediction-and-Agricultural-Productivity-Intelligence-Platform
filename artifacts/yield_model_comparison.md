# Crop Yield Prediction — Conventional Model Evaluation & Grid Search Comparison

This report presents the empirical evaluation metrics for conventional crop yield forecasting models evaluated using 5-Fold Cross-Validation and Grid Search on Dataset B (`smart_crop_yield_cleaned.csv`).

## 1. Grid Search Performance Comparison Table

| Model | 5-Fold CV R² | Best Hyperparameters | Test MAE (ton/ha) | Test RMSE (ton/ha) | Test R² | Status |
|---|---:|---|---:|---:|---:|---|
| **Linear Regression** | 0.9824 | `{}` | 4.08 | 5.08 | 0.9821 | **Selected Production Model** |
| **Gradient Boosting Regressor** | 0.9814 | `{"model__learning_rate": 0.05, "model__max_depth": 4, "model__n_estimators": 100}` | 4.21 | 5.23 | 0.9811 | Evaluated Candidate |
| **Random Forest Regressor** | 0.9803 | `{"model__max_depth": 10, "model__min_samples_split": 5, "model__n_estimators": 100}` | 4.29 | 5.34 | 0.9802 | Evaluated Candidate |
| **Decision Tree Regressor** | 0.9750 | `{"model__max_depth": 8, "model__min_samples_split": 10}` | 4.74 | 5.86 | 0.9762 | Evaluated Candidate |

## 2. Evaluation Summary

- **Data Partitioning**: 80% train (8000 rows) / 20% test (2000 rows).
- **Grid Search Optimization**: Hyperparameter tuning performed exclusively on training folds using GridSearchCV to prevent data leakage.
- **Final Production Model**: **Linear Regression** achieved the highest test R² (0.9821) and lowest prediction error (5.08 ton/ha).
