# YieldSense AI - UI Layout & Wireframe Specification

## Overview
The YieldSense AI platform interface is designed with a modern, high-contrast Dark / Glassmorphism aesthetic tailored for agricultural intelligence. The interface provides intuitive navigation across authentication, raw dataset inspection, and real-time EDA visual analytics.

---

## Screen Layouts & Wireframe Specs

### 1. Authentication & Role Switcher Screen (`/login`)
- **Layout**: Centered glassmorphic card with subtle agricultural gradients.
- **Elements**:
  - Role selection pill toggle (`Farmer`, `Agronomist`, `Admin`).
  - Username / Email input field.
  - Password input field.
  - Quick test credential autofill buttons (`Demo Farmer`, `Demo Agronomist`, `Demo Admin`).
  - Login action button.

### 2. Main Navigation Shell (`/dashboard`)
- **Header**:
  - Platform Title (`YieldSense AI`).
  - User Status Badge (Role & Username).
  - Navigation Tabs (`KPI Overview`, `Dataset Explorer`, `EDA Visual Analytics`, `System Architecture`).
  - Dark Mode & Refresh status toggle.

### 3. KPI Metrics Overview Tab
- **Grid Layout**: 4 Stat Cards across the top:
  - **Total Farms Monitored**: Active count & sensor coverage.
  - **Average Crop Yield**: In kg/hectare with trend indicator.
  - **Avg Seasonal Rainfall**: Measured in mm.
  - **Soil Health Index (NDVI)**: Vegetation health score (0.0 to 1.0).

### 4. Tabular Dataset Explorer Tab
- **Features**:
  - Search bar (Filter by Farm ID, Region, Crop Type, Disease Status).
  - Categorical filters (Crop type dropdown, Region dropdown).
  - Paginated table showing:
    - Farm ID, Region, Crop Type
    - Soil Moisture %, Soil pH, Temp (°C), Rainfall (mm)
    - Sowing Date, Harvest Date, Duration (Days)
    - Yield (kg/ha), NDVI Index, Crop Disease Status
  - Dataset Download / Export CSV action.

### 5. EDA & Visual Analytics Tab
- **Visual Grid**:
  - **Chart 1 (Distribution)**: Crop Yield Histogram & KDE curve.
  - **Chart 2 (Comparative)**: Yield by Crop Type Box Plot (Rice, Wheat, Maize, Soybean, Cotton).
  - **Chart 3 (Weather Impact)**: Scatter Plot of Rainfall vs. Yield with regression trendline.
  - **Chart 4 (Soil Quality)**: Soil pH vs. Crop Productivity curve.
  - **Chart 5 (Feature Correlation)**: Multi-feature correlation matrix heatmap.
