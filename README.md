# YieldSense AI: Crop Yield Prediction & Agricultural Productivity Intelligence Platform

> **Milestone 1 Deliverable**: Project Initialization, System Architecture, Database Schema, Data Preprocessing Pipeline, Exploratory Data Analysis (EDA), FastAPI Backend, and React Glassmorphism Dashboard.

---

## 🌟 Overview & Objectives
**YieldSense AI** is an AI-powered agricultural intelligence platform designed to help farmers, agronomists, and agricultural organizations forecast crop yields, analyze weather and soil conditions, and optimize resource usage.

### Milestone 1 AchievementS
1. **System Architecture & Database Design**: Authored system component specifications (`docs/system_architecture.md`), ER database schema (`docs/database_schema.md`), and UI wireframe designs (`docs/ui_layout.md`).
2. **Dataset Collection & Management**: Ingested and structured `Smart_Farming_Crop_Yield_2024.csv` and `YieldSense_AI_Dataset_Collection.xlsx` into `datasets/raw/`.
3. **Automated Data Preprocessing Pipeline**: Built `scripts/preprocess_data.py` to clean missing values, normalize date attributes, calculate crop growing duration (`total_days`), and export `datasets/processed/cleaned_crop_yield.csv` alongside `docs/dataset_quality_report.md`.
4. **Exploratory Data Analysis (EDA)**: Created `scripts/run_eda.py` generating 5 statistical visualization charts saved to `eda_plots/` and `datasets/processed/eda_summary_metrics.json`.
5. **FastAPI Backend Service**: REST API (`backend/app/main.py`) with JWT authentication, role-based access control (RBAC), data query endpoints, and EDA metric routes.
6. **React + Vite Glassmorphism Dashboard**: Interactive Web Application (`frontend/`) featuring KPI metric cards, searchable data table, EDA visual analytics dashboard, and authentication role switcher.

---

## 📁 Repository Directory Layout

```text
c:\INFOSYS 7.0\
├── README.md                        # Root Project Guide & Milestone 1 Summary
├── requirements.txt                 # Frozen Python Backend & Data Science Dependencies
├── .gitignore                       # Git ignore configuration
├── docs/                            # Architectural & System Documentation
│   ├── system_architecture.md       # Component Diagram & API Specifications
│   ├── database_schema.md           # ER Diagrams & Schema Entity Descriptions
│   ├── ui_layout.md                 # Dashboard Layout Wireframe Specs
│   └── dataset_quality_report.md    # Preprocessing Data Audit Report
├── datasets/                        # Data Management Directory
│   ├── raw/
│   │   ├── Smart_Farming_Crop_Yield_2024.csv
│   │   └── YieldSense_AI_Dataset_Collection.xlsx
│   └── processed/
│       ├── cleaned_crop_yield.csv   # Sanitized Clean Dataset
│       └── eda_summary_metrics.json # Calculated EDA Statistics
├── backend/                         # FastAPI Backend REST API
│   ├── app/
│   │   ├── main.py                  # Server Entrypoint
│   │   ├── core/
│   │   │   ├── config.py            # Platform Configuration
│   │   │   └── security.py          # JWT Auth & Security
│   │   └── api/
│   │       ├── auth.py              # Login & Registration API
│   │       ├── data.py              # Data Query & Search API
│   │       └── analytics.py         # EDA Metrics & Plot Routes
├── frontend/                        # React + Vite Web Application
│   ├── package.json
│   ├── src/
│   │   ├── App.tsx                  # Main Dashboard Container
│   │   ├── components/              # Header, MetricCards, DataExplorer, EdaDashboard
│   │   └── styles/index.css         # Custom Glassmorphism Theme System
├── scripts/                         # Automated Processing Scripts
│   ├── preprocess_data.py           # Data Cleaning Executable
│   └── run_eda.py                   # Plot Generation & Stats Executable
└── eda_plots/                       # Exported High-Resolution Charts (.png)
    ├── yield_distribution.png
    ├── yield_by_crop.png
    ├── rainfall_vs_yield.png
    ├── soil_pH_vs_yield.png
    └── correlation_heatmap.png
```

---

## ⚙️ Quickstart & Setup Guide

### 1. Python Virtual Environment & Dependencies
```bash
# Activate virtual environment
.\.venv\Scripts\activate

# Install dependencies if needed
pip install -r requirements.txt
```

### 2. Run Data Preprocessing & EDA Scripts
```bash
# Run Data Preprocessing Pipeline
python scripts/preprocess_data.py

# Run Exploratory Data Analysis & Plot Generation
python scripts/run_eda.py
```

### 3. Launch Backend API Server
```bash
python -m uvicorn backend.app.main:app --reload --port 8000
```
- **API Documentation**: Open `http://localhost:8000/docs` (Swagger UI)
- **Health Check**: `http://localhost:8000/api/health`

### 4. Launch Frontend Web Application
```bash
cd frontend
npm run dev
```
- Open `http://localhost:5173` in your browser.

---

## 📊 Key Milestone 1 Statistics & Data Insights
- **Total Records Analyzed**: 500 farms across 4 regions (`North India`, `South USA`, `Central USA`, `East Africa`).
- **Crops Monitored**: Rice, Wheat, Maize, Soybean, Cotton.
- **Average Crop Yield**: 4,312.45 kg/hectare.
- **Average Seasonal Rainfall**: 178.62 mm.
- **Average Vegetation Health (NDVI)**: 0.61.
- **Data Quality Integrity**: 0 missing values remaining after automated median & category imputation.

---

## 👤 Author & Branch Information
- **Branch**: `DURGA-PRASAD-A`
- **Repository**: `springboardmentor12233a-tech/-AI-Powered-Crop-Yield-Prediction-and-Agricultural-Productivity-Intelligence-Platform`
