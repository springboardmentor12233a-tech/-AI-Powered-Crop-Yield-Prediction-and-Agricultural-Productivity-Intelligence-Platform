"""
Exploratory Data Analysis - Crop Yield Prediction Module
==========================================================
Milestone 1: EDA on crop_yield_train.csv
By: Shivani

"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os

# ---------------------------------------------------------------
# Config
# ---------------------------------------------------------------
DATA_PATH = "datasets/cleaned-crop-yield-production-dataset/crop_yield_train_cleaned.csv"
OUTPUT_DIR = "eda/plots"
TARGET = "yield_tpha"

sns.set_style("whitegrid")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def load_data(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    print(f"Loaded data: {df.shape[0]} rows, {df.shape[1]} columns")
    return df


def basic_overview(df: pd.DataFrame):
    print("\n" + "=" * 60)
    print("BASIC OVERVIEW")
    print("=" * 60)
    print(df.head())
    print("\nData types:\n", df.dtypes)
    print("\nSummary statistics:\n", df.describe(include="all").T)


def missing_values(df: pd.DataFrame):
    print("\n" + "=" * 60)
    print("MISSING VALUES")
    print("=" * 60)
    missing = df.isnull().sum()
    missing_pct = (missing / len(df)) * 100
    summary = pd.DataFrame({"missing_count": missing, "missing_pct": missing_pct})
    print(summary[summary["missing_count"] > 0] if missing.sum() > 0 else "No missing values found.")


def target_distribution(df: pd.DataFrame):
    print("\n" + "=" * 60)
    print("TARGET VARIABLE DISTRIBUTION:", TARGET)
    print("=" * 60)
    print(df[TARGET].describe())

    plt.figure(figsize=(8, 5))
    sns.histplot(df[TARGET], kde=True, bins=40, color="seagreen")
    plt.title("Distribution of Crop Yield (tonnes/hectare)")
    plt.xlabel("Yield (t/ha)")
    plt.tight_layout()
    plt.savefig(f"{OUTPUT_DIR}/target_distribution.png")
    plt.close()


def numeric_distributions(df: pd.DataFrame):
    numeric_cols = df.select_dtypes(include=np.number).columns.drop(
        ["id", TARGET], errors="ignore"
    )
    n = len(numeric_cols)
    ncols = 3
    nrows = int(np.ceil(n / ncols))

    fig, axes = plt.subplots(nrows, ncols, figsize=(5 * ncols, 4 * nrows))
    axes = axes.flatten()
    for i, col in enumerate(numeric_cols):
        sns.histplot(df[col], kde=True, ax=axes[i], color="steelblue")
        axes[i].set_title(col)
    for j in range(i + 1, len(axes)):
        fig.delaxes(axes[j])
    plt.tight_layout()
    plt.savefig(f"{OUTPUT_DIR}/numeric_distributions.png")
    plt.close()


def categorical_breakdown(df: pd.DataFrame):
    print("\n" + "=" * 60)
    print("CATEGORICAL FEATURES")
    print("=" * 60)
    cat_cols = ["crop_type", "region", "season"]
    for col in cat_cols:
        print(f"\n{col} value counts:\n", df[col].value_counts())

    fig, axes = plt.subplots(1, len(cat_cols), figsize=(6 * len(cat_cols), 5))
    for i, col in enumerate(cat_cols):
        sns.boxplot(data=df, x=col, y=TARGET, ax=axes[i])
        axes[i].set_title(f"Yield by {col}")
        axes[i].tick_params(axis="x", rotation=45)
    plt.tight_layout()
    plt.savefig(f"{OUTPUT_DIR}/categorical_vs_yield.png")
    plt.close()


def correlation_analysis(df: pd.DataFrame):
    print("\n" + "=" * 60)
    print("CORRELATION WITH TARGET")
    print("=" * 60)
    numeric_df = df.select_dtypes(include=np.number).drop(columns=["id"], errors="ignore")
    corr = numeric_df.corr()
    print(corr[TARGET].sort_values(ascending=False))

    plt.figure(figsize=(10, 8))
    sns.heatmap(corr, annot=True, fmt=".2f", cmap="coolwarm", center=0)
    plt.title("Correlation Heatmap")
    plt.tight_layout()
    plt.savefig(f"{OUTPUT_DIR}/correlation_heatmap.png")
    plt.close()


def outlier_check(df: pd.DataFrame):
    print("\n" + "=" * 60)
    print("OUTLIER CHECK (IQR method)")
    print("=" * 60)
    numeric_cols = df.select_dtypes(include=np.number).columns.drop(
        ["id"], errors="ignore"
    )
    for col in numeric_cols:
        q1, q3 = df[col].quantile([0.25, 0.75])
        iqr = q3 - q1
        lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        outliers = df[(df[col] < lower) | (df[col] > upper)]
        if len(outliers) > 0:
            print(f"{col}: {len(outliers)} outliers ({len(outliers)/len(df)*100:.1f}%)")


def engineered_feature_preview(df: pd.DataFrame):
    """Quick look at the derived rainfall-to-temperature ratio feature."""
    print("\n" + "=" * 60)
    print("ENGINEERED FEATURE PREVIEW: rainfall_to_temp_ratio")
    print("=" * 60)
    df = df.copy()
    df["rainfall_to_temp_ratio"] = df["total_rainfall"] / df["avg_temperature"]
    print(df["rainfall_to_temp_ratio"].describe())
    print("Correlation with yield:", df["rainfall_to_temp_ratio"].corr(df[TARGET]))


def main():
    df = load_data(DATA_PATH)
    basic_overview(df)
    missing_values(df)
    target_distribution(df)
    numeric_distributions(df)
    categorical_breakdown(df)
    correlation_analysis(df)
    outlier_check(df)
    engineered_feature_preview(df)
    print(f"\nAll plots saved to '{OUTPUT_DIR}/'")


if __name__ == "__main__":
    main()