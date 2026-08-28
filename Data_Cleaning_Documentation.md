# Data Cleaning Documentation

## 1. Objective

The purpose of data cleaning in the YieldSense AI project is to prepare the two agricultural datasets for analysis and machine-learning work.

The project uses:

1. **Crop Yield Dataset**: field-level information such as soil properties, rainfall, temperature, fertilizer, pesticide usage, crop type, region, season and harvest date.
2. **FAOSTAT Crop Production Dataset**: agricultural statistics containing area harvested, production and yield by crop and year.

The cleaning process standardizes the two datasets, makes the crop names compatible, extracts the required FAOSTAT information, merges the datasets, checks data quality, and saves the resulting cleaned dataset.

---

# 2. Input Datasets

### Crop Yield Dataset

File:

```text
dataset/Crop_Yield_Test.csv
```

Important columns include:

```text
id
soil_ph
soil_moisture
avg_temperature
total_rainfall
fertilizer_amount
pesticide_usage
sunlight_hours
nitrogen_content
phosphorus_content
potassium_content
irrigation_frequency
crop_type
region
season
harvest_date
field_id
```

### FAOSTAT Dataset

File:

```text
dataset/FAOSTAT_Crop_Production.csv
```

Relevant FAOSTAT columns include:

```text
Area
Element
Item
Year
Unit
Value
```

The FAOSTAT dataset also contains metadata columns such as `Domain Code`, `Area Code (M49)`, `Element Code`, `Item Code (CPC)`, `Year Code`, `Flag`, `Flag Description`, and `Note`.

---

# 3. Import Libraries

## Code

```python
import pandas as pd
import numpy as np
```

## Explanation

`pandas` is used for reading, cleaning, transforming and merging tabular data.

`numpy` is used for numerical operations where required.

---

# 4. Load the Datasets

## Code

```python
crop_df = pd.read_csv("../dataset/Crop_Yield_Test.csv")

faostat_df = pd.read_csv("../dataset/FAOSTAT_Crop_Production.csv")
```

## Explanation

Both CSV files are loaded into pandas DataFrames.

- `crop_df` contains the field-level crop information.
- `faostat_df` contains the FAOSTAT agricultural statistics.

---

# 5. Inspect the Original Data

## Code

```python
print(crop_df.shape)
print(faostat_df.shape)

print(crop_df.columns)
print(faostat_df.columns)
```

Additional inspection:

```python
crop_df.head()
faostat_df.head()
```

## Explanation

Before cleaning, the structure of both datasets is checked.

This helps identify:

- Number of rows
- Number of columns
- Column names
- Data types
- Whether the expected fields are available

---

# 6. Standardize Column Names

## Code

```python
crop_df.columns = crop_df.columns.str.strip().str.lower()
faostat_df.columns = faostat_df.columns.str.strip()
```

## Explanation

Column names may contain unwanted spaces or inconsistent capitalization.

Standardizing the crop dataset column names makes later operations easier.

For example:

```text
Soil pH
```

can be standardized to:

```text
soil_ph
```

The FAOSTAT columns are retained with their recognizable names because they are used during the FAOSTAT transformation.

---

# 7. Clean and Convert the Harvest Date

## Code

```python
crop_df["harvest_date"] = pd.to_datetime(
    crop_df["harvest_date"],
    errors="coerce"
)
```

## Explanation

The `harvest_date` column is converted from text into a proper datetime type.

`errors="coerce"` converts invalid date values into missing values instead of stopping the program.

This makes the date column suitable for:

- Date-based analysis
- Extracting year/month/day
- Sorting by date
- Future feature engineering

---

# 8. Check Crop Types

## Code

```python
print(crop_df["crop_type"].unique())
```

The crop dataset contains:

```text
Rice
Soybean
Wheat
Barley
Corn
```

FAOSTAT uses different names for some of these crops.

For example:

```text
Soybean  -> Soya beans
Corn     -> Maize (corn)
```

Therefore, the crop names need to be mapped before merging.

---

# 9. Standardize FAOSTAT Crop Names

## Code

```python
crop_mapping = {
    "Rice": "Rice",
    "Soybean": "Soya beans",
    "Wheat": "Wheat",
    "Barley": "Barley",
    "Corn": "Maize (corn)"
}

crop_df["Item"] = crop_df["crop_type"].map(crop_mapping)
```

## Explanation

The two datasets use different names for some of the same crops.

For example:

```text
Crop Dataset       FAOSTAT
--------------------------------
Rice               Rice
Soybean            Soya beans
Wheat              Wheat
Barley             Barley
Corn               Maize (corn)
```

The mapping creates an `Item` column whose values match the FAOSTAT terminology.

This is necessary because a merge requires matching key values.

If the names do not match, the corresponding FAOSTAT information cannot be matched to the crop record.

---

# 10. Select the Required FAOSTAT Area

## Code

```python
faostat_df = faostat_df[
    faostat_df["Area"] == "India"
].copy()
```

## Explanation

The project uses the India-level agricultural statistics.

Filtering the FAOSTAT data to India prevents statistics from unrelated countries from being included in the merge.

---

# 11. Select the Required Year

## Code

```python
faostat_df = faostat_df[
    faostat_df["Year"] == 2021
].copy()
```

## Explanation

The crop dataset contains records for the year 2021.

Therefore, the FAOSTAT records are restricted to the same year so that crop statistics are matched using the same time period.

---

# 12. Keep Required FAOSTAT Elements

FAOSTAT stores different measurements in the `Element` column.

The relevant elements are:

```text
Area harvested
Production
Yield
```

## Code

```python
faostat_df = faostat_df[
    faostat_df["Element"].isin(
        ["Area harvested", "Production", "Yield"]
    )
].copy()
```

## Explanation

Only the agricultural measurements needed for the project are retained.

Other FAOSTAT elements are not required for the current merged dataset.

---

# 13. Convert FAOSTAT from Long Format to Wide Format

## Code

```python
faostat_wide = faostat_df.pivot_table(
    index=["Item", "Year"],
    columns="Element",
    values="Value",
    aggfunc="first"
).reset_index()
```

## Explanation

The original FAOSTAT data stores measurements in rows.

For example:

```text
Item      Year   Element          Value
Rice      2021   Area harvested   ...
Rice      2021   Production       ...
Rice      2021   Yield            ...
```

For easier merging, these are converted into columns:

```text
Item   Year   Area harvested   Production   Yield
```

`pivot_table()` performs this transformation.

`aggfunc="first"` selects the first value if more than one identical key combination exists.

---

# 14. Rename FAOSTAT Columns

## Code

```python
faostat_wide = faostat_wide.rename(columns={
    "Area harvested": "area_harvested",
    "Production": "production",
    "Yield": "yield"
})
```

## Explanation

The FAOSTAT column names are converted into simpler machine-learning-friendly names.

The resulting columns are:

```text
area_harvested
production
yield
```

---

# 15. Prepare the Crop Dataset for Merging

## Code

```python
crop_df["Year"] = crop_df["harvest_date"].dt.year
```

## Explanation

The year is extracted from `harvest_date`.

This creates a common time key that can be used together with the crop/item key when combining the two datasets.

---

# 16. Merge the Two Datasets

## Code

```python
combined_df = crop_df.merge(
    faostat_wide,
    left_on=["Item", "Year"],
    right_on=["Item", "Year"],
    how="left"
)
```

## Explanation

The datasets are merged using:

```text
Item + Year
```

The `left` merge keeps all records from the crop dataset and adds matching FAOSTAT information.

This is important because the field-level crop dataset is the main dataset.

The resulting dataset combines:

### Field-level information

```text
soil_ph
soil_moisture
avg_temperature
total_rainfall
fertilizer_amount
pesticide_usage
sunlight_hours
nitrogen_content
phosphorus_content
potassium_content
irrigation_frequency
region
season
harvest_date
field_id
```

with:

### FAOSTAT information

```text
area_harvested
production
yield
```

---

# 17. Clean Up Column Names

## Code

```python
combined_df.columns = (
    combined_df.columns
    .str.strip()
    .str.lower()
    .str.replace(" ", "_")
)
```

## Explanation

This makes the final column names consistent.

For example:

```text
Area harvested
```

becomes:

```text
area_harvested
```

This is useful because consistent column names make Python code easier to write and maintain.

---

# 18. Remove Duplicate Rows

## Code

```python
combined_df = combined_df.drop_duplicates()
```

## Explanation

Duplicate rows can cause the same observation to be counted multiple times.

They are removed before analysis and modeling.

After cleaning, the dataset was checked and the duplicate-row count was:

```text
0
```

---

# 19. Check Missing Values

## Code

```python
combined_df.isnull().sum()
```

## Explanation

Missing-value checking is important because machine-learning algorithms may not handle missing values automatically.

The final cleaned dataset showed:

```text
0 missing values
```

for the checked columns.

---

# 20. Check Data Types

## Code

```python
combined_df.info()
```

The final dataset contains:

```text
1,200 rows
22 columns
```

Important data types include:

```text
int64
float64
int32
datetime64
str
```

The `harvest_date` column is stored as a datetime type.

---

# 21. Check the Final Dataset

## Code

```python
print("Cleaned dataset shape:", combined_df.shape)

print("
Missing values:")
print(combined_df.isnull().sum())

print("
Duplicate rows:", combined_df.duplicated().sum())

combined_df.head()
```

## Expected Result

```text
Cleaned dataset shape: (1200, 22)
```

Missing values:

```text
0
```

Duplicate rows:

```text
0
```

---

# 22. Save the Cleaned Dataset

## Code

```python
combined_df.to_csv(
    "../dataset/Cleaned_Crop_Yield.csv",
    index=False
)
```

## Explanation

The cleaned and merged dataset is saved as:

```text
dataset/Cleaned_Crop_Yield.csv
```

This file becomes the input for the separate EDA notebook.

---

# 23. Final Cleaning Pipeline

The complete cleaning workflow can be summarized as:

```text
Raw Crop Yield Dataset
          |
          v
    Load the data
          |
          v
   Standardize columns
          |
          v
 Convert harvest_date
          |
          v
    Check crop types
          |
          v
 Map crop names to FAOSTAT names
          |
          v
      FAOSTAT Dataset
          |
          v
    Filter India + 2021
          |
          v
 Keep Area harvested,
 Production and Yield
          |
          v
     Pivot FAOSTAT
          |
          v
      Merge datasets
          |
          v
 Standardize final columns
          |
          v
 Remove duplicates
          |
          v
 Check missing values
          |
          v
     Final validation
          |
          v
Cleaned_Crop_Yield.csv
```

# 24. Important Note About the Merge

The FAOSTAT `yield`, `production`, and `area_harvested` values are aggregate agricultural statistics.

When they are merged using crop and year, the same FAOSTAT value can be associated with multiple field-level records belonging to the same crop and year.

For example, the merged data showed approximately:

```text
Rice      -> Yield 4203.3
Soybean   -> Yield 1069.2
Wheat     -> Yield 3520.8
Barley    -> Yield 2795.7
Corn      -> Yield 3303.3
```

Therefore, these FAOSTAT values should be understood as supplementary aggregate agricultural information rather than individual field measurements.

This limitation was also identified during EDA and should be considered before final model training.

# 25. Conclusion

The data-cleaning stage converts two differently structured agricultural datasets into a single consistent dataset containing 1,200 records and 22 columns.

The process:

- Loads both datasets
- Standardizes the data
- Converts the harvest date
- Aligns crop names
- Filters the relevant FAOSTAT records
- Extracts area harvested, production and yield
- Reshapes FAOSTAT data
- Merges both datasets
- Removes duplicates
- Checks missing values and data types
- Saves the cleaned dataset

The resulting file is:

```text
dataset/Cleaned_Crop_Yield.csv
```

This cleaned dataset is then used by the separate `EDA.ipynb` notebook for visualization and exploratory analysis.
