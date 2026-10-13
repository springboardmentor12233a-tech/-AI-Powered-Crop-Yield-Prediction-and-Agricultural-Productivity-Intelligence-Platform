# Milestone 3 – Dashboard, Reporting and Recommendations

## 1. Objective

The objective of Milestone 3 is to develop a complete, responsive Smart Farming AI platform featuring an interactive Analytics Dashboard, Productivity and Seasonal Reports, an Agricultural Risk Assessment engine, and AI-driven Farming Recommendations backed by the trained Random Forest ML pipeline and Groq LLM integration.

---

## 2. Implemented Features

### Feature 1: Analytics Dashboard
- **Dataset Metrics**: Displays total records (500), average yield (4,032.93 kg/ha), minimum yield (2,054.34 kg/ha), and maximum yield (5,987.45 kg/ha).
- **Interactive Visualizations**:
  - Crop-wise yield comparison (bar chart).
  - Region-wise yield comparison (bar chart).
  - Yield distribution histogram (binned yield frequencies).
  - Irrigation type performance comparison (horizontal bar chart).
- **Backend API**: Powered by `GET /api/dashboard`, aggregating real dataset statistics directly from `datasets/Smart_Farming_Crop_Yield_2024.csv`.

### Feature 2: Productivity and Seasonal Reports
- **Multi-Tab Reporting Interface**:
  - **Summary Table**: Full cross-tabulation of crop and regional performance metrics (sample count, average/min/max yield, environmental averages).
  - **Crop × Region Chart**: Comparative visualization of yields across regions for each crop type.
  - **Sowing Trends**: Monthly distribution of sowing events and average yield per sowing month based on dataset records (`sowing_date`).
  - **Environmental Correlations**: Pearson correlation coefficients between key environmental parameters (soil moisture, pH, temperature, rainfall, humidity, sunlight) and crop yield.
- **Export & Print**:
  - One-click CSV export functionality (`downloadCSV()`).
  - Clean browser print layout stylesheet.
- **Backend API**: Powered by `GET /api/reports`.

### Feature 3: Farming Recommendations
- **AI-Powered Insights**: Integrates Groq LLM (e.g. `llama-3.3-70b-versatile`) via `POST /api/insights` using server-side `GROQ_API_KEY`.
- **Domain Coverage**:
  - Soil management advice based on pH and moisture levels.
  - Irrigation scheduling recommendations based on rainfall, soil moisture, and crop requirements.
  - Crop condition observations and nutrient management strategies.
  - Practical, actionable next steps for farmers.

### Feature 4: Agricultural Risk Assessment
- **Rule-Based & Threshold Analysis**:
  - Evaluates soil moisture stress (waterlogging vs. moisture deficit).
  - Evaluates soil pH compatibility for specific crop varieties.
  - Flags extreme temperature ranges and heat/cold stress.
  - Assesses rainfall inadequacy and water stress.
- **Categorization**: Multi-level risk ratings (`Low`, `Moderate`, `High`) with contextual explanations and recommendations.
- **Backend API**: Integrated into `POST /api/predict` response and standalone `POST /api/risk-assessment`.

### Feature 5: Machine Learning Crop Yield Prediction
- **Pipeline Integration**: Utilizes the trained Random Forest Regressor pipeline saved in `models/best_crop_yield_model.joblib`.
- **Form Inputs**: 9 agricultural features (Crop type, Region, Soil moisture %, Soil pH, Temperature °C, Rainfall mm, Humidity %, Sunlight hours/day, Irrigation type).
- **Validation**: Server-side and client-side bounds checking for agronomic plausibility.
- **Backend API**: Powered by `POST /api/predict`.

---

## 3. Architecture & API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check and API index |
| `GET` | `/api/dashboard` | Dataset analytics, distributions, and averages |
| `POST` | `/api/predict` | ML pipeline crop yield prediction & risk assessment |
| `POST` | `/api/insights` | Groq LLM agricultural insights and advice |
| `POST` | `/api/risk-assessment` | Multi-factor agronomic risk evaluation |
| `GET` | `/api/reports` | Detailed summary tables, correlations, and sowing trends |

---

## 4. Verification and Testing

1. **Backend Endpoint Testing**:
   - `GET /`: Status 200, returns active service status and endpoint directory.
   - `GET /api/dashboard`: Status 200, returns 500 records, statistics, and distributions.
   - `POST /api/predict`: Status 200, successfully predicts yield (e.g., 4,182.43 kg/ha for test input) and evaluates risk.
   - `POST /api/predict` (Invalid Input): Status 400 with detailed validation messages.
   - `POST /api/risk-assessment`: Status 200, correctly identifies 5 high-risk factors for extreme input values.
   - `GET /api/reports`: Status 200, returns 25 summary rows, monthly trends, and environmental correlations.
2. **Frontend UI Testing**:
   - Navigation across Dashboard, Prediction, Reports, and Recommendations tabs.
   - Chart.js interactive rendering without console errors.
   - CSV export and print view functionality.
