# Crop Recommendation — Model Evaluation & Comparison Report

This report presents the actual measured evaluation metrics for multiclass crop recommendation models trained on Dataset A (`crop_recommendation_cleaned.csv`).

## 1. Model Performance Comparison Table

| Model | 5-Fold CV Accuracy | Test Accuracy | Precision (Weighted) | Recall (Weighted) | F1-Score (Weighted) | F1-Score (Macro) | Notes |
|---|---:|---:|---:|---:|---:|---:|---|
| **Random Forest Classifier** | 0.9623 | 0.9586 | 0.9593 | 0.9586 | 0.9573 | 0.9573 | Selected optimal classifier |
| **XGBoost Classifier** | 0.9548 | 0.9550 | 0.9565 | 0.9550 | 0.9547 | 0.9547 | Candidate classifier |
| **Gradient Boosting Classifier** | 0.9341 | 0.9400 | 0.9436 | 0.9400 | 0.9399 | 0.9399 | Candidate classifier |
| **Decision Tree Classifier** | 0.9384 | 0.9300 | 0.9316 | 0.9300 | 0.9265 | 0.9265 | Candidate classifier |
| **Logistic Regression** | 0.7177 | 0.7307 | 0.7224 | 0.7307 | 0.7187 | 0.7187 | Candidate classifier |

## 2. Evaluation Insights

- **Target Structure**: Evaluated across 70 unique crop varieties with 100 observations each (perfectly balanced 1.43% per class).
- **Feature Scope**: Features strictly limited to `Temperature`, `Humidity`, `pH`, and `Rainfall`. Soil nutrients (N, P, K) are not present in this dataset.
- **Tree Ensembles**: Random Forest and Gradient Boosting algorithms showed high discriminative power for nonlinear environmental envelopes.
- **Best Model**: **Random Forest Classifier** achieved the top test accuracy (0.9586) and weighted F1-score (0.9573).
