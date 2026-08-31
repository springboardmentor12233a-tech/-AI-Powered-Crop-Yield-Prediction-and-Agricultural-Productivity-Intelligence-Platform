import os
import pandas as pd
import numpy as np

class PreprocessingService:
    @staticmethod
    def load_dataset(file_path: str) -> pd.DataFrame:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        return pd.read_csv(file_path)

    @staticmethod
    def analyze_data(df: pd.DataFrame) -> dict:
        analysis = {
            "shape": df.shape,
            "missing_values": df.isnull().sum().to_dict(),
            "duplicates": int(df.duplicated().sum()),
            "columns": list(df.columns),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()}
        }
        return analysis

    @staticmethod
    def clean_data(df: pd.DataFrame) -> pd.DataFrame:
        cleaned_df = df.copy()
        
        # 1. Drop duplicate rows if any
        cleaned_df = cleaned_df.drop_duplicates()
        
        # 2. Fix anomalies/outliers
        # Anomaly 1: Rainfall has negative values (e.g. -8.699). Clamp to 0.0 minimum.
        if 'Rainfall' in cleaned_df.columns:
            cleaned_df['Rainfall'] = cleaned_df['Rainfall'].apply(lambda x: max(0.0, x))
            
        # Anomaly 2: Yield has negative values (e.g. -0.323). Clamp to 0.0 minimum.
        if 'Yield' in cleaned_df.columns:
            cleaned_df['Yield'] = cleaned_df['Yield'].apply(lambda x: max(0.0, x))
            
        # 3. Handle missing values
        # Drop rows with NaN if they represent corrupted data
        cleaned_df = cleaned_df.dropna()
        
        return cleaned_df

    @classmethod
    def run_pipeline(cls, raw_path: str, processed_path: str) -> dict:
        print(f"Loading raw dataset from {raw_path}...")
        df = cls.load_dataset(raw_path)
        
        print("Analyzing raw dataset...")
        raw_stats = cls.analyze_data(df)
        
        print("Cleaning dataset...")
        cleaned_df = cls.clean_data(df)
        
        print("Analyzing cleaned dataset...")
        clean_stats = cls.analyze_data(cleaned_df)
        
        # Ensure processed directory exists
        os.makedirs(os.path.dirname(processed_path), exist_ok=True)
        
        print(f"Saving cleaned dataset to {processed_path}...")
        cleaned_df.to_csv(processed_path, index=False)
        print("Pipeline complete.")
        
        return {
            "raw_stats": raw_stats,
            "cleaned_stats": clean_stats
        }

if __name__ == "__main__":
    # Path configuration for standalone execution
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Go up: services -> app -> backend -> YieldSense-AI
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
    
    raw_file = os.path.join(base_dir, "dataset", "raw", "kaggle_crop_yield", "crop_yield.csv")
    processed_file = os.path.join(base_dir, "dataset", "processed", "crop_yield_cleaned.csv")
    
    # Download raw dataset if not present
    if not os.path.exists(raw_file):
        os.makedirs(os.path.dirname(raw_file), exist_ok=True)
        url = "https://raw.githubusercontent.com/Explore-AI/Public-Data/master/Data/Python/Crop_yield.csv"
        print(f"Downloading sample raw dataset from {url}...")
        import urllib.request
        try:
            urllib.request.urlretrieve(url, raw_file)
            print("Download complete.")
        except Exception as e:
            print(f"Error downloading dataset: {e}")
            sys.exit(1)
        
    stats = PreprocessingService.run_pipeline(raw_file, processed_file)
    print("\n--- Preprocessing verification successful! ---")
    print(f"Raw shape: {stats['raw_stats']['shape']}")
    print(f"Cleaned shape: {stats['cleaned_stats']['shape']}")
