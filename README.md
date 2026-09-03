# 🌱 AI AgriYield Predictor
## AI-Based Crop Yield Prediction Using Soil and Weather Parameters

**Author:** Maheshbharathi  
**Program:** Infosys Springboard Virtual Internship  
**Domain:** Artificial Intelligence, Machine Learning & Precision Agriculture  

---

## 📌 Project Overview
**AI AgriYield Predictor** is an AI-driven predictive intelligence system designed to accurately forecast crop yield (measured in **kg per acre**) using chemical soil nutrient levels ($N, P, K$, pH), climatic parameters (Rainfall, Temperature), fertilizer inputs, and regional agricultural factors.

---

## 📁 Repository Structure

```text
├── dataset/
│   ├── dataset.csv                    # Primary dataset (1,500 records x 12 features)
│   ├── crop_yield_dataset.csv         # Standalone copy of raw data
│   └── preprocessed_crop_yield.csv    # Final scaled and encoded dataset (1,500 x 39)
├── notebook/
│   ├── Milestone_1_Data_Preparation_and_EDA.ipynb  # Interactive Jupyter Notebook for Milestone 1
│   └── milestone_1_pipeline.py                     # Standalone Python pipeline script
├── outputs/
│   ├── visualizations/                             # High-resolution statistical plots
│   │   ├── 01_yield_distribution.png
│   │   ├── 02_correlation_heatmap.png
│   │   ├── 03_crop_type_yield_comparison.png
│   │   ├── 04_soil_nutrients_npk_analysis.png
│   │   └── 05_climate_factors_rainfall_temp.png
├── scripts/
│   ├── generate_and_process_milestone1.py          # Data generation and verification
│   └── build_notebook.py                           # Automated notebook generator
├── Milestone_1_Documentation.md                    # Official Milestone 1 Submission Report
├── requirements.txt                                # Project dependencies
└── README.md                                       # Project overview & documentation
```

---

## 🚀 Milestone 1 Execution Summary

| Stage | Key Operations | Outcome / Shape |
|---|---|---|
| **1. Data Ingestion** | Ingest raw dataset with 11 predictors + 1 target | 1,500 rows × 12 columns |
| **2. Data Cleaning** | Audited null values & duplicates | 0 missing, 0 duplicates |
| **3. Exploratory Data Analysis** | Target skewness, feature correlation, crop baseline comparisons | 5 publication-quality visualizations |
| **4. Feature Encoding** | One-Hot Dummy Encoding (`drop_first=True`) | Categorical columns expanded to 32 dummies |
| **5. Feature Scaling** | `StandardScaler` on 7 continuous features | Zero mean ($\mu=0$), Unit std ($\sigma=1$) |
| **6. Final Matrix** | Consolidate preprocessed dataset | **`(1500, 39)` matrix ready for ML** |

---

## 🛠️ How to Run

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the Milestone 1 Pipeline
```bash
python notebook/milestone_1_pipeline.py
```

### 3. Launch Interactive Jupyter Notebook
```bash
jupyter notebook notebook/Milestone_1_Data_Preparation_and_EDA.ipynb
```

---

## 👤 Author
**Maheshbharathi**  
AI & Data Science | Infosys Springboard Virtual Internship
