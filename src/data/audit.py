import os
import sys
import pandas as pd
from src.data.common import get_logger, load_config, get_absolute_path

logger = get_logger("audit_tool")

def audit_dataset_pair(config_key):
    config = load_config()[config_key]
    name = config['name']
    raw_path = get_absolute_path(config['raw_path'])
    processed_path = get_absolute_path(config['processed_path'])
    
    print("\n" + "="*60)
    print(f"AUDITING PIPELINE FOR: {name}")
    print("="*60)
    
    # Check existence
    if not os.path.exists(raw_path):
        logger.error(f"Raw file not found: {raw_path}")
        return False
    if not os.path.exists(processed_path):
        logger.error(f"Processed file not found: {processed_path}")
        return False
        
    # Read files
    if raw_path.endswith('.xlsx'):
        df_raw = pd.read_excel(raw_path)
    else:
        df_raw = pd.read_csv(raw_path)
    df_proc = pd.read_csv(processed_path)
    
    # Shapes
    raw_rows, raw_cols = df_raw.shape
    proc_rows, proc_cols = df_proc.shape
    print(f"Row count: Raw = {raw_rows} | Processed = {proc_rows} (Preservation: {raw_rows == proc_rows})")
    print(f"Column count: Raw = {raw_cols} | Processed = {proc_cols}")
    
    # Columns comparison
    raw_cols_list = sorted(list(df_raw.columns))
    proc_cols_list = sorted(list(df_proc.columns))
    print(f"Raw Columns: {list(df_raw.columns)}")
    print(f"Processed Columns: {list(df_proc.columns)}")
    
    extra_cols = [c for c in proc_cols_list if c not in raw_cols_list]
    missing_cols = [c for c in raw_cols_list if c not in proc_cols_list]
    if extra_cols:
        print(f"  WARNING: Found extra columns in processed: {extra_cols}")
    if missing_cols:
        print(f"  WARNING: Raw columns missing in processed: {missing_cols}")
        
    # Data Types Comparison
    print("\n--- Columns Data Types ---")
    for col in df_proc.columns:
        raw_type = df_raw[col].dtype if col in df_raw.columns else "N/A"
        proc_type = df_proc[col].dtype
        print(f"  Column '{col}': Raw Dtype = {raw_type} | Processed Dtype = {proc_type}")
        
    # Missing Values
    print("\n--- Missing Values Breakdown ---")
    raw_missing = df_raw.isnull().sum()
    proc_missing = df_proc.isnull().sum()
    for col in df_proc.columns:
        if col in df_raw.columns:
            raw_m = raw_missing[col]
            proc_m = proc_missing[col]
            if raw_m > 0 or proc_m > 0:
                print(f"  Column '{col}': Raw Missing = {raw_m} ({raw_m/raw_rows*100:.2f}%) | Processed Missing = {proc_m} ({proc_m/proc_rows*100:.2f}%)")
                
    # Duplicates Check
    raw_dups = df_raw.duplicated().sum()
    proc_dups = df_proc.duplicated().sum()
    print(f"\nDuplicates: Raw = {raw_dups} ({raw_dups/raw_rows*100:.2f}%) | Processed = {proc_dups} ({proc_dups/proc_rows*100:.2f}%)")
    
    # Target column presence and null check
    target_col = config['target_column']
    print(f"\nTarget Column verification ('{target_col}'):")
    if target_col not in df_proc.columns:
        logger.error(f"Target column '{target_col}' not found in processed data!")
        return False
    target_nulls = df_proc[target_col].isnull().sum()
    print(f"  Presence: OK | Nulls in Processed: {target_nulls}")
    
    # Required columns check
    print("\nRequired Columns presence:")
    all_req_present = True
    for col in config['required_columns']:
        present = col in df_proc.columns
        print(f"  Column '{col}': {'OK' if present else 'MISSING'}")
        if not present:
            all_req_present = False
            
    # Validations assertions
    errors = 0
    if raw_rows != proc_rows:
        logger.error(f"Row count mismatch! Raw={raw_rows}, Processed={proc_rows}")
        errors += 1
    if proc_missing.sum() > 0:
        logger.error(f"Processed dataset contains {proc_missing.sum()} missing values!")
        errors += 1
    if target_nulls > 0:
        logger.error(f"Processed target column '{target_col}' contains missing values!")
        errors += 1
    if not all_req_present:
        logger.error("Required columns check failed!")
        errors += 1
        
    if errors == 0:
        print(f"\n>>> AUDIT RESULT FOR '{name}': PASSED <<<\n")
        return True
    else:
        print(f"\n>>> AUDIT RESULT FOR '{name}': FAILED ({errors} errors) <<<\n")
        return False

def main():
    logger.info("Executing global dataset validation and audit check.")
    success_a = audit_dataset_pair("crop_recommendation")
    success_b = audit_dataset_pair("smart_crop_yield")
    
    if success_a and success_b:
        logger.info("All pipeline audits PASSED successfully.")
        sys.exit(0)
    else:
        logger.error("Pipeline audit FAILED. Please check logs.")
        sys.exit(1)

if __name__ == "__main__":
    main()
