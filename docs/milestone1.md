# Milestone 1 – Project Foundation

## Overview

Milestone 1 focuses on setting up the basic foundation of the **YieldSenseAI** project.

This milestone includes dataset understanding and preparation, exploratory data analysis, feature engineering, PostgreSQL database setup, FastAPI backend integration, and user authentication.

---

## Objectives

The main objectives of Milestone 1 were:

- Understand and prepare the agricultural dataset.
- Perform Exploratory Data Analysis (EDA).
- Identify numerical and categorical features.
- Apply One-Hot Encoding to categorical features.
- Set up the PostgreSQL database.
- Connect the FastAPI backend with PostgreSQL.
- Implement authentication and role-based authorization.

---

## 1. Dataset Preparation

The initial agricultural dataset contains **400 records** with crop, soil, weather and farming-related information.

### Numerical Features

- `soil_moisture_%`
- `soil_pH`
- `temperature_C`
- `rainfall_mm`
- `humidity_%`
- `sunlight_hours`
- `pesticide_usage_ml`
- `total_days`
- `latitude`
- `longitude`
- `NDVI_index`
- `sowing_month`
- `sowing_day`
- `observation_month`
- `observation_day`
- `days_since_sowing`
- `crop_cycle_progress`

### Categorical Features

- `region`
- `crop_type`
- `irrigation_type`
- `fertilizer_type`
- `crop_disease_status`

### Target Variable

```text
yield_kg_per_hectare