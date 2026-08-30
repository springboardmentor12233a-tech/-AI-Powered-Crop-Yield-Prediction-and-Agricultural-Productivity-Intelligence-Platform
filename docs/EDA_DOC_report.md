# EDA Documentation

## 1. Objective

Exploratory Data Analysis (EDA) was performed on the cleaned and merged
crop-yield dataset to understand distributions, categorical patterns,
relationships between variables, and important data limitations before
machine-learning development.

## 2. Dataset

The cleaned dataset contains **1,200 rows and 22 columns**.

The main variables considered in the EDA are `crop_type`, `region`,
`season`, `yield`, `total_rainfall`, and `soil_ph`, along with the other
field-level agricultural features.

## 3. Libraries

``` python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
```

## 4. Distribution of Crop Yield

### Code

``` python
plt.figure(figsize=(8, 5))

sns.histplot(data=df, x="yield", kde=True)

plt.title("Distribution of Crop Yield")
plt.xlabel("Yield")
plt.ylabel("Frequency")
plt.show()
```

### Analysis

The yield values form distinct groups rather than one continuous
distribution. The major yield levels correspond to the five crop types.
This indicates that the current `yield` variable is strongly associated
with `crop_type`.

------------------------------------------------------------------------

## 5. Number of Records by Crop Type

### Code

``` python
plt.figure(figsize=(8, 5))

sns.countplot(data=df, x="crop_type")

plt.title("Number of Records by Crop Type")
plt.xlabel("Crop Type")
plt.ylabel("Count")
plt.show()
```

### Analysis

The dataset contains five crop types: Rice, Soybean, Wheat, Barley, and
Corn. The number of records is relatively balanced across the five
categories, with no extremely underrepresented crop.

------------------------------------------------------------------------

## 6. Yield Distribution by Crop Type

### Code

``` python
plt.figure(figsize=(8, 5))

sns.boxplot(data=df, x="crop_type", y="yield")

plt.title("Yield Distribution by Crop Type")
plt.xlabel("Crop Type")
plt.ylabel("Yield")
plt.show()
```

### Analysis

The plot shows almost flat horizontal lines for each crop.

Approximate yield values are:

-   Rice: 4203.3
-   Soybean: 1069.2
-   Wheat: 3520.8
-   Barley: 2795.7
-   Corn: 3303.3

There is almost no within-crop variation in the current yield variable.
This indicates that the FAOSTAT yield values used during merging are
effectively constant for each crop in the merged 2021 dataset.

------------------------------------------------------------------------

## 7. Rainfall vs Yield

### Code

``` python
plt.figure(figsize=(8, 5))

sns.scatterplot(
    data=df,
    x="total_rainfall",
    y="yield",
    hue="crop_type"
)

plt.title("Rainfall vs Yield")
plt.xlabel("Total Rainfall")
plt.ylabel("Yield")
plt.show()
```

### Analysis

The points form five clear horizontal bands. Rainfall varies
considerably within each crop, while yield remains almost constant.

Therefore, this plot does not show a meaningful field-level
rainfall-to-yield relationship in the current merged dataset. The main
reason is that the yield value is largely fixed according to crop type
in the merged FAOSTAT data.

------------------------------------------------------------------------

## 8. Average Yield by Region

### Code

``` python
plt.figure(figsize=(8, 5))

sns.barplot(
    data=df,
    x="region",
    y="yield"
)

plt.title("Average Yield by Region")
plt.xlabel("Region")
plt.ylabel("Average Yield")
plt.show()
```

### Analysis

The regional averages differ moderately.

-   South has the highest average yield, approximately 3050.
-   East is approximately 3010.
-   West and Central are approximately 3000.
-   North has the lowest average yield, approximately 2900.

These differences should not be interpreted as proof that region
directly determines yield because crop type is strongly associated with
the current yield target.

------------------------------------------------------------------------

## 9. Average Yield by Season

### Code

``` python
plt.figure(figsize=(8, 5))

sns.barplot(
    data=df,
    x="season",
    y="yield"
)

plt.title("Average Yield by Season")
plt.xlabel("Season")
plt.ylabel("Average Yield")
plt.show()
```

### Analysis

The seasonal averages are relatively close.

-   Summer has the highest average yield, approximately 3020.
-   Autumn is approximately 2990.
-   Spring has the lowest average yield, approximately 2940.

The differences are small and should be treated as descriptive rather
than as evidence of a direct seasonal effect on yield.

------------------------------------------------------------------------

## 10. Distribution of Soil pH

### Code

``` python
plt.figure(figsize=(8, 5))

sns.histplot(data=df, x="soil_ph", kde=True)

plt.title("Distribution of Soil pH")
plt.xlabel("Soil pH")
plt.ylabel("Frequency")
plt.show()
```

### Analysis

The soil pH values range approximately from **4.5 to 8.5**. The values
are spread across most of this range rather than being concentrated in
one narrow interval.

This shows useful variation in the soil pH feature, making it an
important field-level variable for further analysis.

------------------------------------------------------------------------

# 11. Overall EDA Findings

1.  The cleaned dataset contains 1,200 records and 22 columns.
2.  Five crop types are present: Rice, Soybean, Wheat, Barley, and Corn.
3.  The crop categories have relatively similar numbers of records.
4.  Yield is clearly separated by crop type.
5.  The current yield target has very little variation within each crop
    type.
6.  Rainfall varies substantially, while the current yield does not vary
    correspondingly within crop types.
7.  Average yield differs moderately across regions.
8.  Average yield differs slightly across seasons.
9.  Soil pH shows a broad distribution from approximately 4.5 to 8.5.

# 12. Important Data Limitation

The FAOSTAT data contains aggregate crop statistics such as area
harvested, production, and yield.

After matching FAOSTAT with the field-level dataset by crop and year,
the same FAOSTAT yield can be assigned to multiple field-level records.

The current merged target therefore behaves approximately as:

``` text
Rice     -> 4203.3
Soybean  -> 1069.2
Wheat    -> 3520.8
Barley   -> 2795.7
Corn     -> 3303.3
```

Consequently, plots such as rainfall vs yield, temperature vs yield, and
fertilizer vs yield should not currently be interpreted as genuine
field-level predictive relationships.

# 13. Conclusion

EDA identified the distributions and patterns in the cleaned dataset
and, importantly, revealed a limitation in the current target variable.

The field-level input features have variation, but the current yield
target is largely determined by crop type because it comes from
aggregate FAOSTAT statistics.

Before final model training, the original crop-yield data should be
checked for a genuine field-level yield target. If available, that
target should preferably be used for crop-yield prediction, while
FAOSTAT can be retained as supplementary agricultural information.

