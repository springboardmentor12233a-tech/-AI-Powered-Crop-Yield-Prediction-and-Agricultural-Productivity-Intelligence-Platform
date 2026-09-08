"""
Milestone 2 - Step 6: Weather Analytics & Soil Analysis Modules
====================================================================
Two standalone analysis modules, separate from the yield prediction model.
Both use real dataset columns only - no synthetic data needed here since
avg_temperature, total_rainfall, soil_ph, soil_moisture, and NPK columns
are all real, measured fields in the dataset.

WEATHER MODULE:
  - Summarizes avg_temperature and total_rainfall by region and season.

SOIL MODULE:
  - "Healthy range" per crop type is derived from THIS dataset, not from
    external agricultural references, because this dataset's soil_ph,
    nitrogen/phosphorus/potassium values are on a different scale than
    real-world agronomy units (e.g. NPK here ranges ~0.5-3.0, not the
    much larger kg/ha or ppm values used in real soil science). Applying
    outside reference ranges directly would misclassify almost everything.
  - For each crop type, we look at rows with above-average yield for that
    crop, and use the 25th-75th percentile of their soil values as the
    "healthy range" - i.e., "what healthy soil conditions looked like for
    this crop, in this dataset."
  - Any row's soil values are then flagged as within or outside that range.

By: Shivani
"""

import pandas as pd

# ---------------------------------------------------------------
# Config
# ---------------------------------------------------------------
TRAIN_PATH = "../datasets/cleaned-crop-yield-production-dataset/train_split.csv"
TARGET = "yield_tpha"
SOIL_COLS = ["soil_ph", "soil_moisture", "nitrogen_content", "phosphorus_content", "potassium_content"]
OUTPUT_DIR = "../datasets/cleaned-crop-yield-production-dataset"


def load_data():
    df = pd.read_csv(TRAIN_PATH)
    print(f"Loaded data: {df.shape[0]} rows, {df.shape[1]} columns")
    return df


# =================================================================
# WEATHER MODULE
# =================================================================
def weather_summary(df: pd.DataFrame):
    print("\n" + "=" * 60)
    print("WEATHER MODULE: avg_temperature & total_rainfall summary")
    print("=" * 60)
    summary = df.groupby(["region", "season"])[["avg_temperature", "total_rainfall"]].mean().round(2)
    print(summary)
    summary.to_csv(f"{OUTPUT_DIR}/weather_summary.csv")
    print(f"\nSaved: {OUTPUT_DIR}/weather_summary.csv")
    return summary


# =================================================================
# SOIL MODULE
# =================================================================
def derive_healthy_ranges(df: pd.DataFrame) -> pd.DataFrame:
    """For each crop type, use above-average-yield rows to define a
    healthy 25th-75th percentile range for each soil column."""
    ranges = []
    for crop in df["crop_type"].unique():
        crop_df = df[df["crop_type"] == crop]
        crop_avg_yield = crop_df[TARGET].mean()
        healthy_df = crop_df[crop_df[TARGET] >= crop_avg_yield]

        row = {"crop_type": crop, "avg_yield": round(crop_avg_yield, 2)}
        for col in SOIL_COLS:
            row[f"{col}_low"] = round(healthy_df[col].quantile(0.25), 2)
            row[f"{col}_high"] = round(healthy_df[col].quantile(0.75), 2)
        ranges.append(row)

    ranges_df = pd.DataFrame(ranges)
    print("\n" + "=" * 60)
    print("SOIL MODULE: healthy ranges derived per crop type")
    print("=" * 60)
    print(ranges_df.to_string(index=False))
    ranges_df.to_csv(f"{OUTPUT_DIR}/soil_healthy_ranges.csv", index=False)
    print(f"\nSaved: {OUTPUT_DIR}/soil_healthy_ranges.csv")
    return ranges_df


def flag_soil_health(df: pd.DataFrame, ranges_df: pd.DataFrame) -> pd.DataFrame:
    """Flag each row's soil columns as within or outside the healthy
    range for its crop type."""
    df = df.copy()
    ranges_lookup = ranges_df.set_index("crop_type")

    for col in SOIL_COLS:
        flag_col = f"{col}_flag"
        df[flag_col] = "unknown"
        for crop in ranges_lookup.index:
            low = ranges_lookup.loc[crop, f"{col}_low"]
            high = ranges_lookup.loc[crop, f"{col}_high"]
            mask = df["crop_type"] == crop
            df.loc[mask, flag_col] = df.loc[mask, col].apply(
                lambda v: "healthy" if low <= v <= high else ("too low" if v < low else "too high")
            )

    print("\n" + "=" * 60)
    print("SAMPLE SOIL FLAGS (first 5 rows)")
    print("=" * 60)
    sample_cols = ["crop_type"] + SOIL_COLS + [f"{c}_flag" for c in SOIL_COLS]
    print(df[sample_cols].head().to_string(index=False))

    df.to_csv(f"{OUTPUT_DIR}/train_with_soil_flags.csv", index=False)
    print(f"\nSaved: {OUTPUT_DIR}/train_with_soil_flags.csv")
    return df


def main():
    df = load_data()
    weather_summary(df)
    ranges_df = derive_healthy_ranges(df)
    flag_soil_health(df, ranges_df)
    print("\nStep 6 complete. Weather summary and soil health flags saved.")


if __name__ == "__main__":
    main()