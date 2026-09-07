"""
Milestone 2 - Step 1: Train/Validation Split
==============================================
Splits crop_yield_train.csv into 70% train / 30% validation.
crop_yield_test.csv is NOT touched here - it has no yield_tpha column
and is only used at the very end for final submission predictions.

By: Shivani
"""

import pandas as pd
from sklearn.model_selection import train_test_split

# ---------------------------------------------------------------
# Config
# ---------------------------------------------------------------
DATA_PATH = "../datasets/cleaned-crop-yield-production-dataset/crop_yield_train_cleaned.csv"
OUTPUT_DIR = "../datasets/cleaned-crop-yield-production-dataset"
TARGET = "yield_tpha"
TRAIN_SIZE = 0.7
RANDOM_STATE = 42  # fixed seed so the split is reproducible every time you run this


def load_data(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    print(f"Loaded data: {df.shape[0]} rows, {df.shape[1]} columns")
    return df


def split_data(df: pd.DataFrame):
    train_df, val_df = train_test_split(
        df,
        train_size=TRAIN_SIZE,
        random_state=RANDOM_STATE,
    )
    print(f"\nTrain set: {train_df.shape[0]} rows ({TRAIN_SIZE*100:.0f}%)")
    print(f"Validation set: {val_df.shape[0]} rows ({(1-TRAIN_SIZE)*100:.0f}%)")
    return train_df, val_df


def save_split(train_df: pd.DataFrame, val_df: pd.DataFrame):
    train_path = f"{OUTPUT_DIR}/train_split.csv"
    val_path = f"{OUTPUT_DIR}/val_split.csv"
    train_df.to_csv(train_path, index=False)
    val_df.to_csv(val_path, index=False)
    print(f"\nSaved: {train_path}")
    print(f"Saved: {val_path}")


def main():
    df = load_data(DATA_PATH)
    train_df, val_df = split_data(df)
    save_split(train_df, val_df)
    print("\nStep 1 complete. Use train_split.csv for training, val_split.csv for evaluation.")


if __name__ == "__main__":
    main()