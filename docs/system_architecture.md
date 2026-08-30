# YieldSense AI - System Architecture Document

## Overview
**YieldSense AI** is an AI-powered Crop Yield Prediction and Agricultural Productivity Forecasting Platform. The architecture is designed with modularity, scalability, and security to serve farmers, agricultural cooperatives, agribusinesses, and government agencies.

---

## High-Level Architecture Diagram

```mermaid
graph TD
    subgraph Client Layer [Frontend Presentation Layer]
        UI[React + Vite Web Dashboard]
        AuthUI[JWT Login / Register & Role Switcher]
        DataViewer[Tabular Dataset Explorer]
        AnalyticsDashboard[EDA & Yield Analytics Dashboard]
    end

    subgraph API Layer [Backend Service Layer]
        FastAPI[FastAPI Backend Application]
        AuthMiddleware[JWT Auth & RBAC Security Middleware]
        DataAPI[Dataset & Query Router]
        AnalyticsAPI[EDA & Statistics Metrics Router]
    end

    subgraph Data & Pipeline Layer [Data Management]
        PreprocessScript[Automated Data Preprocessor]
        EDAScript[Automated Statistical Visualizer]
        RawDatasets[(Raw Datasets: CSV / Excel)]
        ProcessedDatasets[(Cleaned Datasets & Summary JSON)]
    end

    UI -->|HTTP / JSON REST API| FastAPI
    AuthUI -->|Auth Credentials| AuthMiddleware
    FastAPI --> DataAPI
    FastAPI --> AnalyticsAPI
    DataAPI --> ProcessedDatasets
    AnalyticsAPI --> ProcessedDatasets
    PreprocessScript -->|Ingest & Clean| RawDatasets
    PreprocessScript -->|Export| ProcessedDatasets
    EDAScript -->|Generate Plots| ProcessedDatasets
```

---

## Core Components

### 1. Data Collection & Processing Engine
- **Input Datasets**: `Smart_Farming_Crop_Yield_2024.csv` and `YieldSense_AI_Dataset_Collection.xlsx`.
- **Functions**: Data cleaning, null value imputation, date standardizations, crop duration computation, missing value detection, and statistical summarization.

### 2. Backend REST API (FastAPI)
- **Security**: JWT-based Bearer Token authentication with Role-Based Access Control (RBAC). Roles: `Admin`, `Farmer`, `Agronomist`.
- **Endpoints**:
  - `POST /api/auth/register` & `POST /api/auth/login`: User Authentication.
  - `GET /api/data/records`: Searchable, filterable crop yield data records.
  - `GET /api/data/summary`: Overview statistics (Total farms, average yield, rainfall averages).
  - `GET /api/data/eda`: Statistical distribution metrics and plot configurations.

### 3. Frontend Web Dashboard (React + Vite)
- **Theme**: Modern Dark / Glassmorphism Aesthetic.
- **Features**:
  - Role-based login and session persistence.
  - Live metric card statistics.
  - Searchable and paginated dataset explorer.
  - Interactive EDA chart visualizations (Yield distribution, Crop comparisons, Soil pH impact, Rainfall vs. Yield, Correlation heatmap).
