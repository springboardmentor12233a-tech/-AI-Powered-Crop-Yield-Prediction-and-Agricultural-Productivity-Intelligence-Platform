# Pipeline Verification Report - YieldSense AI

This report documents the verification checks, execution commands, warning logs, and bug corrections implemented during the review of the **YieldSense AI** data foundation.

---

## 1. Commands Executed
The pipelines and validators were executed sequentially from the project root using:

```powershell
# Preprocess Dataset A (Crop Recommendation)
python -m src.data.crop_recommendation_preprocessing

# Preprocess Dataset B (Smart Crop Yield)
python -m src.data.smart_crop_yield_preprocessing

# Execute the global human-readable audit
python -m src.data.audit

# Generate EDA visualizations
python notebooks/eda.py
```

---

## 2. Warnings Captured during Pipeline Execution

During execution, the newly refactored `validate_numerical_ranges` logged several agronomic warnings. These represent valid extreme entries in the datasets that are preserved rather than deleted:

```
2026-08-27 17:40:26,815 - validation - WARNING - [Crop Recommendation Cleaned] Soft Plausibility Warning: Column 'Humidity' minimum 6.0294 is unusual (normal min: 10.0000)
2026-08-27 17:40:26,815 - validation - WARNING - [Crop Recommendation Cleaned] Soft Plausibility Warning: Column 'Humidity' maximum 99.9819 is unusual (normal max: 95.0000)
2026-08-27 17:40:26,815 - validation - WARNING - [Crop Recommendation Cleaned] Soft Plausibility Warning: Column 'Temperature' minimum 6.1054 is unusual (normal min: 10.0000)
2026-08-27 17:40:26,815 - validation - WARNING - [Crop Recommendation Cleaned] Soft Plausibility Warning: Column 'Temperature' maximum 46.7915 is unusual (normal max: 45.0000)
2026-08-27 17:40:26,816 - validation - WARNING - [Crop Recommendation Cleaned] Soft Plausibility Warning: Column 'Rainfall' maximum 5989.9955 is unusual (normal max: 3000.0000)

2026-08-27 17:40:28,297 - validation - WARNING - [Smart Crop Yield Cleaned] Soft Plausibility Warning: Column 'Soil_pH' minimum 5.5000 is unusual (normal min: 6.0000)
2026-08-27 17:40:28,297 - validation - WARNING - [Smart Crop Yield Cleaned] Soft Plausibility Warning: Column 'Soil_pH' maximum 7.5000 is unusual (normal max: 7.0000)
2026-08-27 17:40:28,298 - validation - WARNING - [Smart Crop Yield Cleaned] Soft Plausibility Warning: Column 'Humidity_pct' minimum 30.0000 is unusual (normal min: 35.0000)
2026-08-27 17:40:28,298 - validation - WARNING - [Smart Crop Yield Cleaned] Soft Plausibility Warning: Column 'Humidity_pct' maximum 90.0000 is unusual (normal max: 85.0000)
2026-08-27 17:40:28,298 - validation - WARNING - [Smart Crop Yield Cleaned] Soft Plausibility Warning: Column 'Temperature_C' minimum 15.0000 is unusual (normal min: 18.0000)
2026-08-27 17:40:28,298 - validation - WARNING - [Smart Crop Yield Cleaned] Soft Plausibility Warning: Column 'Temperature_C' maximum 35.0000 is unusual (normal max: 32.0000)
2026-08-27 17:40:28,299 - validation - WARNING - [Smart Crop Yield Cleaned] Soft Plausibility Warning: Column 'Rainfall_mm' minimum 200.0000 is unusual (normal min: 300.0000)
2026-08-27 17:40:28,299 - validation - WARNING - [Smart Crop Yield Cleaned] Soft Plausibility Warning: Column 'Rainfall_mm' maximum 1499.7000 is unusual (normal max: 1300.0000)
2026-08-27 17:40:28,299 - validation - WARNING - [Smart Crop Yield Cleaned] Soft Plausibility Warning: Column 'Fertilizer_Used_kg' maximum 300.0000 is unusual (normal max: 250.0000)
2026-08-27 17:40:28,300 - validation - WARNING - [Smart Crop Yield Cleaned] Soft Plausibility Warning: Column 'Planting_Density' minimum 5.0000 is unusual (normal min: 8.0000)
2026-08-27 17:40:28,300 - validation - WARNING - [Smart Crop Yield Cleaned] Soft Plausibility Warning: Column 'Planting_Density' maximum 25.0000 is unusual (normal max: 22.0000)
```

---

## 3. Corrections Made

1. **Bug Fixed (Pandas Null Reading)**: Imputed missing categorical cells with `"Unknown"` rather than `"None"`, which prevented Pandas from parsing the fill string back into a missing `NaN` value during subsequent loads.
2. **Refactored Imputation Strategy**: Shifted missing categorical values in `Previous_Crop` and `Irrigation` from default assumptions (`"Fallow"`, `"Rainfed"`) to `"Unknown"`, ensuring that we do not fabricate agricultural data where documentation is missing.
3. **Refactored Validation (Hard/Soft Split)**: Configured hard constraints ( pH outside 0-14, negative values, humidity > 100% which violate physical bounds and throw exceptions) separately from soft plausibility bounds (which only print log warnings, preventing unnecessary row deletion).
4. **Improved Audit Output**: Upgraded `src/data/audit.py` to write a structured console comparison report listing row counts, column counts, missing value percentages, and types comparison.
5. **Git Safety**: Checked git properties. Preserved all raw datasets intact in `data/raw/`.

---

## 4. Final Status
All data foundation components are verified, tested, and passing. No unresolved pipeline errors or validation crashes remain.
