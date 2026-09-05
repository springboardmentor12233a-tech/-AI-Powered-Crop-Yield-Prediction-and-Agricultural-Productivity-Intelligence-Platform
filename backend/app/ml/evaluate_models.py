import os
import sys
import json
from pathlib import Path
from typing import Dict, Any, List, Tuple

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import pandas as pd
import numpy as np
import joblib
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


class ModelEvaluationService:
    """
    Milestone 2 Step 3 - Comprehensive Model Evaluation & Diagnostic Service.
    
    Computes for every model:
    - MAE (Mean Absolute Error)
    - MSE (Mean Squared Error)
    - RMSE (Root Mean Squared Error)
    - R² Score
    - Residual Analysis (Mean, Std, Min, Max residual)
    - Feature Importance / Coefficients
    - Publication-quality visualization plots
    """

    def __init__(self):
        self.artifacts_dir = PROJECT_ROOT / "backend" / "app" / "ml" / "artifacts"
        self.output_dir = PROJECT_ROOT / "dataset" / "processed"
        self.images_dir = PROJECT_ROOT / "docs" / "images"
        self.images_dir.mkdir(parents=True, exist_ok=True)

        self.model_names = [
            "Linear Regression",
            "Decision Tree",
            "Random Forest",
            "Gradient Boosting"
        ]

    def load_data_and_models(self) -> Tuple[pd.DataFrame, pd.DataFrame, Dict[str, Any], List[str]]:
        """Loads transformed train/test splits, saved models, and metadata."""
        train_path = self.output_dir / "X_train_transformed.csv"
        test_path = self.output_dir / "X_test_transformed.csv"
        meta_path = self.artifacts_dir / "preprocessor_metadata.json"

        if not train_path.exists() or not test_path.exists():
            raise FileNotFoundError("Transformed datasets not found. Run MLDataPipeline first.")

        train_df = pd.read_csv(train_path)
        test_df = pd.read_csv(test_path)

        with open(meta_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)

        target_col = metadata["features"]["target"]
        feature_names = [col for col in train_df.columns if col != target_col]

        models = {}
        for name in self.model_names:
            safe_name = name.lower().replace(" ", "_")
            model_file = self.artifacts_dir / f"{safe_name}.joblib"
            if not model_file.exists():
                raise FileNotFoundError(f"Model file not found at {model_file}")
            models[name] = joblib.load(model_file)

        return train_df, test_df, models, feature_names

    def evaluate_all_models(self) -> Dict[str, Any]:
        train_df, test_df, models, feature_names = self.load_data_and_models()

        target_col = "Yield_kg_per_acre"
        X_train = train_df[feature_names].values
        y_train = train_df[target_col].values
        X_test = test_df[feature_names].values
        y_test = test_df[target_col].values

        metrics_table = {}
        predictions = {}
        residuals_data = {}
        feature_importances = {}

        for name, model in models.items():
            y_train_pred = model.predict(X_train)
            y_test_pred = model.predict(X_test)

            # Store predictions
            predictions[name] = {
                "y_train_pred": y_train_pred,
                "y_test_pred": y_test_pred
            }

            # 1. Metrics Calculation
            train_mae = float(mean_absolute_error(y_train, y_train_pred))
            test_mae = float(mean_absolute_error(y_test, y_test_pred))

            train_mse = float(mean_squared_error(y_train, y_train_pred))
            test_mse = float(mean_squared_error(y_test, y_test_pred))

            train_rmse = float(np.sqrt(train_mse))
            test_rmse = float(np.sqrt(test_mse))

            train_r2 = float(r2_score(y_train, y_train_pred))
            test_r2 = float(r2_score(y_test, y_test_pred))

            # 2. Residuals: e_i = y_actual - y_predicted
            res_test = y_test - y_test_pred
            residuals_data[name] = {
                "residuals": res_test,
                "mean_residual": float(np.mean(res_test)),
                "std_residual": float(np.std(res_test)),
                "min_residual": float(np.min(res_test)),
                "max_residual": float(np.max(res_test)),
                "median_absolute_error": float(np.median(np.abs(res_test)))
            }

            metrics_table[name] = {
                "Train_MAE": round(train_mae, 2),
                "Test_MAE": round(test_mae, 2),
                "Train_MSE": round(train_mse, 2),
                "Test_MSE": round(test_mse, 2),
                "Train_RMSE": round(train_rmse, 2),
                "Test_RMSE": round(test_rmse, 2),
                "Train_R2": round(train_r2, 4),
                "Test_R2": round(test_r2, 4),
                "Mean_Residual": round(residuals_data[name]["mean_residual"], 2),
                "Std_Residual": round(residuals_data[name]["std_residual"], 2),
                "MedAE": round(residuals_data[name]["median_absolute_error"], 2)
            }

            # 3. Feature Importance Extraction
            if hasattr(model, "feature_importances_"):
                imp = model.feature_importances_
                top10 = sorted(zip(feature_names, [float(x) for x in imp]), key=lambda x: x[1], reverse=True)[:10]
                feature_importances[name] = top10
            elif hasattr(model, "coef_"):
                coefs = model.coef_
                top10 = sorted(zip(feature_names, [float(abs(x)) for x in coefs]), key=lambda x: x[1], reverse=True)[:10]
                feature_importances[name] = top10

        # Generate Visualizations
        self._plot_actual_vs_predicted(y_test, predictions, metrics_table)
        self._plot_residual_analysis(y_test, predictions, residuals_data)
        self._plot_feature_importances(feature_importances)
        self._plot_metrics_comparison_bars(metrics_table)

        # Select Best Model based on Test R2 and Test RMSE
        best_model_name = max(metrics_table.keys(), key=lambda k: metrics_table[k]["Test_R2"])

        # Save comprehensive JSON report
        report = {
            "best_model": {
                "name": best_model_name,
                "reasoning": f"{best_model_name} achieved the highest Test R² ({metrics_table[best_model_name]['Test_R2']}) and lowest Test RMSE ({metrics_table[best_model_name]['Test_RMSE']}) on the 300 held-out test records."
            },
            "metrics": metrics_table,
            "residuals_summary": {
                k: {rk: rv for rk, rv in v.items() if rk != "residuals"}
                for k, v in residuals_data.items()
            },
            "feature_importances": feature_importances
        }

        report_json_path = self.artifacts_dir / "detailed_evaluation_report.json"
        with open(report_json_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

        # Save CSV comparison
        summary_df = pd.DataFrame.from_dict(metrics_table, orient="index")
        summary_df.index.name = "Model"
        summary_csv_path = self.output_dir / "model_evaluation_metrics.csv"
        summary_df.to_csv(summary_csv_path)

        return {
            "metrics": metrics_table,
            "best_model": best_model_name,
            "report_path": str(report_json_path),
            "summary_csv_path": str(summary_csv_path),
            "feature_importances": feature_importances,
            "residuals_summary": report["residuals_summary"]
        }

    def _plot_actual_vs_predicted(self, y_test: np.ndarray, predictions: Dict[str, Any], metrics: Dict[str, Any]):
        fig, axes = plt.subplots(2, 2, figsize=(14, 12))
        axes = axes.flatten()
        sns.set_theme(style="whitegrid")

        colors = ["#1f77b4", "#2ca02c", "#ff7f0e", "#d62728"]

        for idx, name in enumerate(self.model_names):
            ax = axes[idx]
            y_pred = predictions[name]["y_test_pred"]
            
            ax.scatter(y_test, y_pred, alpha=0.65, color=colors[idx], edgecolors='k', linewidth=0.5, s=45)
            
            # 45-degree reference line
            min_v = min(float(np.min(y_test)), float(np.min(y_pred)))
            max_v = max(float(np.max(y_test)), float(np.max(y_pred)))
            ax.plot([min_v, max_v], [min_v, max_v], 'r--', lw=2, label="Identity Line (y = ŷ)")

            ax.set_title(f"{name}\nTest R² = {metrics[name]['Test_R2']} | Test RMSE = {metrics[name]['Test_RMSE']}", fontsize=11, fontweight="bold")
            ax.set_xlabel("Actual Yield (kg/acre)", fontsize=10)
            ax.set_ylabel("Predicted Yield (kg/acre)", fontsize=10)
            ax.legend(loc="upper left", fontsize=9)

        plt.suptitle("Actual vs. Predicted Crop Yield Comparison (Test Partition: 300 samples)", fontsize=14, fontweight="bold", y=0.995)
        plt.tight_layout()
        plt.savefig(self.images_dir / "actual_vs_predicted_grid.png", dpi=300)
        plt.close()

    def _plot_residual_analysis(self, y_test: np.ndarray, predictions: Dict[str, Any], residuals_data: Dict[str, Any]):
        fig, axes = plt.subplots(2, 2, figsize=(14, 12))
        axes = axes.flatten()
        sns.set_theme(style="whitegrid")

        colors = ["#1f77b4", "#2ca02c", "#ff7f0e", "#d62728"]

        for idx, name in enumerate(self.model_names):
            ax = axes[idx]
            y_pred = predictions[name]["y_test_pred"]
            res = residuals_data[name]["residuals"]

            ax.scatter(y_pred, res, alpha=0.65, color=colors[idx], edgecolors='k', linewidth=0.5, s=45)
            ax.axhline(0, color="crimson", linestyle="--", lw=2, label="Zero Error Line")

            mean_res = residuals_data[name]["mean_residual"]
            std_res = residuals_data[name]["std_residual"]
            ax.set_title(f"{name} Residuals\nMean: {mean_res:.1f} | Std: {std_res:.1f}", fontsize=11, fontweight="bold")
            ax.set_xlabel("Predicted Yield ŷ (kg/acre)", fontsize=10)
            ax.set_ylabel("Residual (y - ŷ) (kg/acre)", fontsize=10)
            ax.legend(loc="upper left", fontsize=9)

        plt.suptitle("Residual Analysis (Error Distribution across Predictions)", fontsize=14, fontweight="bold", y=0.995)
        plt.tight_layout()
        plt.savefig(self.images_dir / "residual_analysis_grid.png", dpi=300)
        plt.close()

    def _plot_feature_importances(self, feature_importances: Dict[str, List[Tuple[str, float]]]):
        # Plot top features for Random Forest and Gradient Boosting
        fig, axes = plt.subplots(1, 2, figsize=(16, 6))
        sns.set_theme(style="whitegrid")

        tree_models = [("Random Forest", "viridis"), ("Gradient Boosting", "magma")]
        for idx, (name, palette) in enumerate(tree_models):
            if name in feature_importances:
                data = feature_importances[name]
                feats = [x[0] for x in data][::-1]
                scores = [x[1] for x in data][::-1]

                sns.barplot(x=scores, y=feats, ax=axes[idx], palette=palette)
                axes[idx].set_title(f"Top 10 Feature Importances - {name}", fontsize=12, fontweight="bold")
                axes[idx].set_xlabel("Relative Importance Score", fontsize=10)

        plt.tight_layout()
        plt.savefig(self.images_dir / "feature_importance_analysis.png", dpi=300)
        plt.close()

    def _plot_metrics_comparison_bars(self, metrics: Dict[str, Any]):
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        sns.set_theme(style="whitegrid")

        models = list(metrics.keys())
        r2_vals = [metrics[m]["Test_R2"] for m in models]
        rmse_vals = [metrics[m]["Test_RMSE"] for m in models]
        mae_vals = [metrics[m]["Test_MAE"] for m in models]
        medae_vals = [metrics[m]["MedAE"] for m in models]

        # 1. R2
        sns.barplot(x=models, y=r2_vals, ax=axes[0, 0], palette="Blues_r")
        axes[0, 0].set_title("Test R² (Higher is Better)", fontweight="bold")
        for p in axes[0, 0].patches:
            h = p.get_height()
            axes[0, 0].annotate(f"{h:.4f}", (p.get_x() + p.get_width() / 2., h),
                                ha="center", va="bottom" if h >= 0 else "top", xytext=(0, 2 if h >= 0 else -10), textcoords="offset points", fontsize=9)

        # 2. RMSE
        sns.barplot(x=models, y=rmse_vals, ax=axes[0, 1], palette="Oranges_r")
        axes[0, 1].set_title("Test RMSE (Lower is Better)", fontweight="bold")
        for p in axes[0, 1].patches:
            h = p.get_height()
            axes[0, 1].annotate(f"{h:,.0f}", (p.get_x() + p.get_width() / 2., h),
                                ha="center", va="bottom", xytext=(0, 2), textcoords="offset points", fontsize=9)

        # 3. MAE
        sns.barplot(x=models, y=mae_vals, ax=axes[1, 0], palette="Greens_r")
        axes[1, 0].set_title("Test MAE (Lower is Better)", fontweight="bold")
        for p in axes[1, 0].patches:
            h = p.get_height()
            axes[1, 0].annotate(f"{h:,.0f}", (p.get_x() + p.get_width() / 2., h),
                                ha="center", va="bottom", xytext=(0, 2), textcoords="offset points", fontsize=9)

        # 4. MedAE (Median Absolute Error)
        sns.barplot(x=models, y=medae_vals, ax=axes[1, 1], palette="Purples_r")
        axes[1, 1].set_title("Test Median Absolute Error (MedAE)", fontweight="bold")
        for p in axes[1, 1].patches:
            h = p.get_height()
            axes[1, 1].annotate(f"{h:,.0f}", (p.get_x() + p.get_width() / 2., h),
                                ha="center", va="bottom", xytext=(0, 2), textcoords="offset points", fontsize=9)

        plt.suptitle("Model Evaluation Summary: Error & Goodness-of-Fit Metrics", fontsize=14, fontweight="bold", y=0.995)
        plt.tight_layout()
        plt.savefig(self.images_dir / "model_metrics_comparison.png", dpi=300)
        plt.close()


if __name__ == "__main__":
    service = ModelEvaluationService()
    results = service.evaluate_all_models()
    print("\n--- MODEL EVALUATION METRICS TABLE ---")
    print(pd.DataFrame.from_dict(results["metrics"], orient="index").to_string())
    print(f"\n[+] Selected Best Model: {results['best_model']}")
