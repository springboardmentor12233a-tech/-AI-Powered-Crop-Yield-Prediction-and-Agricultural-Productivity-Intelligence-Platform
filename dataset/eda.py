import pandas as pd
import matplotlib.pyplot as plt

# ============================================
# LOAD DATASET
# ============================================

df = pd.read_csv("cleaned_crop_yield_train.csv")

print("=" * 60)
print("1. BASIC DATASET INFORMATION")
print("=" * 60)

print("Shape:", df.shape)

print("\nColumns:")
print(df.columns.tolist())

print("\nData Types:")
print(df.dtypes)

print("\nMissing Values:")
print(df.isnull().sum())

print("\nDuplicate Rows:", df.duplicated().sum())


# ============================================
# 2. YEAR ANALYSIS
# ============================================

print("\n" + "=" * 60)
print("2. YEAR ANALYSIS")
print("=" * 60)

print("Year Range:", df["Year"].min(), "-", df["Year"].max())

print("\nRecords per Year:")
print(df["Year"].value_counts().sort_index())


# ============================================
# 3. STATE ANALYSIS
# ============================================

print("\n" + "=" * 60)
print("3. STATE ANALYSIS")
print("=" * 60)

print("Number of States:", df["State"].nunique())

print("\nRecords per State:")
print(df["State"].value_counts())


# ============================================
# 4. CROP ANALYSIS
# ============================================

print("\n" + "=" * 60)
print("4. CROP ANALYSIS")
print("=" * 60)

print("Number of Crops:", df["Crop"].nunique())

print("\nRecords per Crop:")
print(df["Crop"].value_counts())


# ============================================
# 5. SEASON ANALYSIS
# ============================================

print("\n" + "=" * 60)
print("5. SEASON ANALYSIS")
print("=" * 60)

print("Number of Seasons:", df["Season"].nunique())

print("\nRecords per Season:")
print(df["Season"].value_counts())


# ============================================
# 6. NUMERICAL STATISTICS
# ============================================

print("\n" + "=" * 60)
print("6. NUMERICAL STATISTICS")
print("=" * 60)

numeric_cols = df.select_dtypes(include="number").columns

print(df[numeric_cols].describe().T)


# ============================================
# 7. CORRELATION WITH YIELD
# ============================================

print("\n" + "=" * 60)
print("7. CORRELATION WITH YIELD")
print("=" * 60)

correlation = df[numeric_cols].corr()["Yield"].sort_values(
    ascending=False
)

print(correlation)


# ============================================
# 8. CROP-WISE YIELD STATISTICS
# ============================================

print("\n" + "=" * 60)
print("8. CROP-WISE YIELD STATISTICS")
print("=" * 60)

crop_stats = df.groupby("Crop")["Yield"].agg(
    Count="count",
    Mean="mean",
    Median="median",
    Minimum="min",
    Maximum="max",
    Standard_Deviation="std"
).sort_values("Mean", ascending=False)

print(crop_stats)


# ============================================
# 9. CROP FREQUENCY CHECK
# ============================================

print("\n" + "=" * 60)
print("9. RARE CROP CHECK")
print("=" * 60)

crop_counts = df["Crop"].value_counts()

print("\nCrops with fewer than 20 records:")
print(crop_counts[crop_counts < 20])

print("\nCrops with fewer than 50 records:")
print(crop_counts[crop_counts < 50])


# ============================================
# 10. CROP-WISE OUTLIER CHECK
#     IQR METHOD
# ============================================

print("\n" + "=" * 60)
print("10. CROP-WISE OUTLIER CHECK")
print("=" * 60)


def find_outliers(group):

    q1 = group["Yield"].quantile(0.25)

    q3 = group["Yield"].quantile(0.75)

    iqr = q3 - q1

    lower = q1 - 1.5 * iqr

    upper = q3 + 1.5 * iqr

    outliers = (
        (group["Yield"] < lower) |
        (group["Yield"] > upper)
    ).sum()

    return pd.Series({
        "Q1": q1,
        "Q3": q3,
        "Lower_Bound": lower,
        "Upper_Bound": upper,
        "Outlier_Count": outliers
    })


outlier_stats = df.groupby("Crop").apply(
    find_outliers,
    include_groups=False
)

print(outlier_stats)


# ============================================
# 11. TOP 20 HIGHEST YIELD VALUES
# ============================================

print("\n" + "=" * 60)
print("11. TOP 20 HIGHEST YIELD RECORDS")
print("=" * 60)

print(
    df.nlargest(20, "Yield")
)


# ============================================
# 12. LOWEST 20 YIELD VALUES
# ============================================

print("\n" + "=" * 60)
print("12. LOWEST 20 YIELD RECORDS")
print("=" * 60)

print(
    df.nsmallest(20, "Yield")
)


# ============================================
# 13. UNIQUE CATEGORICAL VALUES
# ============================================

print("\n" + "=" * 60)
print("13. CATEGORICAL VALUES")
print("=" * 60)

print("\nStates:")
print(sorted(df["State"].unique()))

print("\nCrops:")
print(sorted(df["Crop"].unique()))

print("\nSeasons:")
print(sorted(df["Season"].unique()))


# ============================================
# 14. FEATURE DISTRIBUTION
# ============================================

print("\n" + "=" * 60)
print("14. FEATURE DISTRIBUTION")
print("=" * 60)

numeric_features = [
    "Area",
    "Annual_Rainfall",
    "Fertilizer",
    "Pesticide",
    "Yield"
]

for column in numeric_features:

    plt.figure(figsize=(8, 5))

    plt.hist(df[column], bins=50)

    plt.title(column + " Distribution")

    plt.xlabel(column)

    plt.ylabel("Frequency")

    plt.tight_layout()

    plt.show()


# ============================================
# 15. AVERAGE YIELD BY CROP
# ============================================

plt.figure(figsize=(12, 10))

df.groupby("Crop")["Yield"].mean().sort_values().plot(
    kind="barh"
)

plt.title("Average Yield by Crop")

plt.xlabel("Average Yield")

plt.ylabel("Crop")

plt.tight_layout()

plt.show()


# ============================================
# 16. AVERAGE YIELD BY SEASON
# ============================================

plt.figure(figsize=(8, 5))

df.groupby("Season")["Yield"].mean().sort_values().plot(
    kind="bar"
)

plt.title("Average Yield by Season")

plt.xlabel("Season")

plt.ylabel("Average Yield")

plt.xticks(rotation=45)

plt.tight_layout()

plt.show()


# ============================================
# 17. AVERAGE YIELD BY STATE
# ============================================

plt.figure(figsize=(12, 8))

df.groupby("State")["Yield"].mean().sort_values().plot(
    kind="barh"
)

plt.title("Average Yield by State")

plt.xlabel("Average Yield")

plt.ylabel("State")

plt.tight_layout()

plt.show()


# ============================================
# 18. CORRELATION GRAPH
# ============================================

plt.figure(figsize=(8, 5))

correlation.drop("Yield").sort_values().plot(
    kind="barh"
)

plt.title("Numerical Feature Correlation with Yield")

plt.xlabel("Correlation")

plt.ylabel("Feature")

plt.tight_layout()

plt.show()


# ============================================
# 19. SAVE EDA RESULTS
# ============================================

crop_stats.to_csv(
    "crop_yield_statistics.csv"
)

outlier_stats.to_csv(
    "crop_yield_outliers.csv"
)

correlation.to_csv(
    "yield_correlations.csv"
)


# ============================================
# FINAL SUMMARY
# ============================================

print("\n" + "=" * 60)
print("EDA COMPLETED SUCCESSFULLY")
print("=" * 60)

print("Rows:", len(df))
print("Columns:", len(df.columns))
print("States:", df["State"].nunique())
print("Crops:", df["Crop"].nunique())
print("Seasons:", df["Season"].nunique())
print("Years:", df["Year"].min(), "-", df["Year"].max())
print("Missing Values:", df.isnull().sum().sum())
print("Duplicate Rows:", df.duplicated().sum())