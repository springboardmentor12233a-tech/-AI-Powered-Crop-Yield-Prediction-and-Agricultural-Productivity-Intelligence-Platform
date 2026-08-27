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

logger = get_logger("crop_recommendation_pipeline")

def run_pipeline():
    logger.info("Starting Crop Recommendation (Dataset A) preprocessing pipeline.")
    
    # 1. Load configuration
    config = load_config()['crop_recommendation']
    raw_path = get_absolute_path(config['raw_path'])
    processed_path = get_absolute_path(config['processed_path'])
    
    logger.info(f"Reading raw Excel from: {raw_path}")
    if not os.path.exists(raw_path):
        raise FileNotFoundError(f"Raw file not found: {raw_path}")
        
    df_raw = pd.read_excel(raw_path)
    df = df_raw.copy()
    
    # 2. Initial Validation (Pre-processing checks)
    validate_not_empty(df, "Crop Recommendation Raw")
    validate_required_columns(df, config['required_columns'], "Crop Recommendation Raw")
    
    # Data types check
    expected_dtypes = {
        'Temperature': 'numeric',
        'Humidity': 'numeric',
        'pH': 'numeric',
        'Rainfall': 'numeric',
        'Label': 'object'
    }
    validate_dtypes(df, expected_dtypes, "Crop Recommendation Raw")
    
    # 3. Preprocessing steps
    logger.info("Applying preprocessing operations.")
    
    # Clean string labels by removing leading/trailing spaces
    df['Label'] = df['Label'].astype(str).str.strip()
    
    # Check for empty strings in label after stripping
    empty_labels = (df['Label'] == "").sum()
    if empty_labels > 0:
        logger.warning(f"Found {empty_labels} empty labels after stripping whitespace.")
        
    # Check for duplicates in raw data (although audit showed 0, we add validation)
    validate_duplicates_threshold(df, max_dup_pct=1.0, dataset_name="Crop Recommendation Cleaned")
    
    # Validate numerical boundaries (Hard constraints and soft warnings)
    validate_numerical_ranges(df, "Crop Recommendation Cleaned")
    
    # Missing value checks (expecting 0% missing for all processed columns)
    missing_thresholds = {col: 0.0 for col in config['required_columns']}
    validate_missing_thresholds(df, missing_thresholds, "Crop Recommendation Cleaned")
    
    # Validate target values (retaining 70 classes, checking for non-emptiness)
    validate_target_values(
        df=df,
        target_col=config['target_column'],
        expected_type='object',
        dataset_name="Crop Recommendation Cleaned",
        expected_unique_count=70
    )
    
    # Ensure no destructive operations took place
    # Since we only strip whitespace, output rows should equal input rows (0.0% reduction)
    validate_no_destructive_transformation(
        df_before=df_raw,
        df_after=df,
        dataset_name="Crop Recommendation Preprocessing",
        allowed_row_reduction_pct=0.0
    )
    
    # 4. Save processed file
    processed_dir = os.path.dirname(processed_path)
    if not os.path.exists(processed_dir):
        logger.info(f"Creating directory: {processed_dir}")
        os.makedirs(processed_dir, exist_ok=True)
        
    logger.info(f"Saving processed CSV to: {processed_path}")
    df.to_csv(processed_path, index=False)
    logger.info("Pipeline completed successfully for Dataset A.")

if __name__ == "__main__":
    run_pipeline()
