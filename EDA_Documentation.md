# Exploratory Data Analysis (EDA) Documentation
## AI AgriYield Predictor – Milestone 1 Exploratory Intelligence

**Project Title:** AI-Based Crop Yield Prediction Using Soil and Weather Parameters  
**Author:** Maheshbharathi  
**Dataset Size:** 1,500 Records $\times$ 12 Attributes  
**Primary Target:** `Yield_kg_per_acre` (Continuous Numerical)  

---

## 1. Executive Summary & Objective

The primary objective of this Exploratory Data Analysis (EDA) is to uncover the underlying statistical properties, distribution patterns, collinearity structures, and non-linear interactions within the agricultural dataset before training machine learning regression models.

---

## 2. Dataset Statistical Profile

### 2.1 Ingestion & Dimensions
- **Total Samples:** 1,500 field records
- **Total Features:** 12 (4 Categorical Descriptors + 7 Continuous Numerical Predictors + 1 Target Variable)
- **Missing Value Count:** 0 (100% complete)
- **Duplicate Records:** 0 (100% distinct)

### 2.2 Summary Statistics Table

| Attribute | Mean | Std Dev | Min | 25% | 50% (Median) | 75% | Max | Domain Role |
|---|---|---|---|---|---|---|---|---|
| **Nitrogen ($N$)** | 75.21 | 37.66 | 10.00 | 43.00 | 77.00 | 108.00 | 139.00 | Soil Nutrient (kg/ha) |
| **Phosphorus ($P$)** | 62.74 | 33.56 | 5.00 | 33.00 | 63.00 | 92.00 | 119.00 | Soil Nutrient (kg/ha) |
| **Potassium ($K$)** | 104.88 | 54.89 | 10.00 | 58.00 | 104.00 | 151.00 | 199.00 | Soil Nutrient (kg/ha) |
| **Rainfall (mm)** | 175.40 | 72.19 | 50.00 | 114.00 | 175.00 | 237.00 | 299.00 | Precipitation Input |
| **Temperature (°C)**| 28.08 | 5.76 | 18.02 | 23.10 | 28.39 | 33.10 | 37.96 | Thermal Climate |
| **Soil pH** | 6.77 | 0.72 | 5.50 | 6.15 | 6.77 | 7.39 | 8.00 | Acidity/Alkalinity |
| **Year** | 2011.96 | 7.34 | 2000 | 2006 | 2012 | 2018 | 2024 | Temporal Horizon |
| **`Yield_kg_per_acre`** | **7,881.89** | **20,073.33** | **502.00** | **1,202.75** | **1,673.50** | **2,571.75** | **89,946.00** | **Target Output** |

---

## 3. EDA Visual Outputs & Statistical Interpretations

### Output 1: Crop Yield Distribution (Raw vs Log-Transformed)

![Crop Yield Distribution](outputs/visualizations/01_yield_distribution.png)

#### Python Implementation:
```python
fig, axes = plt.subplots(1, 2, figsize=(14, 5), dpi=300)

# Raw scale
sns.histplot(df['Yield_kg_per_acre'], bins=30, kde=True, ax=axes[0], color='#2E7D32')
axes[0].set_title("Distribution of Crop Yield (Raw Scale)", fontweight='bold')
axes[0].set_xlabel("Yield (kg per acre)")
axes[0].set_ylabel("Frequency")

# Log-transformed scale
sns.histplot(np.log1p(df['Yield_kg_per_acre']), bins=30, kde=True, ax=axes[1], color='#00838F')
axes[1].set_title("Log-Transformed Crop Yield Distribution", fontweight='bold')
axes[1].set_xlabel("Log(Yield + 1)")
axes[1].set_ylabel("Density")

plt.tight_layout()
plt.show()
```

#### Analytical Insights:
- **Skewness Profile:** The raw target variable demonstrates positive (right) skewness due to the biological nature of different crop classes.
- **Biomass Bimodality:** Field crops (Rice, Wheat, Maize, Cotton, Soybean, Groundnut) produce grain yields between **1,000 to 4,500 kg/acre**, whereas high-biomass commercial stalk crops like Sugarcane yield up to **50,000 to 89,000+ kg/acre**.
- **Transformation Benefit:** The log-transformed density profile approximates normality, confirming the suitability of standardized gradient-based regression models.

---

### Output 2: Numerical Feature Correlation Matrix

![Correlation Heatmap](outputs/visualizations/02_correlation_heatmap.png)

#### Python Implementation:
```python
plt.figure(figsize=(10, 6), dpi=300)
corr = df.corr(numeric_only=True)
sns.heatmap(corr, annot=True, fmt=".3f", cmap='coolwarm', cbar=True, square=True)
plt.title("Correlation Matrix of Numerical Features", fontweight='bold')
plt.tight_layout()
plt.show()
```

#### Analytical Insights:
- **Zero Harmful Multicollinearity:** Pairwise correlation across input predictors remains minimal ($|r| < 0.15$), preventing coefficient instability and variance inflation during linear regression.
- **Yield Drivers:** Soil Nitrogen ($N$) and seasonal rainfall (precipitation) demonstrate positive associations with crop productivity.

---

### Output 3: Crop Yield Variation Across Crop Varieties

![Crop Yield by Crop Variety](outputs/visualizations/03_crop_type_yield_comparison.png)

#### Python Implementation:
```python
plt.figure(figsize=(11, 5.5), dpi=300)
order = df.groupby('Crop')['Yield_kg_per_acre'].median().sort_values(ascending=False).index
sns.boxplot(data=df, x='Crop', y='Yield_kg_per_acre', order=order, hue='Crop', palette='mako', legend=False)
plt.title("Crop Yield by Crop Variety (Log Scale)", fontweight='bold')
plt.yscale('log')
plt.xticks(rotation=25)
plt.tight_layout()
plt.show()
```

#### Analytical Insights:
- **Baseline Grouping:** Crop type is the single most dominant categorical predictor defining baseline yield magnitude.
- **Productivity Ranking:**
  1. *Sugarcane:* 50,000 – 89,000 kg/acre
  2. *Rice:* 2,200 – 4,800 kg/acre
  3. *Wheat:* 1,800 – 4,200 kg/acre
  4. *Maize:* 1,500 – 3,800 kg/acre
  5. *Barley:* 1,400 – 3,200 kg/acre
  6. *Soybean:* 1,100 – 2,600 kg/acre
  7. *Groundnut:* 900 – 2,200 kg/acre
  8. *Cotton:* 700 – 1,800 kg/acre
  9. *Millets / Pulses:* 500 – 1,900 kg/acre

---

### Output 4: Soil Nutrient Levels (N, P, K) Distribution Profiles

![Soil Nutrients Analysis](outputs/visualizations/04_soil_nutrients_npk_analysis.png)

#### Analytical Insights:
- **Nutrient Dispersion:** Nitrogen, Phosphorus, and Potassium nutrient ranges cover the entire agricultural spectrum (low, moderate, and high fertility parcels).
- **Fertility Impact:** High Nitrogen levels correlate with elevated vegetative biomass across cereal crops.

---

### Output 5: Climatic Interactions (Rainfall & Temperature vs Yield)

![Climate Factors Analysis](outputs/visualizations/05_climate_factors_rainfall_temp.png)

#### Analytical Insights:
- **Precipitation Regimes:** Enhanced rainfall levels ($150\text{ mm} - 280\text{ mm}$) strongly promote higher yield output in water-intensive crops like Rice and Sugarcane.
- **Thermal Windows:** Moderate ambient temperatures ($22^\circ\text{C} - 32^\circ\text{C}$) represent the optimal physiological thermal window for cereal and grain crops.

---

## 4. Feature Preprocessing Summary

```
Input: 1,500 Rows × 12 Columns
  ├── Drop Target ('Yield_kg_per_acre') ➔ (1500, 11)
  ├── One-Hot Encode ('State', 'Crop', 'Soil_Type', 'Fertilizer') [drop_first=True] ➔ (1500, 39)
  └── StandardScaler ('N', 'P', 'K', 'Rainfall_mm', 'Temperature_C', 'Soil_pH', 'Year') ➔ μ=0, σ=1
Output: Scaled Feature Matrix (1500, 39) Ready for Milestone 2 Model Training
```

---

**Author:** Maheshbharathi  
**Project:** AI AgriYield Predictor  
**Program:** Infosys Springboard Virtual Internship  
