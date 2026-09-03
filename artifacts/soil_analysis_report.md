# Soil Analysis & Edaphic Intelligence Report

## 1. Soil Module Scope & Nutrients Limitation

> [!IMPORTANT]
> **Dataset Limitation Notice on Soil Nutrients (N, P, K)**:
> The current static project datasets (`crop_yield_dataset.csv` and `Crop_Recommendation_Dataset.xlsx`) **do NOT contain Nitrogen (N), Phosphorus (P), or Potassium (K)** measurements. Soil analysis is therefore based on **Soil pH** and **Soil Texture Classification (Clay, Loam, Sandy)**. Soil N/P/K fields are reserved for future live IoT sensor telemetry.

## 2. Soil pH Profiling & Distributions

- **Dataset A (Recommendation)**: pH ranges from 3.5 to 9.94 (Mean: 6.45, Std: 0.67). Accommodates both highly acidic (pH 3.5 for Tea) and alkaline crops.
- **Dataset B (Yield Prediction)**: Soil pH ranges from 5.5 to 7.5 (Mean: 6.52, Std: 0.57), representing standard agricultural arable land.

## 3. Soil Texture Performance (Dataset B)

| Soil Texture | Records | Mean Yield (ton/ha) | Min Yield | Max Yield | Suitable Crops |
|:---|:---:|:---:|:---:|:---:|:---|
| **Clay** | 3284 | 117.3 | 32.88 | 200.7 | Rice, Wheat, Maize, Barley |
| **Loam** | 3388 | 117.9 | 28.45 | 205.19 | Barley, Maize, Rice, Wheat |
| **Sandy** | 3328 | 118.47 | 30.14 | 207.21 | Maize, Barley, Rice, Wheat |

## 4. Soil pH Classification Guide

| pH Range | Classification | Agronomic Guidance | Recommended Crops |
|:---|:---|:---|:---|
| **5.0** | Strongly Acidic | Liming (calcium carbonate) recommended to raise pH for acid-sensitive crops like legumes. | Tea, Potato, Blueberry, Sweet Potato |
| **6.0** | Moderately Acidic | Optimal range for many cereal grains and tubers. Minor lime application optional. | Rice, Maize, Wheat, Soybean, Groundnut |
| **7.0** | Neutral | Ideal agronomic condition for maximum nutrient bioavailability and microbial activity. | Wheat, Barley, Rice, Cotton, Sugarcane, Chickpea |
| **8.0** | Moderately Alkaline | High calcium content. Acid-forming fertilizers (e.g., ammonium sulfate) can help balance. | Barley, Cotton, Sugar Beet, Mustard |
| **9.0** | Strongly Alkaline | Gypsum or organic matter treatment required to lower sodicity and improve drainage. | Barley, Date Palm |
