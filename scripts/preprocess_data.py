import os
import pandas as pd
import numpy as np

def run_preprocessing():
    print("=" * 60)
    print("YieldSense AI - Automated Data Preprocessing & Cleaning Pipeline")
    print("=" * 60)

    raw_csv_path = os.path.join("datasets", "raw", "Smart_Farming_Crop_Yield_2024.csv")
    raw_excel_path = os.path.join("datasets", "raw", "YieldSense_AI_Dataset_Collection.xlsx")
    output_cleaned_csv = os.path.join("datasets", "processed", "cleaned_crop_yield.csv")
    report_md_path = os.path.join("docs", "dataset_quality_report.md")

    if not os.path.exists(raw_csv_path):
        # Fallback to root if not found
        raw_csv_path = "Smart_Farming_Crop_Yield_2024.csv"

    print(f"[1/5] Loading raw CSV dataset from: {raw_csv_path}")
    df = pd.read_csv(raw_csv_path)
    initial_rows = len(df)
    initial_cols = len(df.columns)
    print(f"      Loaded {initial_rows} rows and {initial_cols} columns.")

    # Check Excel dataset if available
    excel_info = "Excel dataset not processed."
    if os.path.exists(raw_excel_path):
        try:
            xl = pd.ExcelFile(raw_excel_path)
            excel_info = f"Excel sheets found: {xl.sheet_names}"
            print(f"      {excel_info}")
        except Exception as e:
            excel_info = f"Excel read error: {e}"

    print("[2/5] Cleaning column names and missing values...")
    df.columns = df.columns.str.strip()

    # Document missing values before cleaning
    missing_before = df.isnull().sum().to_dict()

    # Fill categorical missing values
    if "irrigation_type" in df.columns:
        df["irrigation_type"] = df["irrigation_type"].fillna("Unknown").astype(str).str.strip()
    if "crop_disease_status" in df.columns:
        df["crop_disease_status"] = df["crop_disease_status"].fillna("Unknown").astype(str).str.strip()

    # Numeric missing value handling (median imputation if any)
    num_cols = df.select_dtypes(include=[np.number]).columns
    for col in num_cols:
        if df[col].isnull().sum() > 0:
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val)

    print("[3/5] Standardizing Date Formats & Calculating Growing Duration...")
    if "sowing_date" in df.columns and "harvest_date" in df.columns:
        df["sowing_date"] = pd.to_datetime(df["sowing_date"], errors="coerce")
        df["harvest_date"] = pd.to_datetime(df["harvest_date"], errors="coerce")
        
        # Recalculate duration accurately
        calculated_duration = (df["harvest_date"] - df["sowing_date"]).dt.days
        df["total_days"] = calculated_duration.fillna(df.get("total_days", 120)).astype(int)
        
        # Format back to ISO string for CSV
        df["sowing_date"] = df["sowing_date"].dt.strftime("%Y-%m-%d")
        df["harvest_date"] = df["harvest_date"].dt.strftime("%Y-%m-%d")

    print("[4/5] Validating Range & Removing Duplicates...")
    duplicates_count = df.duplicated().sum()
    if duplicates_count > 0:
        df = df.drop_duplicates()
        print(f"      Removed {duplicates_count} duplicate rows.")

    # Bound NDVI between 0 and 1
    if "NDVI_index" in df.columns:
        df["NDVI_index"] = df["NDVI_index"].clip(0.0, 1.0)

    # Ensure non-negative yield
    if "yield_kg_per_hectare" in df.columns:
        df["yield_kg_per_hectare"] = df["yield_kg_per_hectare"].abs()

    print(f"[5/5] Saving cleaned dataset to: {output_cleaned_csv}")
    os.makedirs(os.path.dirname(output_cleaned_csv), exist_ok=True)
    df.to_csv(output_cleaned_csv, index=False)

    final_rows = len(df)
    missing_after = df.isnull().sum().sum()

    # Generate Data Quality Report
    report_content = f"""# YieldSense AI - Dataset Quality & Preprocessing Report

## Executive Summary
The automated data cleaning pipeline processed **{initial_rows} raw crop records** and produced a sanitized dataset ready for Exploratory Data Analysis (EDA) and Machine Learning model training.

---

## Dataset Overview
- **Raw Input File**: `{raw_csv_path}`
- **Cleaned Output File**: `{output_cleaned_csv}`
- **Total Initial Rows**: {initial_rows}
- **Total Cleaned Rows**: {final_rows}
- **Duplicates Removed**: {duplicates_count}
- **Total Columns**: {len(df.columns)}
- **Secondary Dataset**: {excel_info}

---

## Data Cleaning & Transformation Log

### 1. Missing Values Treatment
- `irrigation_type`: Imputed missing entries with `'Unknown'`.
- `crop_disease_status`: Imputed missing entries with `'Unknown'`.
- Remaining Numerical Features: Imputed via median value strategy.
- **Total Remaining Nulls**: **{missing_after}**

### 2. Feature Engineering & Date Normalization
- `sowing_date` & `harvest_date`: Converted to standard ISO (`YYYY-MM-DD`).
- `total_days`: Recalculated growing cycle duration as `(harvest_date - sowing_date)`.
- `NDVI_index`: Clipped to valid vegetation range `[0.0, 1.0]`.

---

## Cleaned Schema & Column Data Types

| Column Name | Data Type | Null Count | Sample Value |
| :--- | :--- | :--- | :--- |
"""
    for col in df.columns:
        sample_val = str(df[col].iloc[0]) if len(df) > 0 else "N/A"
        report_content += f"| `{col}` | `{df[col].dtype}` | {df[col].isnull().sum()} | `{sample_val}` |\n"

    report_content += """
---
*Report generated automatically by `scripts/preprocess_data.py`.*
"""

    os.makedirs(os.path.dirname(report_md_path), exist_ok=True)
    with open(report_md_path, "w", encoding="utf-8") as f:
        f.write(report_content)

    print("=" * 60)
    print("SUCCESS: Data Preprocessing Complete.")
    print(f"Data Quality Report written to: {report_md_path}")
    print("=" * 60)

if __name__ == "__main__":
    run_preprocessing()
