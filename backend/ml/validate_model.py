"""
YieldSense AI — Milestone 4: Model Validation Script
Validates the trained model against the test split and produces
a machine-readable final_validation.json report.

Usage (from backend/ directory):
    python ml/validate_model.py
"""
import os, sys, json, time
import numpy as np
import pandas as pd
import joblib
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.model_selection import cross_val_score

# ── Path setup ────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR  = os.path.join(BASE_DIR, "saved_models")
DATA_PATH  = os.path.join(BASE_DIR, "..", "data", "crop_yield.csv")

print("=" * 60)
print("  YieldSense AI — MODEL VALIDATION REPORT")
print("=" * 60)

# ── Load artefacts ────────────────────────────────────────────────────────────
model_path = os.path.join(MODEL_DIR, "best_model.pkl")
meta_path  = os.path.join(MODEL_DIR, "training_metadata.json")
comp_path  = os.path.join(MODEL_DIR, "model_comparison.json")

print(f"\n[1] Loading model artefacts from: {MODEL_DIR}")
pipeline = joblib.load(model_path)
with open(meta_path) as f:
    meta = json.load(f)
with open(comp_path) as f:
    comparison = json.load(f)

best_meta = next((m for m in comparison if m["model_name"] == meta["best_model_name"]), None)

print(f"    Best model     : {meta['best_model_name']}")
print(f"    Best params    : {meta['best_params']}")
print(f"    Training rows  : {meta['train_size']}")
print(f"    Test rows      : {meta['test_size']}")

# ── Load dataset for independent validation ───────────────────────────────────
print(f"\n[2] Loading dataset from: {DATA_PATH}")
df = pd.read_csv(DATA_PATH)
TARGET = meta["target_column"]
FEATURES = meta["feature_order"]

X = df[FEATURES]
y = df[TARGET]

# Use the same 80/20 split as training (random_state=42)
from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"    Total rows     : {len(df)}")
print(f"    Test rows used : {len(X_test)}")

# ── Inference timing ──────────────────────────────────────────────────────────
print("\n[3] Measuring inference time …")
t0 = time.perf_counter()
for _ in range(100):
    pipeline.predict(X_test.iloc[:1])
inference_ms = round((time.perf_counter() - t0) / 100 * 1000, 4)
print(f"    Single-row inference: {inference_ms} ms (avg over 100 calls)")

# ── Compute metrics on held-out test set ─────────────────────────────────────
print("\n[4] Computing metrics on test split …")
t0 = time.perf_counter()
y_pred = pipeline.predict(X_test)
batch_ms = round((time.perf_counter() - t0) * 1000, 4)

r2   = round(r2_score(y_test, y_pred), 4)
mae  = round(mean_absolute_error(y_test, y_pred), 4)
rmse = round(np.sqrt(mean_squared_error(y_test, y_pred)), 4)

print(f"    R²   : {r2}")
print(f"    MAE  : {mae} kg/acre")
print(f"    RMSE : {rmse} kg/acre")
print(f"    Batch inference ({len(X_test)} rows): {batch_ms} ms")

# ── Cross-validation on full dataset ─────────────────────────────────────────
print("\n[5] 5-fold cross-validation on full dataset …")
cv_scores = cross_val_score(pipeline, X, y, cv=5, scoring="r2")
cv_mean  = round(float(cv_scores.mean()), 4)
cv_std   = round(float(cv_scores.std()), 4)
print(f"    CV R² scores : {[round(s,4) for s in cv_scores]}")
print(f"    CV mean R²   : {cv_mean} ± {cv_std}")

# ── All models summary ───────────────────────────────────────────────────────
print("\n[6] All models (from GridSearchCV comparison):")
print(f"    {'Model':<25} {'R²':>8}  {'MAE':>10}  {'RMSE':>10}  {'CV R²':>8}")
print(f"    {'-'*65}")
for m in sorted(comparison, key=lambda x: x["r2_score"], reverse=True):
    marker = " <-- BEST" if m["model_name"] == meta["best_model_name"] else ""
    print(f"    {m['model_name']:<25} {m['r2_score']:>8.4f}  {m['mae']:>10.4f}  {m['rmse']:>10.4f}  {m['cv_best_score']:>8.4f}{marker}")

# ── Sample predictions ───────────────────────────────────────────────────────
print("\n[7] Sample predictions (first 5 test rows):")
sample = X_test.head(5).copy()
sample_pred = pipeline.predict(sample)
for i, (actual, pred) in enumerate(zip(y_test.head(5).values, sample_pred)):
    diff = pred - actual
    print(f"    [{i+1}] Actual: {actual:>8.2f}  Predicted: {pred:>8.2f}  Error: {diff:>+8.2f}")

# ── Write final_validation.json ──────────────────────────────────────────────
report = {
    "validation_date": pd.Timestamp.now().isoformat(),
    "best_model": meta["best_model_name"],
    "best_params": meta["best_params"],
    "dataset": {
        "total_rows": len(df),
        "train_rows": len(X_train),
        "test_rows": len(X_test),
        "target_column": TARGET,
        "features": FEATURES,
    },
    "test_set_metrics": {
        "r2_score": r2,
        "mae_kg_per_acre": mae,
        "rmse_kg_per_acre": rmse,
    },
    "cross_validation": {
        "folds": 5,
        "cv_r2_mean": cv_mean,
        "cv_r2_std": cv_std,
        "cv_r2_scores": [round(float(s), 4) for s in cv_scores],
    },
    "inference_time": {
        "single_row_ms": inference_ms,
        "batch_440_rows_ms": batch_ms,
    },
    "all_models": sorted(comparison, key=lambda x: x["r2_score"], reverse=True),
}

out_path = os.path.join(MODEL_DIR, "final_validation.json")
with open(out_path, "w") as f:
    json.dump(report, f, indent=2)
print(f"\n[8] Validation report saved to: {out_path}")

print("\n" + "=" * 60)
print("  VALIDATION COMPLETE")
print(f"  Best Model : {meta['best_model_name']}")
print(f"  R²         : {r2}")
print(f"  MAE        : {mae} kg/acre")
print(f"  RMSE       : {rmse} kg/acre")
print(f"  CV R²      : {cv_mean} ± {cv_std}")
print(f"  Inference  : {inference_ms} ms per row")
print("=" * 60)
