# YieldSense AI — AI-Powered Crop Yield Prediction & Agricultural Productivity Intelligence Platform

## Project Overview

**YieldSense AI** is a comprehensive, smart farming platform designed to analyze agricultural data, forecast crop yields using machine learning, evaluate agronomic risks, and deliver personalized farming recommendations powered by external Large Language Models (Groq API).

The system empowers farmers, agricultural cooperatives, and researchers to make data-backed decisions regarding planting, irrigation, soil health, and risk mitigation.

---

## Technologies Used

- **Backend**: Python 3.10+, Flask, Flask-CORS, Pandas, NumPy, Scikit-learn, Joblib
- **AI / LLM Integration**: Groq Cloud SDK (`groq`), LLaMA 3.3 70B
- **Machine Learning**: Scikit-learn (Random Forest Regressor Pipeline)
- **Frontend**: HTML5, CSS3 (Modern Glassmorphism & Agricultural Design System), JavaScript (ES6+), Chart.js
- **Data & Serialization**: CSV, JSON

---

## Features

### 1. Analytics Dashboard
- Dataset overview presenting total records (500), average yield (4,032.93 kg/ha), minimum yield (2,054.34 kg/ha), and maximum yield (5,987.45 kg/ha).
- Interactive Chart.js visualizations:
  - Average yield comparison across crop types.
  - Regional productivity breakdown.
  - Overall yield distribution histogram.
  - Irrigation method performance comparison.

### 2. Machine Learning Crop Yield Prediction
- Real-time prediction using the trained Random Forest pipeline (`models/best_crop_yield_model.joblib`).
- Accepts 9 input parameters: Crop type, Region, Soil Moisture (%), Soil pH, Temperature (°C), Rainfall (mm), Humidity (%), Sunlight (hours/day), and Irrigation type.
- Robust input validation with boundary checks for agronomic plausibility.
- Estimates displayed in `kg/ha` with explicit model notices.

### 3. Agricultural Risk Assessment Engine
- Multi-factor agronomic risk evaluation:
  - Soil moisture anomalies (drought stress vs. waterlogging risk).
  - Soil pH deviations outside crop-optimal bands.
  - Temperature extremes (heat and frost risks).
  - Water stress from inadequate precipitation.
- Risk levels categorized into `Low`, `Moderate`, and `High` with actionable explanations.

### 4. AI-Driven Agricultural Recommendations (Groq LLM)
- Generates context-specific farming recommendations using farm parameters and predicted yield.
- Covers soil management, irrigation planning, crop observation, and nutrient strategies.
- Secure server-side API key handling to protect credentials.

### 5. Productivity & Seasonal Reports
- Multi-view reporting suite:
  - Crop × Region cross-tabulated summary tables.
  - Sowing distribution and monthly yield trends based on dataset records.
  - Environmental correlation matrix with crop yield.
- One-click CSV export and print-ready reports.

---

## Project Structure

```text
├── backend/
│   └── app.py                                # Flask application and REST API endpoints
├── datasets/
│   ├── Smart_Farming_Crop_Yield_2024.csv     # Primary dataset (500 records)
│   ├── Smart_Farming_Crop_Yield_Preprocessed.csv
│   └── YieldSense_AI_Dataset_Collection.xlsx
├── documentation/
│   ├── milestone_1_eda.md                    # Milestone 1 EDA documentation
│   ├── milestone_2_model_training.md         # Milestone 2 model selection & evaluation
│   ├── milestone_2_preprocessing.md          # Milestone 2 data preprocessing
│   └── milestone_3_dashboard_reporting_recommendations.md  # Milestone 3 full documentation
├── frontend/
│   ├── index.html                            # Application interface & layout
│   ├── script.js                             # Client logic, API client, Chart.js integrations
│   └── style.css                             # Responsive UI styling & theme
├── models/
│   └── best_crop_yield_model.joblib          # Trained Random Forest Regressor pipeline
├── notebook/
│   └── EDA.ipynb                             # Exploratory Data Analysis notebook
├── .gitignore                                # Excludes secrets, cache, and virtual environments
└── README.md                                 # Project documentation
```

---

## Installation & Setup

### Prerequisites
- Python 3.10+
- pip
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/springboardmentor12233a-tech/-AI-Powered-Crop-Yield-Prediction-and-Agricultural-Productivity-Intelligence-Platform.git
cd -AI-Powered-Crop-Yield-Prediction-and-Agricultural-Productivity-Intelligence-Platform
```

### 2. Set Up a Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install flask flask-cors pandas numpy scikit-learn joblib groq requests
```

---

## Configuration

### Configuring GROQ_API_KEY Safely
To enable AI agricultural recommendations, obtain an API key from [Groq Console](https://console.groq.com/) and set it as an environment variable in your terminal:

**Windows (Command Prompt):**
```cmd
set GROQ_API_KEY=your_actual_groq_api_key_here
```

**Windows (PowerShell):**
```powershell
$env:GROQ_API_KEY="your_actual_groq_api_key_here"
```

**Linux / macOS:**
```bash
export GROQ_API_KEY="your_actual_groq_api_key_here"
```

> **Security Note:** Never commit `.env` files or API keys to GitHub. The `.gitignore` file is preconfigured to prevent credential leaks.

---

## How to Run the Platform

### 1. Start the Flask Backend
```bash
python backend/app.py
```
The backend starts on `http://127.0.0.1:5000`.

### 2. Launch the Frontend
You can open `frontend/index.html` directly in your browser or serve it using Python's static HTTP server:
```bash
cd frontend
python -m http.server 8080
```
Open `http://localhost:8080` in your web browser.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check and available endpoints list |
| `GET` | `/api/dashboard` | Dataset analytics, distributions, and summary stats |
| `POST` | `/api/predict` | ML crop yield prediction and risk assessment |
| `POST` | `/api/insights` | Groq AI agricultural insights and recommendations |
| `POST` | `/api/risk-assessment` | Standalone agricultural risk assessment |
| `GET` | `/api/reports` | Detailed reporting data, monthly trends, and correlations |

### Example Prediction Request
```bash
curl -X POST http://127.0.0.1:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "crop": "Wheat",
    "region": "North India",
    "soil_moisture": 35.9,
    "soil_ph": 6.5,
    "temperature": 25.0,
    "rainfall": 75.0,
    "humidity": 70.0,
    "sunlight": 7.0,
    "irrigation_type": "Drip"
  }'
```

---

## Model Evaluation & Limitations

- **Model Used**: Random Forest Regressor Pipeline with Scikit-learn preprocessing.
- **Evaluation Metrics (Test Set, 100 samples)**:
  - **MAE**: 1,060.34 kg/ha
  - **RMSE**: 1,210.03 kg/ha
  - **R² Score**: -0.0602
- **Limitations**:
  - The model provides indicative estimates rather than guaranteed yields.
  - The negative R² indicates that test-set variation is not fully captured by the current feature set and baseline sample size (500 records). Further feature engineering and expanded datasets are recommended for future milestones.
