import os
import json
from pathlib import Path
from typing import Tuple, Dict, Any, List, Optional, Union

import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline


class MLDataPipeline:
    """
    Milestone 2 - ML Data Preparation Pipeline for YieldSense AI.
    
    Guarantees:
    - Clean separation of features (X) and target (y: Yield_kg_per_acre)
    - Leakage-free train/test splitting before any transformer fitting
    - Reproducible transforms with fixed random_state
    - Scikit-Learn ColumnTransformer / Pipeline integration
    - Categorical OneHotEncoding with unseen level handling ('ignore')
    - Numerical standardization via StandardScaler
    - Preprocessor persistence and metadata export for production inference
    """

    DEFAULT_CATEGORICAL_COLS = ['State', 'Crop', 'Soil_Type', 'Fertilizer']
    DEFAULT_NUMERICAL_COLS = ['N', 'P', 'K', 'Rainfall_mm', 'Temperature_C', 'Soil_pH', 'Year']
    DEFAULT_TARGET_COL = 'Yield_kg_per_acre'

    def __init__(
        self,
        data_path: Optional[str] = None,
        target_col: str = DEFAULT_TARGET_COL,
        categorical_cols: Optional[List[str]] = None,
        numerical_cols: Optional[List[str]] = None,
        test_size: float = 0.2,
        random_state: int = 42,
        artifacts_dir: Optional[str] = None,
        output_dir: Optional[str] = None,
    ):
        self.target_col = target_col
        self.categorical_cols = categorical_cols or list(self.DEFAULT_CATEGORICAL_COLS)
        self.numerical_cols = numerical_cols or list(self.DEFAULT_NUMERICAL_COLS)
        self.test_size = test_size
        self.random_state = random_state

        # Resolve paths relative to repository root if not explicitly provided
        base_dir = Path(__file__).resolve().parents[3]
        
        if data_path:
            self.data_path = Path(data_path)
        else:
            primary_path = base_dir / "dataset.csv"
            fallback_path = base_dir / "dataset" / "dataset.csv"
            self.data_path = primary_path if primary_path.exists() else fallback_path

        self.artifacts_dir = Path(artifacts_dir) if artifacts_dir else (base_dir / "backend" / "app" / "ml" / "artifacts")
        self.output_dir = Path(output_dir) if output_dir else (base_dir / "dataset" / "processed")

        self.preprocessor: Optional[ColumnTransformer] = None
        self.feature_names_out: List[str] = []
        self.metadata: Dict[str, Any] = {}

    def load_data(self) -> pd.DataFrame:
        """Loads and performs integrity checks on the raw dataset."""
        if not self.data_path.exists():
            raise FileNotFoundError(f"Dataset not found at {self.data_path}")

        df = pd.read_csv(self.data_path)
        
        # Verify required columns exist
        missing_cols = [col for col in self.categorical_cols + self.numerical_cols + [self.target_col] if col not in df.columns]
        if missing_cols:
            raise ValueError(f"Missing required columns in dataset: {missing_cols}")

        return df

    def split_data(
        self, df: pd.DataFrame
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
        """
        Splits features and target into train and test sets BEFORE any feature transformation
        to strictly avoid data leakage.
        """
        X = df[self.categorical_cols + self.numerical_cols].copy()
        y = df[self.target_col].copy()

        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=self.test_size,
            random_state=self.random_state,
            shuffle=True
        )

        return X_train, X_test, y_train, y_test

    def build_preprocessor(self) -> ColumnTransformer:
        """
        Constructs a Scikit-Learn ColumnTransformer:
        - Numerical: StandardScaler
        - Categorical: OneHotEncoder(handle_unknown='ignore', sparse_output=False)
        """
        num_pipeline = Pipeline(steps=[
            ('scaler', StandardScaler())
        ])

        cat_pipeline = Pipeline(steps=[
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])

        preprocessor = ColumnTransformer(
            transformers=[
                ('num', num_pipeline, self.numerical_cols),
                ('cat', cat_pipeline, self.categorical_cols)
            ],
            remainder='drop',
            verbose_feature_names_out=False
        )

        return preprocessor

    def fit_and_transform(
        self,
        X_train: pd.DataFrame,
        X_test: pd.DataFrame
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Fits preprocessor ONLY on X_train, then transforms X_train and X_test.
        """
        self.preprocessor = self.build_preprocessor()
        
        # Fit on training data ONLY
        X_train_transformed = self.preprocessor.fit_transform(X_train)
        
        # Transform test data using fitted parameters
        X_test_transformed = self.preprocessor.transform(X_test)

        # Retrieve resulting feature names
        try:
            self.feature_names_out = list(self.preprocessor.get_feature_names_out())
        except Exception:
            # Fallback for feature names if needed
            self.feature_names_out = [f"feat_{i}" for i in range(X_train_transformed.shape[1])]

        return X_train_transformed, X_test_transformed

    def save_artifacts(
        self,
        X_train_raw: pd.DataFrame,
        X_test_raw: pd.DataFrame,
        y_train: pd.Series,
        y_test: pd.Series,
        X_train_transformed: np.ndarray,
        X_test_transformed: np.ndarray
    ) -> Dict[str, str]:
        """
        Persists preprocessor object, split CSV files, and transformation metadata.
        """
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # 1. Save Scikit-Learn preprocessor object
        preprocessor_path = self.artifacts_dir / "preprocessor.joblib"
        joblib.dump(self.preprocessor, preprocessor_path)

        # 2. Save Transformed Dataframes with matching feature column headers
        train_transformed_df = pd.DataFrame(X_train_transformed, columns=self.feature_names_out, index=X_train_raw.index)
        train_transformed_df[self.target_col] = y_train

        test_transformed_df = pd.DataFrame(X_test_transformed, columns=self.feature_names_out, index=X_test_raw.index)
        test_transformed_df[self.target_col] = y_test

        train_transformed_path = self.output_dir / "X_train_transformed.csv"
        test_transformed_path = self.output_dir / "X_test_transformed.csv"
        train_transformed_df.to_csv(train_transformed_path, index=False)
        test_transformed_df.to_csv(test_transformed_path, index=False)

        # 3. Save Raw Split Dataframes
        train_raw_df = X_train_raw.copy()
        train_raw_df[self.target_col] = y_train
        test_raw_df = X_test_raw.copy()
        test_raw_df[self.target_col] = y_test

        train_raw_path = self.output_dir / "train_split_raw.csv"
        test_raw_path = self.output_dir / "test_split_raw.csv"
        train_raw_df.to_csv(train_raw_path, index=False)
        test_raw_df.to_csv(test_raw_path, index=False)

        # 4. Extract and Save Pipeline Metadata
        scaler_step = self.preprocessor.named_transformers_['num'].named_steps['scaler']
        ohe_step = self.preprocessor.named_transformers_['cat'].named_steps['onehot']

        categories_dict = {
            col: list(cat.tolist()) for col, cat in zip(self.categorical_cols, ohe_step.categories_)
        }

        self.metadata = {
            "dataset_info": {
                "source_path": str(self.data_path),
                "total_records": len(X_train_raw) + len(X_test_raw),
                "train_records": len(X_train_raw),
                "test_records": len(X_test_raw),
                "test_ratio": self.test_size,
                "random_state": self.random_state
            },
            "features": {
                "target": self.target_col,
                "categorical_columns": self.categorical_cols,
                "numerical_columns": self.numerical_cols,
                "total_transformed_features": len(self.feature_names_out),
                "transformed_feature_names": self.feature_names_out
            },
            "numerical_scaling_parameters": {
                col: {
                    "mean": float(m),
                    "scale": float(s),
                    "var": float(v)
                }
                for col, m, s, v in zip(self.numerical_cols, scaler_step.mean_, scaler_step.scale_, scaler_step.var_)
            },
            "categorical_categories": categories_dict
        }

        metadata_path = self.artifacts_dir / "preprocessor_metadata.json"
        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(self.metadata, f, indent=2)

        return {
            "preprocessor_path": str(preprocessor_path),
            "metadata_path": str(metadata_path),
            "train_transformed_path": str(train_transformed_path),
            "test_transformed_path": str(test_transformed_path),
            "train_raw_path": str(train_raw_path),
            "test_raw_path": str(test_raw_path)
        }

    def run_pipeline(self) -> Dict[str, Any]:
        """
        Executes end-to-end ML data preparation pipeline and returns diagnostic summary.
        """
        print(f"[*] Loading dataset from: {self.data_path}")
        df = self.load_data()
        print(f"    Loaded {df.shape[0]} rows and {df.shape[1]} columns.")

        print(f"[*] Splitting dataset (test_size={self.test_size}, random_state={self.random_state})...")
        X_train, X_test, y_train, y_test = self.split_data(df)
        print(f"    Training set: {X_train.shape[0]} samples")
        print(f"    Testing set:  {X_test.shape[0]} samples")

        print("[*] Building Scikit-Learn ColumnTransformer & fitting on X_train...")
        X_train_trans, X_test_trans = self.fit_and_transform(X_train, X_test)
        print(f"    Transformed feature dimensions: {X_train_trans.shape[1]} features")

        # Sanity Checks
        assert X_train_trans.shape[0] == X_train.shape[0], "Train sample count mismatch"
        assert X_test_trans.shape[0] == X_test.shape[0], "Test sample count mismatch"
        assert X_train_trans.shape[1] == X_test_trans.shape[1], "Feature dimension mismatch"
        assert not np.isnan(X_train_trans).any(), "NaNs detected in transformed training set"
        assert not np.isnan(X_test_trans).any(), "NaNs detected in transformed test set"

        print("[*] Saving preprocessor artifacts and data splits...")
        saved_paths = self.save_artifacts(
            X_train_raw=X_train,
            X_test_raw=X_test,
            y_train=y_train,
            y_test=y_test,
            X_train_transformed=X_train_trans,
            X_test_transformed=X_test_trans
        )
        print(f"    Artifacts saved to {self.artifacts_dir}")

        return {
            "status": "success",
            "train_shape": X_train_trans.shape,
            "test_shape": X_test_trans.shape,
            "transformed_features_count": len(self.feature_names_out),
            "artifacts": saved_paths
        }

    def transform_single_record(self, record: Union[Dict[str, Any], pd.DataFrame]) -> np.ndarray:
        """
        Transforms a single raw record (or DataFrame of records) for real-time model inference.
        """
        if self.preprocessor is None:
            preprocessor_path = self.artifacts_dir / "preprocessor.joblib"
            if not preprocessor_path.exists():
                raise FileNotFoundError(f"Fitted preprocessor not found at {preprocessor_path}")
            self.preprocessor = joblib.load(preprocessor_path)

        if isinstance(record, dict):
            df_input = pd.DataFrame([record])
        else:
            df_input = record.copy()

        # Ensure all required features are present
        for col in self.categorical_cols + self.numerical_cols:
            if col not in df_input.columns:
                raise KeyError(f"Required input feature '{col}' is missing.")

        return self.preprocessor.transform(df_input[self.categorical_cols + self.numerical_cols])


if __name__ == "__main__":
    pipeline = MLDataPipeline()
    summary = pipeline.run_pipeline()
    print("\n--- ML Data Preparation Pipeline Execution Complete ---")
    print(json.dumps({k: v for k, v in summary.items() if k != "artifacts"}, indent=2))
