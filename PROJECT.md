# 🌾 YieldSense AI — Crop Yield Prediction & Agricultural Productivity Intelligence Platform

> An AI-powered platform for predicting crop yields and empowering smarter agricultural decision-making using historical farming data, weather patterns, and soil characteristics.

---

## 📌 Project Overview

**YieldSense AI** is a full-stack machine learning platform that enables farmers, agronomists, and agricultural organizations to forecast crop yields with data-driven precision. By integrating historical crop production records, state-level weather data, and soil metrics, the system trains predictive models to estimate future yields — helping stakeholders plan resources, mitigate risk, and maximize productivity.

| Field              | Details                                              |
|--------------------|------------------------------------------------------|
| **Project Name**   | YieldSense AI                                        |
| **Domain**         | AgriTech / Machine Learning / Data Science           |
| **Target Users**   | Farmers, Agronomists, Agricultural Planners          |
| **Stack**          | Python · Flask · HTML/JS (Vanilla) · Jupyter Notebooks |
| **ML Focus**       | Supervised Regression (Crop Yield Prediction)        |
| **Dataset Period** | 1997–2020 (Indian State-Level Agricultural Data)     |

---

## 🎯 Goals & Objectives

1. **Predict crop yield** (tonnes/hectare) for major Indian crops using ML models.
2. **Identify key yield drivers** — rainfall, temperature, soil type, and cultivated area.
3. **Expose a REST API** via Flask for real-time prediction serving.
4. **Provide a minimal web UI** for users to select a crop and area and get a forecast.
5. **Deliver exploratory analysis** through Jupyter notebooks for data insights.

---

## 🏗️ Project Structure

```
YieldSense-AI/
├── backend/                   # Flask API server
│   └── app.py                 # Main API entry point (routes: /, /api/status)
├── frontend/                  # Web UI
│   └── index.html             # Crop prediction interface (HTML + JS)
├── notebooks/                 # Exploratory & modeling notebooks
│   └── EDA.ipynb              # Exploratory Data Analysis notebook
├── dataset/                   # Raw & processed datasets
│   ├── crop_yield.csv         # Historical crop yield records (~1.4 MB)
│   ├── state_weather_data_1997_2020.csv   # State-level weather data
│   ├── state_soil_data.csv    # Soil characteristics per state
│   └── archive (1)/           # Additional archived datasets
├── models/                    # Serialised ML model artefacts (.pkl / .joblib)
├── report/                    # Project reports & presentations
├── venv/                      # Python virtual environment (not tracked)
├── .gitignore                 # Git exclusion rules
├── PROJECT.md                 # You are here
├── AGENT.md                   # AI agent instructions & context
└── DECISION.md                # Architectural & design decision log
```

---

## 📊 Datasets

| File | Description | Size |
|------|-------------|------|
| `crop_yield.csv` | Primary dataset: crop, state, district, season, area, production, yield | ~1.4 MB |
| `state_weather_data_1997_2020.csv` | Annual rainfall & temperature by state (1997–2020) | ~25 KB |
| `state_soil_data.csv` | Soil type, pH, nitrogen/phosphorus/potassium per state | ~741 B |

> **Note:** The `dataset/` directory is excluded from version control via `.gitignore`. Obtain datasets from the team before running the project locally.

---

## 🌿 Supported Crops (Initial Set)

- Arecanut
- Rice
- Wheat
- Cotton
- Maize

---

## 🔌 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/` | Health check — confirms backend is running |
| `GET` | `/api/status` | Returns project name, status, and active module |
| `POST` | `/api/predict` | Returns predicted crop yield from the trained Random Forest model |
| `POST` | `/api/report` | Returns historical weather averages and soil data for a given state |
| `POST` | `/api/recommend` | Returns a Gemini-generated plain-language farming recommendation |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- pip / virtualenv

### 1. Clone the Repository
```bash
git clone <repository-url>
cd YieldSense-AI
```

### 2. Set Up the Python Environment
```bash
python -m venv venv
venv\Scripts\activate       # Windows
pip install flask flask-cors
```

### 3. Run the Backend
```bash
cd backend
python app.py
# Server starts at http://127.0.0.1:5000
```

### 4. Open the Frontend
Open `frontend/index.html` directly in a browser, or serve it via a local static server.

### 5. Explore the Notebooks
```bash
pip install jupyter pandas numpy matplotlib seaborn scikit-learn
jupyter notebook notebooks/EDA.ipynb
```

---

## 🔮 Roadmap

- [x] Project scaffolding & directory structure
- [x] Flask backend with CORS support
- [x] Minimal web UI with crop/area input
- [x] Exploratory Data Analysis notebook
- [x] Data preprocessing & feature engineering pipeline
- [x] Model training (Random Forest selected over Linear Regression and XGBoost)
- [x] Model serialisation & `/api/predict` endpoint
- [x] Enhanced frontend with real predictions & visualisations
- [ ] Deployment (Docker / cloud hosting)
- [ ] Report & final documentation

---

## 📎 Related Files

- [`AGENT.md`](./AGENT.md) — Instructions for AI agents working on this codebase
- [`DECISION.md`](./DECISION.md) — Log of key architectural and design decisions
