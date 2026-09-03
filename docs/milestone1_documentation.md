# YieldSense AI

## Milestone 1 Documentation

### Requirements & Dataset Preparation

---

### Title
AI-Based Crop Yield Prediction and Agricultural Recommendation Platform Using Soil and Weather Parameters.

### Project Objective
The objective of this project is to develop a machine learning platform to predict crop yield (`Yield_ton_per_ha`) and provide optimal crop recommendations using soil nutrients, weather conditions, and farm management features.

Since the primary target variable (`Yield_ton_per_ha`) is a continuous numerical value, this problem is treated as a **regression problem**. Additionally, the crop recommendation task (`Label`) is treated as a **multiclass classification problem**.

### Data Source
The datasets were acquired as part of the agricultural intelligence platform development from Kaggle Open Datasets:
1. Smart Crop Yield Prediction Dataset
2. Crop Recommendation Dataset

**Dataset details (Smart Crop Yield - Primary Regression Dataset):**
- Total records: 10000
- Total columns: 13
- Categorical features: Crop, Region, Soil_Type, Irrigation, Previous_Crop
- Numerical features: Soil_pH, Rainfall_mm, Temperature_C, Humidity_pct, Fertilizer_Used_kg, Pesticides_Used_kg, Planting_Density
- Target variable: Yield_ton_per_ha

---

### Process Followed

#### Step 1: Environment Setup
- Created a virtual environment.
- Installed required libraries (pandas, numpy, seaborn, matplotlib, scikit-learn, fastapi).
- Used Python scripts and Jupyter Notebook for implementation.

---

#### Step 2: Data Exploration

The dataset was loaded using:
```python
df = pd.read_csv("crop_yield_dataset.csv")
df.head()
```

<!-- ========================================== -->
<!-- [IMAGE PLACEHOLDER 1: df.head() Table / Screenshot] -->
<!-- ========================================== -->

| Crop | Region | Soil_Type | Soil_pH | Rainfall_mm | Temperature_C | Humidity_pct | Fertilizer_Used_kg | Irrigation | Pesticides_Used_kg | Planting_Density | Previous_Crop | Yield_ton_per_ha |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Rice | Region_A | Clay | 6.50 | 1200.5 | 28.4 | 78.0 | 220.0 | Flood | 25.0 | 18.0 | Wheat | 135.20 |
| Wheat | Region_B | Loam | 6.80 | 650.2 | 21.5 | 55.0 | 180.0 | Sprinkler | 15.0 | 14.0 | Maize | 118.45 |
| Maize | Region_C | Sandy | 6.10 | 820.0 | 26.0 | 62.0 | 250.0 | Drip | 30.0 | 20.0 | NaN | 142.10 |
| Barley | Region_D | Loam | 7.20 | 450.0 | 18.2 | 48.0 | 120.0 | NaN | 10.0 | 12.0 | Rice | 95.30 |
| Rice | Region_A | Clay | 6.40 | 1350.0 | 29.1 | 82.0 | 280.0 | Flood | 35.0 | 22.0 | Barley | 158.70 |

```python
df.info()
```

<!-- ========================================== -->
<!-- [IMAGE PLACEHOLDER 2: df.info() Output / Screenshot] -->
<!-- ========================================== -->

```
<class 'pandas.DataFrame'>
RangeIndex: 10000 entries, 0 to 9999
Data columns (total 13 columns):
 #   Column               Non-Null Count  Dtype  
---  ------               --------------  -----  
 0   Crop                 10000 non-null  object 
 1   Region               10000 non-null  object 
 2   Soil_Type            10000 non-null  object 
 3   Soil_pH              10000 non-null  float64
 4   Rainfall_mm          10000 non-null  float64
 5   Temperature_C        10000 non-null  float64
 6   Humidity_pct         10000 non-null  float64
 7   Fertilizer_Used_kg   10000 non-null  float64
 8   Irrigation           7462 non-null   object 
 9   Pesticides_Used_kg   10000 non-null  float64
 10  Planting_Density     10000 non-null  float64
 11  Previous_Crop        7969 non-null   object 
 12  Yield_ton_per_ha     10000 non-null  float64
dtypes: float64(8), object(5)
memory usage: 1015.8 KB
```

```python
df.describe()
```

<!-- ========================================== -->
<!-- [IMAGE PLACEHOLDER 3: df.describe() Table / Screenshot] -->
<!-- ========================================== -->

| Statistic | Soil_pH | Rainfall_mm | Temperature_C | Humidity_pct | Fertilizer_Used_kg | Pesticides_Used_kg | Planting_Density | Yield_ton_per_ha |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **count** | 10000.00 | 10000.00 | 10000.00 | 10000.00 | 10000.00 | 10000.00 | 10000.00 | 10000.00 |
| **mean** | 6.52 | 843.66 | 24.98 | 60.05 | 175.08 | 25.06 | 15.00 | 117.89 |
| **std** | 0.57 | 373.67 | 5.79 | 17.32 | 71.96 | 14.35 | 5.83 | 37.97 |
| **min** | 5.50 | 200.00 | 15.00 | 30.00 | 50.00 | 0.00 | 5.00 | 28.45 |
| **25%** | 6.00 | 520.00 | 20.00 | 45.00 | 112.50 | 12.50 | 10.00 | 91.00 |
| **50%** | 6.52 | 845.30 | 24.90 | 60.20 | 175.00 | 25.30 | 15.00 | 117.71 |
| **75%** | 7.00 | 1160.00 | 30.00 | 75.00 | 237.50 | 37.50 | 20.00 | 144.50 |
| **max** | 7.50 | 1499.70 | 35.00 | 90.00 | 300.00 | 50.00 | 25.00 | 207.21 |

**Observations:**
- Dataset contains 10000 rows and 13 columns.
- Missing values were identified in `Irrigation` and `Previous_Crop`.
- Data types were appropriate for processing.
- Numerical features exhibit balanced and symmetric distributions.

---

#### Step 3: Data Cleaning

Missing values were checked using:
```python
df.isnull().sum()
```

Duplicate rows were checked using:
```python
duplicates = df.duplicated().sum()
```

Missing values were handled by mapping to `"Unknown"` to avoid data fabrication:
```python
df["Irrigation"] = df["Irrigation"].fillna("Unknown")
df["Previous_Crop"] = df["Previous_Crop"].fillna("Unknown")
```

**Results:**
- Missing values in `Irrigation` (2538 rows) and `Previous_Crop` (2031 rows) resolved to `"Unknown"`.
- 0 missing values across all columns after cleaning.
- No duplicate records found (0 duplicates).

---

### Data Analysis (Graphs)

#### Graph 1: Distribution of Crop Yield

```python
plt.figure(figsize=(8, 5))
sns.histplot(df['Yield_ton_per_ha'], bins=30, kde=True)
plt.title("Distribution of Crop Yield")
plt.xlabel("Yield (ton per ha)")
plt.ylabel("Frequency")
plt.show()
```

<!-- ========================================================================= -->
<!-- [INSERT IMAGE 1 HERE: artifacts/eda/dataset_b_yield_distribution.png]     -->
<!-- ========================================================================= -->

![Graph 1: Distribution of Crop Yield](file:///c:/Users/user/Downloads/AI-Powered-Crop-Yield-Prediction-and-Agricultural-Productivity-Intelligence-Platform/artifacts/eda/dataset_b_yield_distribution.png)

**Observation:**
- The yield distribution follows a balanced normal distribution.
- Mean (117.89 ton/ha) and median (117.71 ton/ha) are centered.
- Most yield values fall within a consistent range between 50 and 180 ton/ha.

---

#### Graph 2: Correlation Heatmap

```python
plt.figure(figsize=(10, 6))
sns.heatmap(df.corr(numeric_only=True), annot=True, cmap='coolwarm')
plt.title("Correlation Matrix")
plt.show()
```

<!-- ========================================================================= -->
<!-- [INSERT IMAGE 2 HERE: artifacts/eda/dataset_b_correlation.png]            -->
<!-- ========================================================================= -->

![Graph 2: Correlation Heatmap](file:///c:/Users/user/Downloads/AI-Powered-Crop-Yield-Prediction-and-Agricultural-Productivity-Intelligence-Platform/artifacts/eda/dataset_b_correlation.png)

**Observation:**
- The heatmap shows relationships between numerical features.
- Fertilizer and pesticide usage show strong positive correlation with yield.
- Environmental variables (temperature, humidity, pH, rainfall) show low direct linear correlation with yield.

---

#### Graph 3: Yield Distribution by Crop Type

```python
crops = df['Crop'].unique()
data_to_plot = [df[df['Crop'] == crop]['Yield_ton_per_ha'] for crop in crops]
plt.boxplot(data_to_plot, labels=crops, patch_artist=True)
plt.title("Yield Distribution by Crop Type")
plt.xlabel("Crop Type")
plt.ylabel("Yield (ton/ha)")
plt.show()
```

<!-- ========================================================================= -->
<!-- [INSERT IMAGE 3 HERE: artifacts/eda/dataset_b_yield_by_crop.png]          -->
<!-- ========================================================================= -->

![Graph 3: Yield Distribution by Crop Type](file:///c:/Users/user/Downloads/AI-Powered-Crop-Yield-Prediction-and-Agricultural-Productivity-Intelligence-Platform/artifacts/eda/dataset_b_yield_by_crop.png)

**Observation:**
- Compares yield spreads across all 4 crop categories (Rice, Wheat, Maize, Barley).
- The median yield is consistent across crop types, confirming balanced representation.

---

#### Graph 4: Crop Recommendation Target Distribution (Dataset A)

```python
df_rec['Label'].value_counts().head(20).plot(kind='bar')
plt.title("Crop Recommendation - Label Distribution (Top 20 Crops)")
plt.xlabel("Crop Label")
plt.ylabel("Number of Records")
plt.show()
```

<!-- ========================================================================= -->
<!-- [INSERT IMAGE 4 HERE: artifacts/eda/dataset_a_class_distribution.png]     -->
<!-- ========================================================================= -->

![Graph 4: Crop Recommendation Class Distribution](file:///c:/Users/user/Downloads/AI-Powered-Crop-Yield-Prediction-and-Agricultural-Productivity-Intelligence-Platform/artifacts/eda/dataset_a_class_distribution.png)

**Observation:**
- Dataset A contains exactly 100 rows per crop across all 70 unique crop varieties.
- The classification target is perfectly balanced (1.43% per class), eliminating the need for oversampling (SMOTE).

---

### Feature Engineering

#### One-Hot Encoding
Since machine learning models cannot process categorical text data directly, categorical features were converted using one-hot encoding:

```python
X = df.drop("Yield_ton_per_ha", axis=1)
y = df["Yield_ton_per_ha"]

categorical_cols = ["Crop", "Region", "Soil_Type", "Irrigation", "Previous_Crop"]
X_encoded = pd.get_dummies(X, columns=categorical_cols, drop_first=True)
```

The dataset was split into features (X) and target variable (y) before applying encoding.

**Result:**
- Number of features increased from 12 to 22.
- All categorical variables were converted into numerical format.

#### Feature Scaling
Numerical features had different ranges (e.g., rainfall in thousands, pH in single digits). To ensure uniform scaling of numerical features, StandardScaler was applied only to the following columns:

```python
scaler = StandardScaler()
numerical_cols = [
    'Soil_pH', 'Rainfall_mm', 'Temperature_C', 
    'Humidity_pct', 'Fertilizer_Used_kg', 
    'Pesticides_Used_kg', 'Planting_Density'
]

X_encoded[numerical_cols] = scaler.fit_transform(X_encoded[numerical_cols])
print("Final dataset shape after preprocessing:", X_encoded.shape)
```

**After scaling:**
- Numerical features were standardized (mean ~ 0, std ~ 1).
- Dataset shape became (10000, 22).
- No rows were lost during preprocessing.

---

### Challenges Faced
1. Missing categorical values in `Irrigation` and `Previous_Crop` required careful imputation without making unverified assumptions.
2. High rainfall extremes in the recommendation dataset required separating hard physical limits from soft agronomic warnings.
3. Managing potential data leakage regarding pre-season vs. post-harvest chemical inputs.

These were resolved through proper validation rules, explicit `"Unknown"` category mapping, and structured feature separation.

---

### Outcome of Milestone 1
- Dataset was explored and understood.
- No missing or duplicate data after cleaning.
- Categorical features were encoded.
- Numerical features were standardized.
- Important visualizations were generated.
- Final dataset prepared for regression model training.

---

### Conclusion
Milestone 1 successfully completed dataset preparation and preprocessing steps required for machine learning. The data is now clean, structured, encoded, and scaled, making it ready for building regression models in the next milestone.

---

**Submitted by:**  
[Your Name]  
[Your Email]  
