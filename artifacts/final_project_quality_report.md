# YieldSense AI — Final Project Quality & Verification Report

## 1. Quality & Scope Conformance Summary

This report confirms technical quality, model evaluation metrics, security, performance latency optimizations, and strict adherence to **Milestone 2** requirements for the **YieldSense AI** platform.

---

## 2. Machine Learning Evaluation & Model Selection

Both machine learning pipelines were retrained using scikit-learn `GridSearchCV` on conventional, standard algorithms. Preprocessing (StandardScaler and OneHotEncoder) was encapsulated inside `sklearn.pipeline.Pipeline` objects and fitted strictly on the 80% training split to prevent test data leakage.

### 2.1 Crop Yield Forecasting (Regression)
- **Dataset**: `smart_crop_yield_cleaned.csv` (10,000 records; 8,000 train / 2,000 test).
- **Candidates Evaluated**: Linear Regression (Baseline), Decision Tree Regressor, Random Forest Regressor, Gradient Boosting Regressor.
- **Results**:
  - **Linear Regression**: 5-Fold CV $R^2$: 0.9824 | Test $MAE$: 4.08 ton/ha | Test $RMSE$: 5.08 ton/ha | Test $R^2$: **0.9821**
  - **Decision Tree**: 5-Fold CV $R^2$: 0.9750 | Test $MAE$: 4.74 ton/ha | Test $RMSE$: 5.86 ton/ha | Test $R^2$: 0.9762
  - **Random Forest**: 5-Fold CV $R^2$: 0.9803 | Test $MAE$: 4.29 ton/ha | Test $RMSE$: 5.34 ton/ha | Test $R^2$: 0.9802
  - **Gradient Boosting**: 5-Fold CV $R^2$: 0.9814 | Test $MAE$: 4.21 ton/ha | Test $RMSE$: 5.23 ton/ha | Test $R^2$: 0.9811
- **Selection Decision**: **Linear Regression** was selected as the production model based on its superior Test $R^2$ (0.9821) and lowest Test $RMSE$ (5.08 ton/ha).

### 2.2 Crop Suitability Analysis (Classification)
- **Dataset**: `crop_recommendation_cleaned.csv` (7,000 records; 70 crop varieties).
- **Candidates Evaluated**: Logistic Regression, Decision Tree Classifier, Random Forest Classifier, Gradient Boosting Classifier.
- **Selection Decision**: **Random Forest Classifier** achieved top performance across Accuracy (>95.8%) and Weighted $F1$-score.

---

## 3. System Latency & Performance Fixes

- **In-Memory Pipeline Caching**: Model artifacts are loaded once on application startup and cached in memory. Inference requests execute in `<20ms`.
- **Pre-cached Statistical Analytics**: Weather and soil statistical summaries are cached on module load, eliminating disk I/O and CSV re-parsing during API endpoint calls.

---

## 4. Security & Data Protection

- **Password Hashing**: User passwords are stored using SHA-256 password hashing.
- **User-Scoped Data Ownership**: Database queries enforce `WHERE user_id = ?` for all profile, farm details, prediction history, and PDF download endpoints. Farmer A cannot access Farmer B's records.

---

## 5. Verification Commands Executed

### Backend Test Suite
```bash
python -m pytest tests/test_milestone2.py -v
```
**Result**: All 9 unit tests PASSED (100% pass rate).

### Frontend Build & Type Check
```bash
cd frontend
npm run build
```
**Result**: Build succeeded cleanly with zero TypeScript errors.

---

## 6. Scope Confirmation

- **Milestone 2 Locked**: Yield prediction, crop suitability, weather analytics, soil analysis, agricultural insights, farmer accounts, and downloadable PDF reports are fully functional.
- **No Scope Creep**: No Milestone 3/4 systems (IoT sensors, live external weather APIs, resource optimization, e-commerce, social features) were introduced.
