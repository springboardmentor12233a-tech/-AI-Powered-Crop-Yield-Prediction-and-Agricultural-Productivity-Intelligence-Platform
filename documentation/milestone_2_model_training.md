# Milestone 2 – Model Training and Predictive Analytics

## 1. Objective

The objective of Milestone 2 is to train different machine learning models,
compare their performance using evaluation metrics, and select the best model.

## 2. Models Trained

The following regression models were trained:

- Linear Regression
- Random Forest Regressor
- Gradient Boosting Regressor
- Extra Trees Regressor

GridSearchCV with 5-fold cross-validation was used for hyperparameter tuning
of the tree-based models.

## 3. Model Evaluation

| Model | MAE | RMSE | R2 Score |
|---|---:|---:|---:|
| Random Forest | 1060.34 | 1210.03 | -0.0602 |
| Extra Trees | 1062.84 | 1213.25 | -0.0658 |
| Gradient Boosting | 1085.45 | 1232.69 | -0.1003 |
| Linear Regression | 1094.99 | 1226.30 | -0.0889 |

## 4. Best Model

Random Forest achieved the lowest MAE among the tested models.

Best MAE: 1060.34 kg/hectare

Best RMSE: 1210.03 kg/hectare

R2 Score: -0.0602

The trained Random Forest model was saved as:

`models/best_crop_yield_model.joblib`

## 5. Train-Test Split

- Training samples: 400
- Testing samples: 100
- Processed training features: 36
- Processed testing features: 36

## 6. Predictive Analytics

The model can be used to estimate crop yield from agricultural,
environmental, soil, irrigation, fertilizer and other available features.

## 7. Result Interpretation

Random Forest produced the lowest MAE among the tested models.
However, the negative R2 score indicates that the current feature set
and model configuration do not explain the test-set yield variation well.

This result will be considered for further feature engineering,
data improvement and model optimization in later milestones.

## 8. Conclusion

Milestone 2 model training was completed successfully. Multiple ML models
were trained and compared using GridSearchCV and evaluation metrics.
The best-performing model based on MAE was Random Forest.

## 9. External LLM-Based Agricultural Insights

Groq API was integrated into the Smart Farming project
to generate AI-based agricultural insights.

The external LLM analyzes agricultural input data and
generates:
- Key observations
- Possible agricultural risks
- Practical farming recommendations
- Factors affecting crop yield

The integration was tested successfully using the
Groq API and the AI-generated response was displayed
in the Jupyter Notebook.

This feature demonstrates the use of an external LLM
for agricultural decision support.