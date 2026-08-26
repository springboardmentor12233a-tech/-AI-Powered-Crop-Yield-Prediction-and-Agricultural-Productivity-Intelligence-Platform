import pandas as pd

# Load cleaned dataset
df = pd.read_csv("datasets/Smart_Farming_Crop_Yield_2024_cleaned.csv")

print("===== OUTLIER ANALYSIS USING IQR =====")

numeric_columns = df.select_dtypes(include=["number"]).columns

for column in numeric_columns:
    Q1 = df[column].quantile(0.25)
    Q3 = df[column].quantile(0.75)

    IQR = Q3 - Q1

    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR

    outliers = df[
        (df[column] < lower_bound) |
        (df[column] > upper_bound)
    ]

    print(f"\n{column}")
    print("Q1:", Q1)
    print("Q3:", Q3)
    print("IQR:", IQR)
    print("Lower Bound:", lower_bound)
    print("Upper Bound:", upper_bound)
    print("Outliers:", len(outliers))