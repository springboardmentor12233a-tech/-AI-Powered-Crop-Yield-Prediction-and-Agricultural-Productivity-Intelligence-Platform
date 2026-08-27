# Data Leakage Assessment - YieldSense AI

This document assesses the potential for data leakage in the **Smart Crop Yield Prediction (Dataset B)** features, classifying them by prediction-time availability and outlining mitigation strategies for model training.

---

## 1. Feature Classification Matrix

| Feature Name | Category | Classification | Description / Risk | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Yield_ton_per_ha** | Target | **Target** | The continuous target variable to be predicted. | Exclude from features $X$; assign as target $y$. |
| **Crop** | Crop type | **Suitable prediction input** | Known at planting time (the crop species selected). | Safe to include. |
| **Region** | Geographic | **Suitable prediction input** | Known at planting time (the geographic location of the plot). | Safe to include. |
| **Soil_Type** | Soil | **Suitable prediction input** | Known at planting time (soil physical texture). | Safe to include. |
| **Soil_pH** | Soil | **Suitable prediction input** | Known at planting time (pre-planting soil test). | Safe to include. |
| **Previous_Crop** | Agronomic history | **Suitable prediction input** | Known at planting time (determined by the prior cycle). | Safe to include. |
| **Rainfall_mm** | Weather / Env | **Suitable prediction input** | Seasonal precipitation. In real-world use, this represents a forecast, but in historical data it is safe for training. | Safe to include, but document that predictions rely on weather forecasts. |
| **Temperature_C** | Weather / Env | **Suitable prediction input** | Mean seasonal temperature. | Safe to include. |
| **Humidity_pct** | Weather / Env | **Suitable prediction input** | Average relative humidity. | Safe to include. |
| **Planting_Density** | Management | **Suitable prediction input** | Sowing density (sowing plan). Known at planting. | Safe to include. |
| **Irrigation** | Management | **Requires domain clarification** | The watering method. If it represents planned infrastructure (e.g. drip lines exist), it is safe. If it represents actual runtime water delivery, it is problematic. | Safe if treated as planned system design. |
| **Fertilizer_Used_kg** | Management | **Potentially problematic** | Seasonal fertilizer quantity. If it represents actual total usage, it is unknown at planting. | Classify as leakage. Run training tests with and without this feature. |
| **Pesticides_Used_kg** | Management | **Potentially problematic** | Seasonal pesticide quantity. If it represents post-planting pest response, it is unknown. | Classify as leakage. Run training tests with and without this feature. |

---

## 2. Risk Analysis

### Post-Harvest Management Leakage
In a real-world yield forecasting tool, a farmer wants to query the model *at planting time* (or early season) to estimate their harvest output.
- **The Issue**: Columns `Fertilizer_Used_kg` and `Pesticides_Used_kg` represent seasonal totals. If the model relies heavily on these features, it cannot make accurate pre-season predictions because the farmer does not know the actual quantities that will be applied over the next 4–6 months.
- **Leakage Risk**: Standard models trained with actual chemical quantities will appear highly accurate during testing, but will fail or experience degraded performance in production when fed with placeholder or missing pre-season inputs.

---

## 3. Mitigation Recommendations

1. **Dual-Model Approach**:
   - **Model 1: Pre-season Forecaster**: Train a model excluding `Fertilizer_Used_kg` and `Pesticides_Used_kg`. This maps yield strictly to environmental conditions, crop type, and crop rotation history.
   - **Model 2: In-season Simulator**: Train a model containing these features, presenting them as *planned target limits* (e.g., "What will my yield be if I apply 150kg of fertilizer?").
2. **Feature Aggregation**:
   - If historical farm averages for fertilizer/pesticides are available, impute those values at prediction time rather than utilizing actual seasonal totals.
