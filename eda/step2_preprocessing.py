"""
Milestone 2 - Step 2: Preprocessing & Feature Engineering
============================================================
Takes train_split.csv and val_split.csv (from Step 1) and prepares
both for modeling:
  - One-hot encode crop_type, region, season
  - Extract month from harvest_date, then drop harvest_date
  - Drop field_id (just an identifier, not predictive)
  - Add two engineered features and check their correlation with yield:
      - rainfall_to_temp_ratio
      - fertilizer_nitrogen_interaction (fertilizer_amount * nitrogen_content)

Important: encoding is "fit" on train data only, then the same columns
are applied to validation data. This avoids the validation set leaking
information into how encoding is done.

By: Shivani
"""

import pandas as pd

# ---------------------------------------------------------------
# Config
# ---------------------------------------------------------------
TRAIN_PATH = "../datasets/cleaned-crop-yield-production-dataset/train_split.csv"
VAL_PATH = "../datasets/cleaned-crop-yield-production-dataset/val_split.csv"
OUTPUT_DIR = "../datasets/cleaned-crop-yield-production-dataset"
TARGET = "yield_tpha"
CATEGORICAL_COLS = ["crop_type", "region", "season"]


def load_data():
    train_df = pd.read_csv(TRAIN_PATH)
    val_df = pd.read_csv(VAL_PATH)
    print(f"Loaded train: {train_df.shape[0]} rows, {train_df.shape[1]} columns")
    print(f"Loaded val:   {val_df.shape[0]} rows, {val_df.shape[1]} columns")
    return train_df, val_df


def extract_month(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["harvest_date"] = pd.to_datetime(df["harvest_date"])
    df["harvest_month"] = df["harvest_date"].dt.month
    df = df.drop(columns=["harvest_date"])
    return df


def drop_field_id(df: pd.DataFrame) -> pd.DataFrame:
    return df.drop(columns=["field_id"], errors="ignore")


def one_hot_encode(train_df: pd.DataFrame, val_df: pd.DataFrame):
    """Fit encoding on train columns, then align val to match exactly."""
    train_encoded = pd.get_dummies(train_df, columns=CATEGORICAL_COLS)
    val_encoded = pd.get_dummies(val_df, columns=CATEGORICAL_COLS)

    # Align val columns to train columns (handles categories missing in val,
    # and drops any category val has that train doesn't)
    val_encoded = val_encoded.reindex(columns=train_encoded.columns, fill_value=0)

    print(f"\nAfter one-hot encoding: {train_encoded.shape[1]} columns")
    new_cols = [c for c in train_encoded.columns if any(c.startswith(p + "_") for p in CATEGORICAL_COLS)]
    print("New encoded columns:", new_cols)
    return train_encoded, val_encoded


def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["rainfall_to_temp_ratio"] = df["total_rainfall"] / df["avg_temperature"]
    df["fertilizer_nitrogen_interaction"] = df["fertilizer_amount"] * df["nitrogen_content"]
    return df


def check_engineered_feature_value(train_df: pd.DataFrame):
    print("\n" + "=" * 60)
    print("ENGINEERED FEATURE CHECK (correlation with yield)")
    print("=" * 60)
    for col in ["rainfall_to_temp_ratio", "fertilizer_nitrogen_interaction"]:
        corr = train_df[col].corr(train_df[TARGET])
        print(f"{col}: correlation = {corr:.3f}")
    print("\nCompare these against fertilizer_amount alone (~0.76 from Milestone 1 EDA)")
    print("and pesticide_usage alone (~-0.26) to judge if the new features add value.")


def preprocess(df: pd.DataFrame) -> pd.DataFrame:
    df = extract_month(df)
    df = drop_field_id(df)
    df = add_engineered_features(df)
    return df


def save_output(train_df: pd.DataFrame, val_df: pd.DataFrame):
    train_path = f"{OUTPUT_DIR}/train_processed.csv"
    val_path = f"{OUTPUT_DIR}/val_processed.csv"
    train_df.to_csv(train_path, index=False)
    val_df.to_csv(val_path, index=False)
    print(f"\nSaved: {train_path}")
    print(f"Saved: {val_path}")


def main():
    train_df, val_df = load_data()

    train_df = preprocess(train_df)
    val_df = preprocess(val_df)

    train_df, val_df = one_hot_encode(train_df, val_df)

    check_engineered_feature_value(train_df)

    save_output(train_df, val_df)
    print("\nStep 2 complete. Use train_processed.csv / val_processed.csv for Step 3 (model training).")


if __name__ == "__main__":
    main()