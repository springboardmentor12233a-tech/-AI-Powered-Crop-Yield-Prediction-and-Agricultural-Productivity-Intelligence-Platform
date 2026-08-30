# YieldSense AI - Database Schema Specification

## Overview
This document defines the relational database entity-relationship schema for the YieldSense AI platform. The schema supports user management, farm metadata, sensor telemetry, dataset inventory, and EDA analytical snapshots.

---

## Entity-Relationship Models

### 1. `users` Table
Stores registered platform users with Role-Based Access Control (RBAC).

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | UUID / String | Primary Key | Unique user identifier |
| `username` | String(50) | Unique, Not Null | User login handle |
| `email` | String(100) | Unique, Not Null | Email address |
| `password_hash` | String(255) | Not Null | Bcrypt hashed password |
| `role` | String(20) | Not Null | `Farmer`, `Agronomist`, `Admin` |
| `full_name` | String(100) | Nullable | User display name |
| `created_at` | Timestamp | Default CURRENT_TIMESTAMP | Registration timestamp |

---

### 2. `farms` Table
Stores farm profile metadata and geographical coordinates.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `farm_id` | String(20) | Primary Key | Farm identifier (e.g., `FARM0001`) |
| `region` | String(50) | Not Null | Geographical region (e.g., `North India`) |
| `latitude` | Float | Not Null | Farm latitude coordinate |
| `longitude` | Float | Not Null | Farm longitude coordinate |
| `owner_user_id` | UUID / String | Foreign Key (`users.user_id`) | Associated farmer/owner |

---

### 3. `crop_yield_records` Table
Stores historical and real-time crop yield telemetry, weather data, and soil metrics.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `record_id` | Integer | Primary Key, Auto Increment | Unique record ID |
| `farm_id` | String(20) | Foreign Key (`farms.farm_id`) | Reference to farm |
| `crop_type` | String(50) | Not Null | Crop name (e.g., `Wheat`, `Rice`) |
| `soil_moisture_pct` | Float | Not Null | Soil moisture percentage |
| `soil_pH` | Float | Not Null | Soil pH value |
| `temperature_C` | Float | Not Null | Temperature in Celsius |
| `rainfall_mm` | Float | Not Null | Annual/Seasonal rainfall in mm |
| `humidity_pct` | Float | Not Null | Humidity percentage |
| `sunlight_hours` | Float | Not Null | Daily sunlight hours |
| `irrigation_type` | String(50) | Not Null | `Drip`, `Sprinkler`, `Manual`, `None` |
| `fertilizer_type` | String(50) | Not Null | `Organic`, `Inorganic`, `Mixed` |
| `pesticide_usage_ml`| Float | Not Null | Pesticide usage in mL |
| `sowing_date` | Date | Not Null | Sowing date |
| `harvest_date` | Date | Not Null | Harvest date |
| `total_days` | Integer | Calculated | Growing duration in days |
| `yield_kg_per_hectare`| Float | Not Null | Measured crop yield (kg/ha) |
| `sensor_id` | String(20) | Not Null | Associated IoT sensor ID |
| `timestamp` | Timestamp | Not Null | Telemetry measurement timestamp |
| `ndvi_index` | Float | Not Null | Normalized Difference Vegetation Index (0 to 1) |
| `crop_disease_status`| String(50) | Not Null | `None`, `Mild`, `Moderate`, `Severe` |

---

### 4. `eda_summary_snapshots` Table
Stores pre-calculated statistical summaries for fast dashboard rendering.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `snapshot_id` | Integer | Primary Key | Snapshot identifier |
| `generated_at` | Timestamp | Default CURRENT_TIMESTAMP | Calculation timestamp |
| `total_records` | Integer | Not Null | Total dataset rows |
| `avg_yield` | Float | Not Null | Overall average yield |
| `avg_rainfall` | Float | Not Null | Overall average rainfall |
| `avg_ndvi` | Float | Not Null | Overall average NDVI index |
| `metrics_json` | JSON | Not Null | Full breakdown by crop & region |
