import os
import pandas as pd
from src.data.common import get_logger, load_config, get_absolute_path
from src.data.validation import (
    validate_required_columns,
    validate_not_empty,
    validate_dtypes,
    validate_missing_thresholds,
    validate_duplicates_threshold,
    validate_numerical_ranges,
    validate_target_values,
    validate_no_destructive_transformation
)

logger = get_logger("smart_crop_yield_pipeline")

def run_pipeline():
    logger.info("Starting Smart Crop Yield (Dataset B) preprocessing pipeline.")
    
    # 1. Load configuration
    config = load_config()['smart_crop_yield']
    raw_path = get_absolute_path(config['raw_path'])
    processed_path = get_absolute_path(config['processed_path'])
    
    logger.info(f"Reading raw CSV from: {raw_path}")
    if not os.path.exists(raw_path):
        raise FileNotFoundError(f"Raw file not found: {raw_path}")
        
    df_raw = pd.read_csv(raw_path)
    df = df_raw.copy()
    
    # 2. Initial Validation (Pre-processing checks)
    validate_not_empty(df, "Smart Crop Yield Raw")
    validate_required_columns(df, config['required_columns'], "Smart Crop Yield Raw")
    
    # Data types check (initial before categorical filling)
    expected_dtypes = {col: 'numeric' for col in config['numerical_features']}
    for col in config['categorical_features']:
        expected_dtypes[col] = 'object'
    expected_dtypes[config['target_column']] = 'numeric'
    validate_dtypes(df, expected_dtypes, "Smart Crop Yield Raw")
    
    # Verify duplicates are within range
    validate_duplicates_threshold(df, max_dup_pct=1.0, dataset_name="Smart Crop Yield Raw")
    
    # 3. Preprocessing steps
    logger.info("Applying preprocessing operations.")
    
    # Fill missing values for Irrigation and Previous_Crop based on agricultural logic
    logger.info("Handling missing values in categorical columns.")
    
    # Irrigation: NaN means no artificial irrigation recorded -> Unknown
    df['Irrigation'] = df['Irrigation'].fillna("Unknown")
    
    # Previous_Crop: NaN means no previous crop recorded -> Unknown
    df['Previous_Crop'] = df['Previous_Crop'].fillna("Unknown")
    
    # Strip any whitespaces from all categorical variables
    for col in config['categorical_features']:
        df[col] = df[col].astype(str).str.strip()
        
    # Verify no missing values remain in the entire dataset
    missing_thresholds = {col: 0.0 for col in config['required_columns']}
    validate_missing_thresholds(df, missing_thresholds, "Smart Crop Yield Cleaned")
    
    # Validate numerical boundaries (Hard constraints and soft warnings)
    validate_numerical_ranges(df, "Smart Crop Yield Cleaned")
    
    # Validate target column (Yield in ton per hectare)
    validate_target_values(
        df=df,
        target_col=config['target_column'],
        expected_type='numeric',
        dataset_name="Smart Crop Yield Cleaned"
    )
    
    # Ensure no destructive operations took place
    # Output rows must be equal to input rows (0.0% reduction allowed)
    validate_no_destructive_transformation(
        df_before=df_raw,
        df_after=df,
        dataset_name="Smart Crop Yield Preprocessing",
        allowed_row_reduction_pct=0.0
    )
    
    # 4. Save processed file
    processed_dir = os.path.dirname(processed_path)
    if not os.path.exists(processed_dir):
        logger.info(f"Creating directory: {processed_dir}")
        os.makedirs(processed_dir, exist_ok=True)
        
    logger.info(f"Saving processed CSV to: {processed_path}")
    df.to_csv(processed_path, index=False)
    logger.info("Pipeline completed successfully for Dataset B.")

if __name__ == "__main__":
    run_pipeline()
