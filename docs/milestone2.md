# YieldSenseAI – Milestone 2 Documentation

## Crop Yield Prediction & Agricultural Productivity Forecasting System

**Project:** YieldSenseAI  
**Milestone:** 2  
**Focus:** Machine Learning, Predictive Analytics, Agricultural Forecasting, Weather Analysis, Soil Analysis, and External LLM Insights  
**Status:** Completed  
**Backend:** Python + FastAPI  
**ML:** Scikit-learn + XGBoost  
**External LLM:** Groq – `openai/gpt-oss-20b`

---

# 1. Milestone 2 Overview

Milestone 2 focuses on developing the backend intelligence of the YieldSenseAI system.

The main objectives were:

1. Train multiple machine learning models using GridSearchCV and identify the best-performing model.
2. Understand and implement predictive analytics and agricultural forecasting concepts.
3. Generate agricultural insights using an external LLM through Groq.
4. Develop backend workflows for crop yield prediction, weather analysis, soil analysis, and agricultural forecasting reports.

The milestone was implemented as a backend-focused stage. Frontend dashboards and recommendation-engine functionality are reserved for later project stages.

---

# 2. Milestone 2 Objectives

## Objective 1 – Machine Learning Model Training and Selection

Multiple regression models were trained and evaluated using:

- 5-fold Cross-Validation
- GridSearchCV
- Hyperparameter tuning
- MAE
- RMSE
- R²

The objective was to compare different regression algorithms and select the model with the best cross-validation performance.

### Models Evaluated

1. Linear Regression
2. Decision Tree Regressor
3. Random Forest Regressor
4. Gradient Boosting Regressor
5. XGBoost Regressor

---

# 3. Dataset and Preprocessing

The dataset contains agricultural, environmental, soil, geographical, temporal, and crop-related information.

The original dataset contained:

- 500 rows
- 39 columns including the target variable

The data was divided into:

- Training set: 400 rows
- Test set: 100 rows

The test set was kept untouched until final model evaluation.

## Target Variable

```text
yield_kg_per_hectare