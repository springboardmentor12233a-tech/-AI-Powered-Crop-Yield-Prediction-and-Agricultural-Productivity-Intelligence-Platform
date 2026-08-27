import pandas as pd
import numpy as np
from src.data.common import get_logger

logger = get_logger("validation")

class ValidationError(Exception):
    """Custom exception raised when data validation fails."""
    pass

def validate_required_columns(df, required_cols, dataset_name):
    """Validates that all required columns are present in the DataFrame."""
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        msg = f"[{dataset_name}] Validation Failed: Missing required columns: {missing_cols}"
        logger.error(msg)
        raise ValidationError(msg)
    logger.info(f"[{dataset_name}] All required columns are present.")

def validate_not_empty(df, dataset_name):
    """Validates that the DataFrame is not empty."""
    if df.empty:
        msg = f"[{dataset_name}] Validation Failed: DataFrame is empty."
        logger.error(msg)
        raise ValidationError(msg)
    if len(df) == 0:
        msg = f"[{dataset_name}] Validation Failed: Zero rows found."
        logger.error(msg)
        raise ValidationError(msg)
    logger.info(f"[{dataset_name}] Dataset is not empty. Row count: {len(df)}")

def validate_dtypes(df, expected_dtypes, dataset_name):
    """
    Validates that columns match expected general data types.
    expected_dtypes: dict of col_name -> type_string ('numeric', 'object', 'float', 'int')
    """
    for col, expected_type in expected_dtypes.items():
        if col not in df.columns:
            continue
            
        col_dtype = df[col].dtype
        
        if expected_type == 'numeric':
            if not np.issubdtype(col_dtype, np.number):
                msg = f"[{dataset_name}] Column '{col}' expected numeric type, got '{col_dtype}'"
                logger.error(msg)
                raise ValidationError(msg)
        elif expected_type == 'object':
            if col_dtype != 'object' and not isinstance(col_dtype, pd.CategoricalDtype):
                msg = f"[{dataset_name}] Column '{col}' expected object/categorical type, got '{col_dtype}'"
                logger.error(msg)
                raise ValidationError(msg)
        elif expected_type == 'float':
            if not np.issubdtype(col_dtype, np.floating):
                msg = f"[{dataset_name}] Column '{col}' expected float type, got '{col_dtype}'"
                logger.error(msg)
                raise ValidationError(msg)
        elif expected_type == 'int':
            if not np.issubdtype(col_dtype, np.integer):
                msg = f"[{dataset_name}] Column '{col}' expected integer type, got '{col_dtype}'"
                logger.error(msg)
                raise ValidationError(msg)
                
    logger.info(f"[{dataset_name}] Column data types conform to expectations.")

def validate_missing_thresholds(df, thresholds, dataset_name):
    """
    Validates that missing values do not exceed allowed thresholds.
    thresholds: dict of col_name -> max_allowed_percentage (0.0 to 100.0)
    """
    missing_pct = (df.isnull().sum() / len(df)) * 100
    for col, max_pct in thresholds.items():
        if col not in df.columns:
            continue
        actual_pct = missing_pct[col]
        if actual_pct > max_pct:
            msg = f"[{dataset_name}] Column '{col}' missing values {actual_pct:.2f}% exceeds threshold {max_pct:.2f}%"
            logger.error(msg)
            raise ValidationError(msg)
    logger.info(f"[{dataset_name}] Missing value rates are within acceptable thresholds.")

def validate_duplicates_threshold(df, max_dup_pct, dataset_name):
    """Validates that the percentage of duplicate rows is below a maximum threshold."""
    dup_count = df.duplicated().sum()
    dup_pct = (dup_count / len(df)) * 100
    if dup_pct > max_dup_pct:
        msg = f"[{dataset_name}] Duplicate rows {dup_pct:.2f}% exceeds threshold {max_dup_pct:.2f}%"
        logger.error(msg)
        raise ValidationError(msg)
    logger.info(f"[{dataset_name}] Duplicate percentage is acceptable: {dup_pct:.2f}% (Count: {dup_count})")

def validate_numerical_ranges(df, dataset_name):
    """
    Validates that numerical values lie within expected boundaries,
    distinguishing between hard validity constraints and soft plausibility warnings.
    """
    # Hard constraints: violation raises ValidationError
    hard_constraints = {
        'pH': (0.0, 14.0),
        'Soil_pH': (0.0, 14.0),
        'Humidity': (0.0, 100.0),
        'Humidity_pct': (0.0, 100.0),
        'Temperature': (-50.0, 60.0),
        'Temperature_C': (-50.0, 60.0),
        'Rainfall': (0.0, None),
        'Rainfall_mm': (0.0, None),
        'Fertilizer_Used_kg': (0.0, None),
        'Pesticides_Used_kg': (0.0, None),
        'Planting_Density': (0.0, None),
        'Yield_ton_per_ha': (0.0, None)
    }

    # Soft plausibility checks: violation logs warning for agronomic review
    soft_plausibility = {
        'pH': (4.5, 8.5),
        'Soil_pH': (6.0, 7.0),
        'Humidity': (10.0, 95.0),
        'Humidity_pct': (35.0, 85.0),
        'Temperature': (10.0, 45.0),
        'Temperature_C': (18.0, 32.0),
        'Rainfall': (0.0, 3000.0),
        'Rainfall_mm': (300.0, 1300.0),
        'Fertilizer_Used_kg': (0.0, 250.0),
        'Planting_Density': (8.0, 22.0)
    }

    # Process Hard Constraints
    for col, bounds in hard_constraints.items():
        if col not in df.columns:
            continue
        if not np.issubdtype(df[col].dtype, np.number):
            continue
            
        actual_min = df[col].min()
        actual_max = df[col].max()
        min_val, max_val = bounds

        if min_val is not None and actual_min < min_val:
            msg = f"[{dataset_name}] Hard Constraint Violation: Column '{col}' minimum {actual_min:.4f} is below physical limit {min_val:.4f}"
            logger.error(msg)
            raise ValidationError(msg)
            
        if max_val is not None and actual_max > max_val:
            msg = f"[{dataset_name}] Hard Constraint Violation: Column '{col}' maximum {actual_max:.4f} is above physical limit {max_val:.4f}"
            logger.error(msg)
            raise ValidationError(msg)

    # Process Soft Plausibility Checks
    for col, bounds in soft_plausibility.items():
        if col not in df.columns:
            continue
        if not np.issubdtype(df[col].dtype, np.number):
            continue
            
        actual_min = df[col].min()
        actual_max = df[col].max()
        min_val, max_val = bounds

        if min_val is not None and actual_min < min_val:
            msg = f"[{dataset_name}] Soft Plausibility Warning: Column '{col}' minimum {actual_min:.4f} is unusual (normal min: {min_val:.4f})"
            logger.warning(msg)
            
        if max_val is not None and actual_max > max_val:
            msg = f"[{dataset_name}] Soft Plausibility Warning: Column '{col}' maximum {actual_max:.4f} is unusual (normal max: {max_val:.4f})"
            logger.warning(msg)

    logger.info(f"[{dataset_name}] Numerical column hard constraints and soft plausibility validated.")

def validate_target_values(df, target_col, expected_type, dataset_name, expected_unique_count=None):
    """Validates the target column content and check for invalid/null entries."""
    if target_col not in df.columns:
        msg = f"[{dataset_name}] Target column '{target_col}' not found."
        logger.error(msg)
        raise ValidationError(msg)
        
    null_count = df[target_col].isnull().sum()
    if null_count > 0:
        msg = f"[{dataset_name}] Target column '{target_col}' contains {null_count} missing values."
        logger.error(msg)
        raise ValidationError(msg)
        
    unique_count = df[target_col].nunique()
    logger.info(f"[{dataset_name}] Target '{target_col}' contains {unique_count} unique values.")
    
    if expected_unique_count is not None and unique_count != expected_unique_count:
        msg = f"[{dataset_name}] Target unique count {unique_count} does not match expected {expected_unique_count}."
        logger.error(msg)
        raise ValidationError(msg)
        
    if expected_type == 'numeric':
        # Check target contains reasonable positive numerical outputs
        if df[target_col].min() < 0:
            msg = f"[{dataset_name}] Target column '{target_col}' contains negative values."
            logger.error(msg)
            raise ValidationError(msg)
            
    logger.info(f"[{dataset_name}] Target column values validated successfully.")

def validate_no_destructive_transformation(df_before, df_after, dataset_name, allowed_row_reduction_pct=0.0):
    """
    Ensures that processing didn't accidentally discard massive amounts of data
    or columns unless explicitly expected.
    """
    rows_before = len(df_before)
    rows_after = len(df_after)
    cols_before = len(df_before.columns)
    cols_after = len(df_after.columns)
    
    row_reduction = ((rows_before - rows_after) / rows_before) * 100
    
    logger.info(f"[{dataset_name}] Row check: Raw={rows_before}, Processed={rows_after}. Reduction={row_reduction:.2f}%")
    logger.info(f"[{dataset_name}] Column check: Raw={cols_before}, Processed={cols_after}")
    
    if row_reduction > allowed_row_reduction_pct:
        msg = f"[{dataset_name}] Preprocessing was destructive: dropped {row_reduction:.2f}% of rows (allowed: {allowed_row_reduction_pct}%)"
        logger.error(msg)
        raise ValidationError(msg)
        
    if rows_after == 0:
        msg = f"[{dataset_name}] Preprocessing resulted in 0 output rows."
        logger.error(msg)
        raise ValidationError(msg)
        
    logger.info(f"[{dataset_name}] No destructive transformation occurred.")
