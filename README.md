
# YieldSense AI
### Crop Yield Prediction & Agricultural Productivity Forecasting System

YieldSense AI is a machine-learning-based agricultural productivity forecasting platform designed to help users estimate crop yield using agricultural data and explore related weather and soil information.

## Features

- **Crop Yield Prediction:** Predicts crop yield using a trained Random Forest model.
- **Weather Analysis:** Displays weather-related analysis alongside prediction results.
- **Soil Analysis:** Provides soil-related information for agricultural decision support.
- **AI-Generated Recommendations:** Presents recommendations to help users interpret prediction results.
- **PDF Reports:** Generates downloadable reports containing prediction and related analysis.
- **User Authentication:** Supports separate farmer and administrator workflows.
- **Admin Analytics Dashboard:** Displays dataset-level analytics and interactive charts.

## Technology Stack

- **Language:** Python
- **Backend:** Flask
- **Machine Learning:** Scikit-learn, Random Forest
- **Data Processing:** Pandas, NumPy
- **Model Storage:** Joblib
- **Database:** SQLite
- **Frontend:** HTML, CSS, JavaScript
- **Visualizations:** Chart.js
- **PDF Generation:** ReportLab

## Project Structure

```text
YieldSense-AI/
├── backend/
│   ├── app.py
│   └── report_generator.py
├── dataset/
│   ├── crop_yield.csv
│   ├── state_soil_data.csv
│   └── state_weather_data_1997_2020.csv
├── frontend/
│   ├── index.html
│   ├── login.html
│   └── admin.html
├── models/
│   ├── crop_yield_model_small.joblib
│   ├── encoders.joblib
│   └── feature_cols.joblib
├── notebooks/
│   └── EDA.ipynb
├── requirements.txt
└── README.md
```

## Setup and Installation

### 1. Clone the repository

```bash
git clone -b Sakshi-Supriya-YieldSense-AI https://github.com/springboardmentor12233a-tech/-AI-Powered-Crop-Yield-Prediction-and-Agricultural-Productivity-Intelligence-Platform.git YieldSense-AI 
cd YieldSense-AI
```

Switch to your project branch if necessary.

### 2. Create a virtual environment

```bash
python -m venv venv
```

Activate it on Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
python -m pip install -r requirements.txt
```

### 4. Start the backend

Open a terminal in the project root and run:

```powershell
cd backend
python app.py
```

Keep this terminal running.

### 5. Start the frontend

Open a second terminal in the project root and run:

```powershell
cd frontend
python -m http.server 5500
```

### 6. Open the application

Visit:

http://127.0.0.1:5500/login.html

The backend runs locally on port 5000, while the frontend is served on port 5500.

## How to Use

1. Open the login page and sign in with an appropriate account.
2. Farmers can enter agricultural details and generate a crop-yield prediction.
3. Review the associated weather analysis, soil analysis, and recommendation.
4. Download the generated PDF report.
5. Administrators can access the admin dashboard to view analytics.

## Testing

The following workflows have been manually tested in the local development environment:

- Backend status and model loading
- Farmer login and crop-yield prediction
- Weather and soil analysis
- Recommendation display
- PDF report generation and download
- Administrator login and analytics dashboard
- Rejection of a prediction request without an authenticated session

These checks represent functional testing, not a comprehensive security audit or independent model evaluation.

## Current Status

The application has been tested locally. Public deployment has not yet been completed and remains future work.

## Future Enhancements

- Additional API validation and automated testing
- Further evaluation of model performance and limitations
- Improved documentation and deployment configuration
- Online deployment after testing and preparation

## Author

**Sakshi Supriya**