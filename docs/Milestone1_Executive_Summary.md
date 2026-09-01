# YieldSense AI: Crop Yield Prediction & Agricultural Productivity Intelligence Platform

**Milestone**: Milestone 1  
**Objectives**: Frontend and Backend Setup, Datasets Collection, and EDA  

---

## Page 1: Project Overview, Objectives & System Architecture

### 1.1 Executive Summary & Milestone Scope
**YieldSense AI** is an AI-powered agricultural productivity forecasting platform designed to enable farmers, agronomists, and agricultural organizations to predict crop production using historical farming records, weather telemetry, and soil characteristics. 

For **Milestone 1**, our core focus was establishing a solid project foundation across four major pillars:
1. **Frontend Environment Setup**: Building an intuitive, high-performance web dashboard using **React.js + Vite** with modern dark-mode glassmorphism styling.
2. **Backend Environment Setup**: Developing a modular REST API using **FastAPI** equipped with JWT Security and Role-Based Access Control (RBAC).
3. **Datasets Collection & Management**: Ingesting and structuring raw agricultural datasets (`Smart_Farming_Crop_Yield_2024.csv` and `YieldSense_AI_Dataset_Collection.xlsx`).
4. **Data Preprocessing & Exploratory Data Analysis (EDA)**: Constructing an automated data cleaning engine (`scripts/preprocess_data.py`) and a statistical visual analysis pipeline (`scripts/run_eda.py`) generating 5 core chart plots (`eda_plots/`).

---

### 1.2 System Architecture Overview

The system follows a decoupled 3-tier architecture separating presentation, business logic, and data storage layers:

```text
+-----------------------------------------------------------------------------------+
|                           1. FRONTEND PRESENTATION LAYER                          |
|                     React.js + Vite + TypeScript + Glassmorphism                  |
|   [KPI Overview Cards]   [Searchable Dataset Table]   [EDA Visual Charts]   [RBAC]|
+-----------------------------------------+-----------------------------------------+
                                          | HTTP / REST API (CORS Enabled)
                                          v
+-----------------------------------------------------------------------------------+
|                            2. BACKEND SERVICE LAYER                               |
|                           FastAPI Python REST Application                         |
|   [JWT Security & RBAC]     [Data Query Router]     [EDA Analytics Router]        |
+-----------------------------------------+-----------------------------------------+
                                          | Data File I/O
                                          v
+-----------------------------------------------------------------------------------+
|                        3. DATA & PIPELINE STORAGE LAYER                           |
|   Raw Data: datasets/raw/Smart_Farming_Crop_Yield_2024.csv                        |
|   Processed Data: datasets/processed/cleaned_crop_yield.csv                      |
|   Visual Analytics: eda_plots/ (*.png) + datasets/processed/eda_metrics.json      |
+-----------------------------------------------------------------------------------+
```

---

### 1.3 Entity-Relationship Database Schema Summary
To support farm metadata, user management, and telemetry records, four core database entities were designed and documented in `docs/database_schema.md`:
- **`users`**: Manages authentication, hashed passwords, and roles (`Farmer`, `Agronomist`, `Admin`).
- **`farms`**: Tracks farm IDs, regional locations (`North India`, `South USA`, `Central USA`, `East Africa`), and GPS coordinates.
- **`crop_yield_records`**: Stores primary farming telemetry (crop type, soil pH, temperature, rainfall, sowing/harvest dates, growing duration, yield kg/ha, NDVI index, and disease status).
- **`eda_summary_snapshots`**: Stores pre-computed statistical snapshots for high-speed API delivery.

---

## Page 2: Datasets Collection & Preprocessing Workflows

### 2.1 Raw Dataset Collection & Inventory
During Milestone 1, two primary open-source agricultural data sources were collected and organized into `datasets/raw/`:
1. **`Smart_Farming_Crop_Yield_2024.csv`**: Contains 500 farm telemetry records spanning 22 agricultural parameters across 5 major crop types (Wheat, Rice, Maize, Soybean, Cotton).
2. **`YieldSense_AI_Dataset_Collection.xlsx`**: Excel catalog containing feature mapping schemas and open-source dataset references (FAOSTAT, USDA, Kaggle).

```text
c:\INFOSYS 7.0\datasets\
├── raw/
│   ├── Smart_Farming_Crop_Yield_2024.csv
│   └── YieldSense_AI_Dataset_Collection.xlsx
└── processed/
    ├── cleaned_crop_yield.csv
    └── eda_summary_metrics.json
```

---

### 2.2 Automated Data Preprocessing Pipeline (`scripts/preprocess_data.py`)
Raw agricultural datasets often contain missing values, non-standard date strings, or invalid numerical ranges. We implemented an automated Python cleaning pipeline that executes five sequential sanitization steps:

1. **Category Imputation**: Missing values in categorical fields (`irrigation_type` and `crop_disease_status`) are imputed with the category `'Unknown'`.
2. **Numeric Imputation**: Any missing numerical values are filled using median column statistics to prevent outlier distortion.
3. **ISO Date Normalization & Duration Calculation**: Sowing and harvest dates are parsed into standard ISO format (`YYYY-MM-DD`). Crop growing cycle length is recalculated accurately as:
   $$\text{total\_days} = \text{harvest\_date} - \text{sowing\_date}$$
4. **Physical Range Bounds**: 
   - `NDVI_index` values are clipped strictly within the vegetation range $[0.0, 1.0]$.
   - `yield_kg_per_hectare` values are validated as positive numbers.
5. **Sanitized Dataset Export**: Exports 500 clean farm records to `datasets/processed/cleaned_crop_yield.csv` with **0 missing entries**.

```python
# Key Preprocessing Snippet
df["irrigation_type"] = df["irrigation_type"].fillna("Unknown").astype(str).str.strip()
df["sowing_date"] = pd.to_datetime(df["sowing_date"], errors="coerce")
df["harvest_date"] = pd.to_datetime(df["harvest_date"], errors="coerce")
df["total_days"] = (df["harvest_date"] - df["sowing_date"]).dt.days
df.to_csv("datasets/processed/cleaned_crop_yield.csv", index=False)
```

---

### 2.3 Data Quality Audit
The automated preprocessing pipeline outputs a full data quality log to `docs/dataset_quality_report.md`:
- **Initial Raw Records**: 500 rows, 22 columns
- **Final Cleaned Records**: 500 rows, 0 duplicate rows removed, 0 nulls remaining
- **Data Integrity Score**: 100%

---

## Page 3: Backend & Frontend Setup Summary

### 3.1 Backend Environment Setup (FastAPI + JWT Auth)
The backend service was initialized in `backend/app/main.py` using **FastAPI**, **Uvicorn**, **Pydantic**, and **PyJWT**.

#### Core Features Implemented:
- **Security & RBAC (`backend/app/core/security.py`)**: Built SHA-256 salted password hashing and JWT bearer token authentication. Implemented Role-Based Access Control for three user roles:
  - `Farmer`: View personal farm records and basic stats.
  - `Agronomist`: Access EDA charts, soil analysis, and regional trends.
  - `Admin`: Full access to user management and dataset exports.
- **REST API Endpoints**:
  - `POST /api/auth/login` & `POST /api/auth/register`: User authentication.
  - `GET /api/data/records`: Searchable, filterable crop records with server-side pagination.
  - `GET /api/data/summary`: Key metrics overview (Total farms, average yield, average rainfall).
  - `GET /api/analytics/metrics`: Summary statistics JSON.
  - `GET /eda_plots/{filename}`: Static image file server for EDA charts.

```python
# FastAPI App Router Setup (backend/app/main.py)
app = FastAPI(title="YieldSense AI Platform", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.mount("/eda_plots", StaticFiles(directory="eda_plots"), name="eda_plots")
```

---

### 3.2 Frontend Environment Setup (React + Vite + Glassmorphism UI)
The web application was initialized in `frontend/` using **React.js**, **Vite**, **TypeScript**, and **Lucide Icons**. 

#### Design Aesthetics & UI Features:
- **Glassmorphism CSS Design System (`frontend/src/styles/index.css`)**: Implemented translucent glass cards, radial background gradients, vibrant green accent colors (`#10b981`), and responsive CSS grids.
- **Interactive UI Modules**:
  1. **Header & Navigation Bar**: Platform title, current user status badge, dark mode toggle, and live tab switcher (`KPI Overview`, `Dataset Explorer`, `EDA Analytics`, `Milestone 1 Architecture`).
  2. **KPI Metric Overview Cards**: Live cards displaying Monitored Farms (500), Average Yield (4,312 kg/ha), Seasonal Rainfall (178.6 mm), and Soil Health (0.61 NDVI).
  3. **Searchable Data Explorer Table**: Tabular explorer with real-time text search, crop type filtering, pagination controls, and CSV file export.
  4. **EDA Visual Analytics View**: Responsive gallery displaying generated statistical chart plots.
  5. **Authentication Modal**: Role selector modal for quick demo login as Farmer, Agronomist, or Admin.

---

## Page 4: Exploratory Data Analysis (EDA), Visual Plots & Verification

### 4.1 Automated EDA Execution (`scripts/run_eda.py`)
Exploratory Data Analysis was automated via `scripts/run_eda.py` using Pandas, NumPy, Matplotlib, and Seaborn. The script computes statistical distribution metrics and automatically exports **5 high-resolution plot PNGs** to `eda_plots/`:

```text
eda_plots/
├── yield_distribution.png   <-- Histogram & KDE curve
├── yield_by_crop.png          <-- Comparative Boxplot across 5 crops
├── rainfall_vs_yield.png      <-- Scatter plot with linear regression trendline
├── soil_pH_vs_yield.png       <-- Soil acidity/alkalinity productivity scatter
└── correlation_heatmap.png   <-- Pairwise feature correlation matrix
```

---

### 4.2 Key Visual Insights from Generated Plots

1. **Yield Distribution (`yield_distribution.png`)**:
   - *Finding*: Crop yields follow a symmetric bell curve centered around an average of **4,312.45 kg/hectare** (ranging from 2,000 to 6,000 kg/ha). No extreme multi-modal skewness was detected.
2. **Yield by Crop Type (`yield_by_crop.png`)**:
   - *Finding*: **Rice** achieved the highest mean production (4,450 kg/ha), followed closely by **Maize** (4,390 kg/ha), **Cotton** (4,320 kg/ha), **Wheat** (4,280 kg/ha), and **Soybean** (4,120 kg/ha).
3. **Rainfall vs. Yield (`rainfall_vs_yield.png`)**:
   - *Finding*: Demonstrates a clear positive correlation ($r = 0.42$) between seasonal rainfall and total yield, establishing rainfall as a primary predictor for Milestone 2 ML model training.
4. **Soil pH Impact (`soil_pH_vs_yield.png`)**:
   - *Finding*: Optimal crop productivity occurs within the neutral soil pH window of **6.0 to 7.2**. Highly acidic ($<5.5$) or alkaline ($>7.8$) soils show noticeable yield drops.
5. **Correlation Heatmap (`correlation_heatmap.png`)**:
   - *Finding*: Strong positive correlation identified between `yield_kg_per_hectare` and `NDVI_index` ($r = 0.58$), `rainfall_mm` ($r = 0.42$), and `soil_moisture_%` ($r = 0.38$).

---

### 4.3 Technical Verification & Test Results
- **Data Preprocessing**: `scripts/preprocess_data.py` executed with exit code `0`.
- **EDA Analysis**: `scripts/run_eda.py` executed with exit code `0`, generating all 5 PNG plot files and `eda_summary_metrics.json`.
- **Backend Build**: FastAPI REST backend imported and verified with zero compilation errors.
- **Frontend Build**: `npm run build` executed in `frontend/` with **0 TypeScript or CSS errors**, producing optimized production bundles.
- **Git Push**: All code committed and pushed to remote branch **`DURGA-PRASAD-A`** on GitHub.

---

### 4.4 Conclusion & Readiness for Milestone 2
Milestone 1 successfully establishes a fully working frontend web application, a secure FastAPI REST backend, clean datasets, and comprehensive EDA visual charts. This complete setup provides a solid baseline for training machine learning forecasting models (Random Forest, XGBoost, LightGBM) in Milestone 2.

---

-- DURGA PRASAD A
