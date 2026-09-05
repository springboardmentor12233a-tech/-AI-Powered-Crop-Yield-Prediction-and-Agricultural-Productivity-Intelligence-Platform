import os
import sys
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler

class PreprocessingService:
    @staticmethod
    def load_dataset(file_path: str) -> pd.DataFrame:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        return pd.read_csv(file_path)

    @staticmethod
    def explore_dataset(df: pd.DataFrame) -> dict:
        """Step 2 & 3: Data Exploration and Cleaning checks"""
        return {
            "shape": df.shape,
            "head": df.head().to_dict(orient="records"),
            "columns": list(df.columns),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "missing_values": df.isnull().sum().to_dict(),
            "duplicates": int(df.duplicated().sum()),
            "description": df.describe().to_dict()
        }

    @staticmethod
    def preprocess_dataset(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series, pd.DataFrame]:
        """
        Step 4: Feature Engineering
        - Split features and target (Yield_kg_per_acre)
        - One-Hot Encoding for categorical columns (drop_first=True)
        - StandardScaler for numerical columns
        """
        # Separate features and target
        if "Yield_kg_per_acre" in df.columns:
            X = df.drop("Yield_kg_per_acre", axis=1)
            y = df["Yield_kg_per_acre"]
        else:
            X = df.copy()
            y = None

        # One-Hot Encoding
        X_encoded = pd.get_dummies(X, drop_first=True)

        # Standard Scaling for numerical features
        numerical_cols = [col for col in ['N', 'P', 'K', 'Rainfall_mm', 'Temperature_C', 'Soil_pH', 'Year'] if col in X_encoded.columns]
        if numerical_cols:
            scaler = StandardScaler()
            X_encoded[numerical_cols] = scaler.fit_transform(X_encoded[numerical_cols])

        return X, y, X_encoded

    @classmethod
    def run_pipeline(cls, raw_path: str, processed_path: str) -> dict:
        print(f"Loading dataset from {raw_path}...")
        df = cls.load_dataset(raw_path)
        
        print("Performing exploration & validation...")
        exploration = cls.explore_dataset(df)
        
        print("Applying feature engineering (One-Hot Encoding + Scaling)...")
        X, y, X_encoded = cls.preprocess_dataset(df)
        
        # Save preprocessed dataset
        os.makedirs(os.path.dirname(processed_path), exist_ok=True)
        
        preprocessed_df = X_encoded.copy()
        if y is not None:
            preprocessed_df["Yield_kg_per_acre"] = y
            
        print(f"Saving preprocessed dataset to {processed_path} (Shape: {preprocessed_df.shape})...")
        preprocessed_df.to_csv(processed_path, index=False)
        
        # Also save cleaned version without one-hot encoding
        cleaned_file = os.path.join(os.path.dirname(processed_path), "crop_yield_cleaned.csv")
        df.to_csv(cleaned_file, index=False)
        
        print("Pipeline execution complete.")
        return {
            "initial_shape": df.shape,
            "encoded_shape": X_encoded.shape,
            "total_features": X_encoded.shape[1],
            "missing_values": exploration["missing_values"],
            "duplicates": exploration["duplicates"]
        }

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
    
    raw_file = os.path.join(base_dir, "dataset.csv")
    if not os.path.exists(raw_file):
        raw_file = os.path.join(base_dir, "dataset", "dataset.csv")
        
    processed_file = os.path.join(base_dir, "dataset", "processed", "preprocessed_crop_yield.csv")
    
    stats = PreprocessingService.run_pipeline(raw_file, processed_file)
    print("\n--- Preprocessing Pipeline Results ---")
    print(f"Original shape: {stats['initial_shape']}")
    print(f"Features after One-Hot Encoding & Scaling: {stats['encoded_shape']}")
