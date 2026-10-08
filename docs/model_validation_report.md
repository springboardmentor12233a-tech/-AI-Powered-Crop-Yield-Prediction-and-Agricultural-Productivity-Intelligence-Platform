# Model Validation Report

## 1. Objective
The objective of this phase is to validate the currently deployed Random Forest yield prediction model and ensure its accuracy, performance, and functionality align with the metrics recorded during Milestone 2. 

## 2. Model Used
- **Algorithm**: Random Forest Regressor
- **Selection Criteria**: Model selected based on lowest cross-validation RMSE among the tested models.

## 3. Model File
- `models/random_forest_yield_model.joblib`
- Loaded successfully and compatible with the current environment.

## 4. Preprocessing Pipeline
- `models/preprocessor.joblib`
- Loaded successfully and executes properly without raising errors. 
- Transforms raw input dictionaries into 38 features correctly.

## 5. Dataset Used
- The existing validation dataset: `data/processed/test_processed.csv` (100 records, already preprocessed).
- Target column: `yield_kg_per_hectare`

## 6. Feature Count
- Expected features: 38
- Actual features extracted from the preprocessor pipeline: 38
- Status: **PASS**

## 7. Validation Method
- Predictions generated using the saved model (`predict` function) on the validation dataset.
- Evaluated key regression metrics (MAE, RMSE, R²) and compared against historical data.

## 8. MAE (Mean Absolute Error)
- 1069.26 kg/ha

## 9. RMSE (Root Mean Squared Error)
- 1205.67 kg/ha

## 10. R² (R-Squared)
- -0.0525

## 11. Prediction Statistics
- **Predictions made**: 100
- **Minimum Prediction**: 3518.12 kg/ha
- **Maximum Prediction**: 4420.62 kg/ha
- **Mean Prediction**: 4020.08 kg/ha

## 12. Sanity Check Results
- **NaN predictions**: False
- **Infinite predictions**: False
- **Unexpected negative yields**: False
- **Output type**: Numeric float
- Status: **PASS**

## 13. Edge Case Results
Tested via the main inference pipeline with variations on a baseline valid input sample:
- **Normal baseline**: 4110.29 kg/ha
- **Low Rainfall (10 mm)**: 4108.21 kg/ha
- **High Rainfall (500 mm)**: 3811.29 kg/ha
- **Low Moisture (5%)**: 4030.13 kg/ha
- **High Moisture (95%)**: 4069.13 kg/ha
- **Different Crop (Wheat)**: 4107.00 kg/ha
- **Different Region (Europe)**: 4132.24 kg/ha
- **Low pH (4.0)**: 3927.83 kg/ha
- **High Temp (45°C)**: 4011.27 kg/ha
- **Low NDVI (0.1)**: 3868.65 kg/ha
- Predictions respond slightly to extreme input changes but remain safely in an agricultural range without throwing exceptions or breaking logic.

## 14. Repeatability Results
- Ran identical predictions 6 consecutive times.
- Result: Outputs were entirely stable (all yielding ~4110.29 kg/ha). No state accumulation or reload issues were observed.
- Status: **PASS**

## 15. Prediction Latency
- **Batch prediction (100 samples)**: ~0.0477 seconds
- **Average single prediction latency**: ~0.0005 seconds
- Fast enough for synchronous real-time API responses.

## 16. API Pipeline Validation
- The endpoint `/ml/predict` (in `backend/app/api/ml.py`) actively imports and uses the exact same `predict_yield` and `load_pipeline` functions validated here.
- Validated that the backend uses a single consistent model source and correctly routes JSON requests through the Pydantic schema validation into the `predict_yield` inference process.

## 17. Comparison with Milestone 2 Results
| Metric | Milestone 2 | Current Validation | Match? |
|--------|-------------|--------------------|--------|
| **MAE** | 1069.26 | 1069.26 | Yes |
| **RMSE**| 1205.67 | 1205.67 | Yes |
| **R²**  | -0.0525 | -0.0525 | Yes |

Metrics match perfectly, proving that the model implementation has not degraded or silently shifted since training.

## 18. Overall Validation Result
**PASS WITH LIMITATIONS**
- The technical pipeline (loading, parsing, predicting, performance) behaves flawlessly.
- The limitation resides in the ML model's baseline predictive power (negative R² indicates the model performs slightly worse than a naive mean estimator on this specific test subset). The data validation confirms this is not an API bug, but inherent to the currently trained model weights. 

## 19. Known Limitations
- The model exhibits a negative R², meaning the relationships learned during training are weak or noisy. 
- Some edge cases (e.g., dropping rainfall from 120mm to 10mm) only caused a ~2 kg/ha change in predicted yield. This demonstrates that the tree structures in the Random Forest have somewhat flat leaves insensitive to extreme continuous variable boundaries, likely as an artifact of the training data distribution.
