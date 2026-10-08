# 🌾 YieldSense AI
## AI-Powered Crop Yield Prediction & Agricultural Productivity Intelligence Platform

YieldSense AI is a full-stack agricultural intelligence platform that combines **Machine Learning, AI-generated insights, environmental analytics, historical data analysis, and modern web technologies** to support data-driven agricultural decision-making.

The platform predicts crop yield based on agricultural, environmental, and crop-management parameters and provides additional insights through weather analysis, soil analysis, analytics, recommendations, reports, and an AI chatbot.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Objectives](#-objectives)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Machine Learning Pipeline](#-machine-learning-pipeline)
- [Model Training and Selection](#-model-training-and-selection)
- [Model Validation Results](#-model-validation-results)
- [Application Modules](#-application-modules)
- [User Roles](#-user-roles)
- [Project Structure](#-project-structure)
- [Database](#-database)
- [API Endpoints](#-api-endpoints)
- [Frontend](#-frontend)
- [AI and LLM Integration](#-ai-and-llm-integration)
- [Docker Deployment](#-docker-deployment)
- [Cloud Deployment](#-cloud-deployment)
- [Local Installation](#-local-installation)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Testing and Validation](#-testing-and-validation)
- [Performance Optimization](#-performance-optimization)
- [Security](#-security)
- [Known Limitations](#-known-limitations)
- [Future Enhancements](#-future-enhancements)
- [Project Documentation](#-project-documentation)
- [Project Status](#-project-status)
- [Authors](#-authors)
- [Acknowledgements](#-acknowledgements)

---

# 🌱 Overview

Agricultural productivity is influenced by several interacting factors such as:

- Temperature
- Rainfall
- Humidity
- Sunlight
- Soil moisture
- Soil pH
- NDVI
- Pesticide usage
- Geographic location
- Crop type
- Irrigation method
- Fertilizer type
- Disease status
- Crop cycle

YieldSense AI uses these agricultural and environmental parameters to provide a machine-learning-based crop yield forecast.

The platform extends beyond simple prediction by providing:

- Weather analysis
- Soil analysis
- Historical prediction analytics
- Agricultural recommendations
- AI-generated insights
- Notifications
- Downloadable agricultural reports
- Role-based access
- Secure authentication
- Responsive web interface
- Docker-based deployment
- Cloud deployment

The goal is to provide a unified platform where agricultural data can be transformed into understandable and actionable decision support.

---

# 🎯 Problem Statement

Traditional agricultural decision-making often depends heavily on historical experience and manual interpretation of environmental conditions.

Farm productivity can be affected by changing:

- Weather conditions
- Soil conditions
- Crop characteristics
- Irrigation practices
- Fertilizer usage
- Pest and disease conditions
- Geographic factors

There is a need for a centralized system that can process agricultural data and provide predictive and analytical support.

YieldSense AI addresses this requirement by integrating machine learning, data analytics, AI-generated insights, and a web-based dashboard into a single platform.

---

# 🎯 Objectives

The main objectives of YieldSense AI are:

1. Develop a machine-learning-based crop yield prediction system.
2. Process agricultural and environmental parameters.
3. Compare multiple regression models using cross-validation.
4. Select and save the best-performing model.
5. Provide yield predictions through a FastAPI backend.
6. Provide weather and soil analysis.
7. Provide historical prediction analytics.
8. Generate agricultural recommendations.
9. Integrate an AI-powered chatbot.
10. Generate downloadable agricultural reports.
11. Implement secure authentication and role-based access.
12. Optimize dashboard responsiveness and frontend performance.
13. Containerize the platform using Docker.
14. Deploy the application to cloud infrastructure.
15. Validate the complete end-to-end system.

---

# ✨ Key Features

## 🤖 Machine Learning Yield Prediction

Predicts crop yield in:

`kg/hectare`

using agricultural and environmental parameters.

The system uses a trained:

**Random Forest Regression model**

with a preprocessing pipeline saved using Joblib.

---

## 🌦️ Weather Analysis

Provides analysis of:

- Temperature
- Rainfall
- Humidity
- Sunlight
- Historical yield relationships
- Weather-related agricultural observations

---

## 🌱 Soil Analysis

Provides analysis based on:

- Soil moisture
- Soil pH
- Historical yield relationships
- Soil distributions
- Agricultural interpretation

---

## 📊 Analytics Dashboard

Provides:

- Total predictions
- Highest predicted yield
- Unique crop information
- Prediction trends
- Environmental relationships
- Historical prediction records
- Prediction data span

---

## 🧠 AI Recommendations

Provides decision-support sections including:

- Executive Summary
- Priority Actions & Alerts
- Weather-Based Strategies
- Soil Management & Agronomy
- Model Considerations & Limitations

Recommendations are presented as decision support rather than guaranteed agricultural outcomes.

---

## 💬 AI Agricultural Chatbot

The platform includes an AI chatbot that can answer agricultural questions and provide general agricultural explanations.

The chatbot is integrated with an external LLM service through the backend.

---

## 📄 Agricultural Reports

Users can generate downloadable agricultural reports containing information such as:

- Yield prediction
- Crop information
- Weather analysis
- Soil analysis
- Strategic forecasting summary
- Model limitations

---

## 🔐 Authentication and Authorization

The platform provides:

- User registration
- Login
- JWT authentication
- Protected routes
- Role-based access
- Profile management
- Logout

---

## 🔔 Notifications

The system provides notifications for relevant platform activities, including prediction-related events.

Users can:

- View notifications
- Identify unread notifications
- Mark notifications as read
- Mark all notifications as read

---

## 📱 Responsive Interface

The frontend is designed to support:

- Desktop
- Tablet
- Mobile devices

Responsive behavior includes:

- Mobile navigation drawer
- Responsive dashboard cards
- Responsive forms
- Responsive charts
- Responsive tables
- Mobile-friendly chatbot
- Responsive header
- Mobile-friendly settings and reports

---

# 🏗️ System Architecture

```text
┌─────────────────────────┐
│         User            │
│    Farmer / Admin       │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│      React + Vite       │
│        Frontend         │
│      Tailwind CSS       │
└────────────┬────────────┘
             │
        HTTP / REST API
             │
             ▼
┌─────────────────────────┐
│        FastAPI          │
│         Backend         │
└────────────┬────────────┘
             │
    ┌────────┼────────┐
    │        │        │
    ▼        ▼        ▼
┌────────┐ ┌────────┐ ┌──────────────┐
│   ML   │ │Agric.  │ │Authentication│
│Predict.│ │Analytics│ │   & JWT Auth │
└───┬────┘ └────────┘ └──────────────┘
    │
    ▼
┌────────────────────┐
│ Random Forest      │
│ Yield Model        │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ PostgreSQL         │
│ Database           │
└────────────────────┘

          ┌────────────────────┐
          │ External LLM       │
          │ Service (Groq)     │
          └────────────────────┘
```

# 🛠️ Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React | Frontend framework |
| Vite | Frontend build tool |
| Tailwind CSS | UI styling |
| Recharts | Data visualization |
| Lucide React | Icons |
| React Router | Client-side routing |
| React Markdown | Markdown rendering |
| Remark GFM | GitHub-flavored Markdown |


### Backend

| Technology | Purpose |
|---|---|
| Python | Backend and ML ecosystem |
| FastAPI | REST API framework |
| Uvicorn | ASGI server |
| SQLAlchemy | Database ORM |
| PostgreSQL | Relational database |
| Pydantic | Data validation |
| JWT | Authentication |


### Machine Learning

| Technology | Purpose |
|---|---|
| Scikit-learn | Machine learning |
| Pandas | Data processing |
| NumPy | Numerical operations |
| Matplotlib | Visualization |
| Seaborn | Exploratory analysis |
| Joblib | Model persistence |


### AI

| Technology | Purpose |
|---|---|
| Groq | LLM service |
| LLM Integration | Agricultural insights and chatbot |


### Deployment

| Technology | Purpose |
|---|---|
| Docker | Containerization |
| Docker Compose | Multi-container deployment |
| Nginx | Frontend production server |
| Vercel | Frontend cloud deployment |
| Render | Backend cloud deployment |
| PostgreSQL | Cloud database |

# 🧠 Machine Learning Pipeline

```text
Raw Agricultural Dataset
          │
          ▼
Data Diagnostics
          │
          ▼
Data Cleaning
          │
          ▼
Feature Processing
          │
          ▼
Train / Test Split
          │
          ▼
Model Training
          │
          ▼
GridSearchCV
          │
          ▼
Model Comparison
          │
          ▼
Random Forest Selection
          │
          ▼
Model Validation
          │
          ▼
Joblib Model Persistence
          │
          ▼
FastAPI Prediction Service
```

## 🧪 Model Training and Selection
The following regression algorithms were evaluated using GridSearchCV with 5-fold cross-validation:
1. Linear Regression
2. Decision Tree
3. Random Forest
4. Gradient Boosting
5. XGBoost
The model-selection criterion was the lowest cross-validation RMSE.
| Model | CV RMSE |
|---|---:|
| Linear Regression | 1255.02 |
| Decision Tree | 1237.69 |
| Random Forest | 1193.35 |
| Gradient Boosting | 1205.89 |
| XGBoost | 1202.75 |


Based on cross-validation RMSE, Random Forest was selected as the final model.
## 📈 Model Validation Results
The final Random Forest model was evaluated on the 100-record test dataset.
| Metric | Result |
|---|---:|
| MAE | 1069.26 kg/ha |
| RMSE | 1205.67 kg/ha |
| R² | -0.0525 |


Additional validation included:
- Model loading
- Preprocessor loading
- Feature compatibility
- Prediction generation
- NaN prediction checks
- Infinite prediction checks
- Negative prediction checks
- Repeatability testing
- Batch prediction performance
- API-to-model integration
- Edge-case testing
## ⚠️ Model Limitations
The current dataset shows relatively weak predictive relationships between the available features and crop yield.
The final model achieved:
R² = -0.0525

A negative R² indicates that the model does not outperform the mean-baseline prediction on the test set.
Therefore, the project does not claim an unsupported percentage accuracy.
The Random Forest model was retained because it achieved the lowest cross-validation RMSE among the evaluated models.
The limitation is explicitly documented as part of the model validation process.
## 📊 Feature Analysis
Important features observed in the trained Random Forest model include:
- Longitude
- Soil moisture
- Pesticide usage
- Temperature
- Rainfall
- Humidity
- Sunlight
- NDVI
Feature importance indicates model usage within the trained dataset and should not be interpreted as proof of causal agricultural relationships.
## 🖥️ Application Modules
1. Dashboard
Provides:
- Yield prediction
- Prediction trends
- Soil status
- Weather impact
- AI intelligence
- Environmental intelligence
- Agricultural alerts
- Quick actions
2. Yield Prediction
Allows users to provide agricultural parameters and obtain predicted yield in kg/hectare.
3. Weather Analysis
Analyzes environmental parameters and historical relationships with yield.
4. Soil Analysis
Analyzes soil-related parameters and historical relationships with crop yield.
5. Analytics
Provides historical prediction analytics and visualization.
6. Recommendations
Provides agricultural decision-support recommendations based on available prediction and environmental information.
7. Reports
Generates agricultural reports containing prediction and analytical information.
8. Settings
Allows users to manage profile information and view system connectivity information.
9. Notifications
Provides system and prediction-related notifications.
10. AI Chatbot
Provides AI-powered agricultural explanations and answers to agricultural questions.
## 👥 User Roles
The platform supports role-based access.
Admin
Administrative access to supported platform functionality.
Farmer
Access to agricultural prediction and decision-support functionality.
Authentication is implemented using JWT-based security.

---

# 📁 Project Structure

```text
YieldSense-AI/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── database/
│   │   └── main.py
│   │
│   ├── tests/
│   ├── Dockerfile
│   └── requirements-docker.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── App.jsx
│   │
│   ├── Dockerfile
│   ├── nginx.conf
│   └── vercel.json
│
├── data/
│   └── processed/
│
├── models/
│   ├── random_forest_yield_model.joblib
│   └── preprocessor.joblib
│
├── database/
│   └── schema.sql
│
├── docs/
│   ├── model_validation_report.md
│   ├── performance_validation_report.md
│   └── docker_deployment_report.md
│
├── docker-compose.yml
├── .dockerignore
├── .gitignore
└── README.md
```

---

# 🗄️ Database

YieldSense AI uses PostgreSQL for persistent data storage.

The database contains tables supporting:

- User authentication
- Roles
- Regions
- Crops
- Irrigation types
- Fertilizer types
- Disease statuses
- Agricultural observations
- Prediction history
- Notifications
- Password reset functionality

The database is accessed through SQLAlchemy.

---

# 🔌 API Endpoints

The backend provides REST API endpoints for:

| Endpoint | Purpose |
|---|---|
| `/health` | Backend health check |
| `/auth/register` | User registration |
| `/auth/login` | User authentication |
| `/ml/predict` | Crop yield prediction |
| `/ml/weather-analysis` | Weather analysis |
| `/ml/soil-analysis` | Soil analysis |
| `/ml/agricultural-report` | Agricultural report generation |
| `/ml/llm-insights` | AI-generated agricultural insights |
| `/ml/chat` | AI agricultural chatbot |

Authentication-protected endpoints require a valid JWT access token.

---

# 🖥️ Frontend

The frontend is built using React and Vite.

The interface uses:

- Tailwind CSS
- Recharts
- Lucide React
- React Router
- React Markdown
- Responsive layouts
- Lazy-loaded pages
- Mobile navigation

The frontend communicates with the FastAPI backend using REST APIs.

---

# 🤖 AI and LLM Integration

YieldSense AI integrates an external LLM service through the backend.

The LLM is used for:

- Agricultural insights
- Decision-support explanations
- AI recommendations
- Agricultural chatbot responses
- Natural-language interpretation of prediction and environmental information

The LLM is not used to replace the machine-learning prediction model.

The Random Forest model remains responsible for the numerical crop-yield prediction.

---

# 🐳 Docker Deployment

The application is containerized using Docker.

The Docker deployment consists of:

```text
                 ┌──────────────────────┐
                 │      Frontend        │
                 │ React + Nginx        │
                 │      Port 3000       │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │      Backend         │
                 │ FastAPI + ML Model   │
                 │      Port 8000       │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │     PostgreSQL       │
                 │      Port 5433       │
                 └──────────────────────┘
```

Docker Compose manages the services.

Main services:

- `yieldsense-frontend`
- `yieldsense-backend`
- `yieldsense-db`

The PostgreSQL database uses a persistent Docker volume.

---

# ☁️ Cloud Deployment

The production architecture uses:

- **Vercel** for the React frontend
- **Render** for the FastAPI backend
- **Render PostgreSQL** for the production database
- **Docker** for backend containerization

### Production Frontend

```text
https://yieldsense-ai-frontend.vercel.app
```

### Production Backend

```text
https://yieldsense-backend-jr3t.onrender.com
```

### Cloud Architecture

```text
User
 │
 ▼
Vercel
React Frontend
 │
 │ HTTPS REST API
 ▼
Render
FastAPI Backend
 │
 ├──────────────► Random Forest Model
 │
 ├──────────────► Groq LLM
 │
 ▼
Render PostgreSQL
```

The production deployment was verified through end-to-end frontend-to-backend communication.

---

# 💻 Local Installation

## Prerequisites

Install the following:

- Python 3.12+
- Node.js 20+
- npm
- PostgreSQL
- Git
- Docker Desktop

## Clone the Repository

```bash
git clone https://github.com/springboardmentor12233a-tech/-AI-Powered-Crop-Yield-Prediction-and-Agricultural-Productivity-Intelligence-Platform.git
```

```bash
cd -AI-Powered-Crop-Yield-Prediction-and-Agricultural-Productivity-Intelligence-Platform
```

Switch to the project branch if required:

```bash
git checkout siftain-raza
```

---

# ⚙️ Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the environment on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the backend:

```bash
uvicorn backend.app.main:app --reload
```

The backend will be available at:

```text
http://localhost:8000
```

Swagger API documentation:

```text
http://localhost:8000/docs
```

---

# 🎨 Frontend Setup

Navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

# 🔐 Environment Variables

Create the required environment configuration based on `.env.example`.

Important configuration categories include:

```env
DATABASE_URL=
JWT_SECRET_KEY=
JWT_ALGORITHM=
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=

GROQ_API_KEY=
GROQ_MODEL=
GROQ_BASE_URL=

SMTP_SERVER=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=

FRONTEND_URL=
ALLOWED_ORIGINS=
```

### Security Note

Do not commit real credentials, API keys, passwords, tokens, or production secrets to GitHub.

Use `.env` for local secrets and `.env.example` for safe configuration documentation.

---

# ▶️ Running the Application

## Development Mode

Start PostgreSQL.

Start the backend:

```bash
uvicorn backend.app.main:app --reload
```

Start the frontend:

```bash
npm run dev
```

Then open the frontend in the browser.

---

# 🐳 Running with Docker

From the project root:

```bash
docker compose build
```

Start the application:

```bash
docker compose up -d
```

Check running containers:

```bash
docker compose ps
```

View backend logs:

```bash
docker compose logs backend
```

View frontend logs:

```bash
docker compose logs frontend
```

Stop the application:

```bash
docker compose down
```

The Docker deployment exposes:

```text
Frontend:
http://localhost:3000

Backend:
http://localhost:8000

Database:
localhost:5433
```

---

# 🧪 Testing and Validation

The project includes validation for the machine-learning model and application pipeline.

Validation includes:

- Model loading
- Preprocessor loading
- Feature compatibility
- Prediction generation
- API integration
- Edge-case handling
- Repeatability
- Batch prediction
- Invalid input handling
- NaN checks
- Infinite-value checks
- Negative prediction checks

The model validation process confirmed that the saved model and preprocessing pipeline can be loaded and used successfully.

---

# ⚡ Performance Optimization

Frontend performance was improved using React lazy loading and Suspense.

The main JavaScript bundle was reduced approximately from:

```text
1,435.03 kB
```

to:

```text
858.23 kB
```

This represents an approximate reduction of:

```text
40%
```

Build time was reduced approximately from:

```text
15.21 seconds
```

to:

```text
1.37 seconds
```

The optimization was performed without changing the core application functionality.

---

# 📱 Mobile Responsiveness

The frontend was tested for responsive behavior across multiple viewport sizes.

Verified sizes include:

- 320px
- 375px
- 390px
- 430px
- 768px
- 1024px and above

Responsive improvements include:

- Mobile sidebar drawer
- Hamburger navigation
- Responsive header
- Responsive search
- Responsive cards
- Responsive forms
- Responsive charts
- Horizontal table scrolling
- Mobile-friendly reports
- Mobile-friendly settings
- Mobile-friendly chatbot

---

# 🔒 Security

Security features implemented include:

- JWT-based authentication
- Password hashing
- Protected API routes
- Protected frontend routes
- Role-based access
- Environment-based secret configuration
- CORS configuration
- Secure separation of frontend and backend
- Database-backed user authentication

Production credentials and API keys should remain outside the source repository.

---

# ⚠️ Known Limitations

## Dataset Size

The available dataset contains approximately:

```text
500 records
```

with:

```text
400 training records
100 testing records
```

The processed feature set contains:

```text
38 features
```

The relatively small dataset limits the ability of the model to learn strong generalizable relationships.

## Predictive Signal

The current dataset contains relatively weak predictive relationships between the available features and crop yield.

The final test R² is:

```text
-0.0525
```

Therefore, the system does not claim a percentage prediction accuracy.

## Model Interpretation

Feature importance represents patterns learned from the available dataset.

It should not be interpreted as proof that a particular agricultural factor directly causes changes in crop yield.

## Agricultural Recommendations

Recommendations are intended as decision support.

They should not be interpreted as guaranteed agricultural outcomes or as a replacement for professional agricultural advice.

---

# 🚀 Future Enhancements

Potential future improvements include:

- Larger and more diverse agricultural datasets
- Region-specific datasets
- More advanced time-series forecasting
- Satellite imagery integration
- Real-time weather APIs
- IoT sensor integration
- Additional crop types
- Advanced deep-learning models
- Improved model calibration
- More detailed farmer-specific recommendations
- Cloud monitoring and observability
- Automated model retraining
- More advanced agricultural risk prediction

---

# 📚 Project Documentation

Important project documentation includes:

```text
docs/
├── model_validation_report.md
├── performance_validation_report.md
└── docker_deployment_report.md
```

These documents contain information related to:

- Model validation
- Model performance
- System responsiveness
- Docker deployment
- Cloud deployment
- End-to-end verification
- Milestone 4 completion

---

# 🏁 Project Status

## Milestone 1

Completed:

- Project planning
- Problem definition
- System design
- Initial dataset preparation

## Milestone 2

Completed:

- Dataset diagnostics
- Feature preprocessing
- Model training
- GridSearchCV
- Model comparison
- Random Forest selection
- Prediction API
- Agricultural analysis
- LLM integration

## Milestone 3

Completed:

- Dashboard
- UI improvements
- Analytics
- Recommendations
- Chatbot
- Role-based access
- JWT authentication
- Notifications
- Responsive interface

## Milestone 4

Completed:

- Model validation
- Performance validation
- Dockerization
- Docker Compose deployment
- Cloud deployment
- Frontend deployment
- Backend deployment
- Production database
- End-to-end testing
- Mobile responsiveness
- Documentation
- GitHub readiness

---

# 🔄 End-to-End Data Flow

```text
User
 │
 ▼
React Frontend
 │
 │ User Input
 ▼
FastAPI Backend
 │
 ├───────────────► JWT Authentication
 │
 ├───────────────► Input Validation
 │
 ▼
Preprocessing Pipeline
 │
 ▼
Random Forest Model
 │
 ▼
Predicted Yield
 │
 ├───────────────► Prediction History
 │
 ├───────────────► Analytics
 │
 ├───────────────► Recommendations
 │
 └───────────────► Agricultural Report
 │
 ▼
External LLM
 │
 ▼
AI Insights / Chatbot
 │
 ▼
React Dashboard
```

---

# ✅ Production Verification

The production deployment was verified through the following checks:

- Frontend deployment successful
- Backend deployment successful
- PostgreSQL database connected
- User registration working
- User login working
- JWT authentication working
- Prediction endpoint working
- Prediction history working
- Weather analysis working
- Soil analysis working
- Agricultural report generation working
- AI chatbot integration working
- Recommendations working
- Analytics working
- Notifications working
- Settings working
- Profile update working
- Logout working
- Global module search working
- Responsive mobile layout working
- Docker deployment working
- Cloud deployment working

---

# ⚠️ Disclaimer

YieldSense AI provides machine-learning-based predictions and agricultural decision-support information using the available dataset and historical relationships.

The model results and recommendations should not be considered guaranteed agricultural outcomes.

Historical associations do not establish causation.

Users should consider local environmental conditions, agricultural expertise, field observations, and other relevant information before making agricultural decisions.

---

# 👨‍💻 Authors

**Siftainraza J Baligar**

Computer Science and Engineering

YieldSense AI Project

---

# 🙏 Acknowledgements

This project was developed as an academic and technical project involving:

- Machine Learning
- Artificial Intelligence
- Web Development
- Data Analytics
- Database Management
- Cloud Deployment
- Docker
- Agricultural Data Analysis

---

# 🌾 Final Note

YieldSense AI demonstrates an end-to-end approach to building an AI-powered agricultural intelligence platform, from dataset processing and machine-learning model development to API integration, responsive frontend development, containerization, cloud deployment, validation, and production demonstration.

The project emphasizes both the capabilities and limitations of machine-learning-based agricultural prediction and provides a complete platform for experimentation, analysis, and decision support.
