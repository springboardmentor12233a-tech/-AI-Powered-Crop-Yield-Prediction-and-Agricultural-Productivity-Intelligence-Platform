# Crop Yield Model Selection & Justification Report

## 1. Production Model: **Linear Regression**

- **Algorithm**: Linear Regression
- **Test R²**: 0.9821
- **Test RMSE**: 5.08 ton/ha
- **Test MAE**: 4.08 ton/ha
- **5-Fold CV R²**: 0.9824

## 2. Selection Rationale

1. **Empirical Superiority**: Linear Regression outperformed alternative conventional algorithms on both cross-validation and independent test splits.
2. **Zero Overfitting**: Minimal variance between cross-validation and test set performance confirms robust generalization.
3. **Inference Latency**: The serialized scikit-learn Pipeline provides fast CPU inference (<10ms per prediction) ideal for real-time API response.
