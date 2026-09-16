import os
import json
import joblib
import numpy as np
import pandas as pd
import platform
import sklearn
from datetime import datetime

from sklearn.model_selection import train_test_split, StratifiedKFold, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier


def _get_training_n_jobs() -> int:
    """Use a portable default and allow an explicit local parallelism override."""
    try:
        return max(1, int(os.getenv("YIELDSENSE_TRAINING_N_JOBS", "1")))
    except ValueError:
        return 1


def _save_model_atomically(model, destination: str) -> None:
    """Do not replace the production artifact until serialization has succeeded."""
    temporary_path = f"{destination}.tmp"
    try:
        joblib.dump(model, temporary_path)
        os.replace(temporary_path, destination)
    finally:
        if os.path.exists(temporary_path):
            os.remove(temporary_path)

def run_crop_recommendation_pipeline():
    """
    Executes the Crop Recommendation ML Pipeline:
    1. Loads Dataset A (crop_recommendation_cleaned.csv).
    2. Encodes multiclass crop labels using LabelEncoder.
    3. Splits data into 80% training and 20% untouched testing splits using Stratified K-Fold sampling.
    4. Evaluates conventional classification models (Logistic Regression, Decision Tree, Random Forest, Gradient Boosting).
    5. Tunes candidates via GridSearchCV on training data only to prevent data leakage.
    6. Measures accuracy, precision, recall, and weighted F1-score on the untouched test split.
    7. Selects the winning model based on test accuracy and F1 score, serializing artifact to models/crop_recommendation_model.joblib.
    """
    print("=" * 70)
    print("YIELDSENSE AI — ML PIPELINE 2: CROP RECOMMENDATION (GRIDSEARCHCV)")
    print("=" * 70)
    
    # -------------------------------------------------------------------------
    # 1. Paths & Environment Setup
    # -------------------------------------------------------------------------
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    data_path = os.path.join(base_dir, "data", "processed", "crop_recommendation_cleaned.csv")
    models_dir = os.path.join(base_dir, "models")
    artifacts_dir = os.path.join(base_dir, "artifacts")
    
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(artifacts_dir, exist_ok=True)
    training_n_jobs = _get_training_n_jobs()
    
    print(f"Loading Dataset A from: {data_path}")
    df = pd.read_csv(data_path)
    print(f"Dataset shape: {df.shape} ({df.shape[0]} rows, {df.shape[1]} columns)")
    
    # Environmental input features supported by Dataset A
    feature_cols = ["Temperature", "Humidity", "pH", "Rainfall"]
    target_col = "Label"
    
    X = df[feature_cols]
    y_raw = df[target_col]
    
    # Target Label Encoding
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y_raw)
    num_classes = len(label_encoder.classes_)
    print(f"Unique Crop Classes: {num_classes} (e.g., {list(label_encoder.classes_[:5])}...)")
    
    # -------------------------------------------------------------------------
    # 2. Stratified 80/20 Train/Test Data Partitioning
    # -------------------------------------------------------------------------
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"Training split: {X_train.shape[0]} samples | Testing split: {X_test.shape[0]} samples")

    # -------------------------------------------------------------------------
    # 3. Conventional Candidate Classifiers & Grid Search Definitions
    # -------------------------------------------------------------------------
    classifiers_and_grids = {
        "Logistic Regression": {
            "model": LogisticRegression(max_iter=1000, random_state=42),
            "param_grid": {
                "classifier__C": [0.1, 1.0, 10.0]
            }
        },
        "Decision Tree Classifier": {
            "model": DecisionTreeClassifier(random_state=42),
            "param_grid": {
                "classifier__max_depth": [10, 15, 20],
                "classifier__min_samples_split": [2, 5]
            }
        },
        "Random Forest Classifier": {
            "model": RandomForestClassifier(random_state=42, n_jobs=training_n_jobs),
            "param_grid": {
                "classifier__n_estimators": [50, 100],
                "classifier__max_depth": [10, 15],
                "classifier__min_samples_split": [2, 5]
            }
        },
        "Gradient Boosting Classifier": {
            "model": GradientBoostingClassifier(random_state=42),
            "param_grid": {
                "classifier__n_estimators": [50, 100],
                "classifier__learning_rate": [0.05, 0.1],
                "classifier__max_depth": [3, 5]
            }
        }
    }
    
    results = []
    trained_artifacts = {}
    cv_splitter = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    print("\nRunning GridSearchCV Across Conventional Classifier Candidates...")
    print("-" * 85)
    
    for name, config in classifiers_and_grids.items():
        pipeline = Pipeline(steps=[
            ("scaler", StandardScaler()),
            ("classifier", config["model"])
        ])
        
        grid_search = GridSearchCV(
            estimator=pipeline,
            param_grid=config["param_grid"],
            cv=cv_splitter,
            scoring="accuracy",
            n_jobs=training_n_jobs,
            error_score="raise"
        )
        
        # Fit Grid Search ONLY on training split
        grid_search.fit(X_train, y_train)
        
        best_cv_acc = grid_search.best_score_
        best_params = grid_search.best_params_
        best_estimator = grid_search.best_estimator_

        # Evaluate tuned pipeline on untouched test set
        y_pred = best_estimator.predict(X_test)
        
        test_acc = accuracy_score(y_test, y_pred)
        test_f1_weighted = f1_score(y_test, y_pred, average="weighted")
        test_f1_macro = f1_score(y_test, y_pred, average="macro")
        test_precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
        test_recall = recall_score(y_test, y_pred, average="weighted")
        
        trained_artifacts[name] = {
            "pipeline": best_estimator,
            "params": best_params
        }
        
        results.append({
            "model_name": name,
            "best_cv_acc": best_cv_acc,
            "best_params": json.dumps(best_params),
            "test_accuracy": test_acc,
            "test_f1_weighted": test_f1_weighted,
            "test_f1_macro": test_f1_macro,
            "test_precision": test_precision,
            "test_recall": test_recall
        })
        
        print(f"[{name:<28}] 5-Fold CV Acc: {best_cv_acc:.4f} | Test Acc: {test_acc:.4f} | Test F1 (Weighted): {test_f1_weighted:.4f} | Test Precision: {test_precision:.4f}")
        
    print("-" * 85)
    
    # -------------------------------------------------------------------------
    # 4. Production Model Selection
    # -------------------------------------------------------------------------
    results_df = pd.DataFrame(results).sort_values(by="test_accuracy", ascending=False)
    best_result = results_df.iloc[0]
    best_model_name = best_result["model_name"]
    best_pipeline = trained_artifacts[best_model_name]["pipeline"]
    best_params_dict = trained_artifacts[best_model_name]["params"]
    
    print(f"\n>>> Production Recommendation Classifier Selected: {best_model_name}")
    print(f"    Selected based on Test Accuracy: {best_result['test_accuracy']:.4f} and F1-Score: {best_result['test_f1_weighted']:.4f}")
    
    # Serialize model artifact containing pipeline and LabelEncoder
    model_artifact = {
        "pipeline": best_pipeline,
        "label_encoder": label_encoder,
        "classes": list(label_encoder.classes_),
        "feature_names": feature_cols
    }
    
    model_save_path = os.path.join(models_dir, "crop_recommendation_model.joblib")
    _save_model_atomically(model_artifact, model_save_path)
    print(f"Saved best recommendation model artifact to: {model_save_path}")
    
    # Save evaluation metadata
    metadata = {
        "model_name": "YieldSense Crop Recommendation Classifier",
        "algorithm": best_model_name,
        "version": "2.0.0",
        "created_at": datetime.now().isoformat(),
        "runtime": {
            "python": platform.python_version(),
            "scikit_learn": sklearn.__version__,
            "joblib": joblib.__version__
        },
        "dataset": "Crop Recommendation Dataset",
        "dataset_rows": len(df),
        "classes_count": num_classes,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "features": feature_cols,
        "target": target_col,
        "best_hyperparameters": best_params_dict,
        "metrics": {
            "cv_5fold_accuracy": float(round(best_result["best_cv_acc"], 4)),
            "test_accuracy": float(round(best_result["test_accuracy"], 4)),
            "test_f1_weighted": float(round(best_result["test_f1_weighted"], 4)),
            "test_f1_macro": float(round(best_result["test_f1_macro"], 4)),
            "test_precision_weighted": float(round(best_result["test_precision"], 4)),
            "test_recall_weighted": float(round(best_result["test_recall"], 4))
        }
    }
    
    metadata_save_path = os.path.join(models_dir, "crop_recommendation_metadata.json")
    with open(metadata_save_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved evaluation metadata to: {metadata_save_path}")
    
    # Generate crop_recommendation_model_comparison.md artifact
    comparison_md = os.path.join(artifacts_dir, "crop_recommendation_model_comparison.md")
    with open(comparison_md, "w", encoding="utf-8") as f:
        f.write("# Crop Recommendation — Conventional Model Evaluation & Grid Search Comparison\n\n")
        f.write("This report presents empirical evaluation metrics for conventional crop recommendation classifiers evaluated using 5-Fold Stratified Cross-Validation and Grid Search on Dataset A (`crop_recommendation_cleaned.csv`).\n\n")
        f.write("## 1. Grid Search Performance Comparison Table\n\n")
        f.write("| Model | 5-Fold CV Acc | Best Hyperparameters | Test Acc | Precision (Weighted) | Recall (Weighted) | F1-Score (Weighted) | Status |\n")
        f.write("|---|---:|---|---:|---:|---:|---:|---|\n")
        for _, row in results_df.iterrows():
            status = "**Selected Production Model**" if row["model_name"] == best_model_name else "Evaluated Candidate"
            f.write(f"| **{row['model_name']}** | {row['best_cv_acc']:.4f} | `{row['best_params']}` | {row['test_accuracy']:.4f} | {row['test_precision']:.4f} | {row['test_recall']:.4f} | {row['test_f1_weighted']:.4f} | {status} |\n")
        
        f.write("\n## 2. Key Insights\n\n")
        f.write(f"- **Classes Count**: Evaluated across {num_classes} unique crop varieties with 100 instances each.\n")
        f.write(f"- **Optimal Model**: **{best_model_name}** achieved the top test accuracy ({best_result['test_accuracy']:.4f}) and weighted F1-score ({best_result['test_f1_weighted']:.4f}).\n")
    print(f"Generated comparison report: {comparison_md}")
    print("\nCrop Recommendation Training Pipeline Completed Successfully!\n")

if __name__ == "__main__":
    run_crop_recommendation_pipeline()
