🌾 YieldSense AI
AI-Powered Crop Yield Prediction & Agricultural Productivity Intelligence Platform
YieldSense AI is a full-stack agricultural intelligence platform that combines Machine Learning, AI-generated insights, environmental analytics, historical data analysis, and modern web technologies to support data-driven agricultural decision-making.
The platform predicts crop yield based on agricultural, environmental, and crop-management parameters and provides additional insights through weather analysis, soil analysis, analytics, recommendations, reports, and an AI chatbot.
📌 Table of Contents
- Overview
- Problem Statement
- Objectives
- Key Features
- System Architecture
- Technology Stack
- Machine Learning Pipeline
- Model Training and Selection
- Model Validation Results
- Application Modules
- User Roles
- Project Structure
- Database
- API Endpoints
- Frontend
- AI and LLM Integration
- Docker Deployment
- Cloud Deployment
- Local Installation
- Environment Variables
- Running the Application
- Testing and Validation
- Performance Optimization
- Security
- Known Limitations
- Future Enhancements
- Project Documentation
- Project Status
- Authors
- Acknowledgements
🌱 Overview
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
🎯 Problem Statement
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
🎯 Objectives
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
✨ Key Features
🤖 Machine Learning Yield Prediction
Predicts crop yield in:
kg/hectare
using agricultural and environmental parameters.
The system uses a trained:
Random Forest Regression model
with a preprocessing pipeline saved using Joblib.
🌦️ Weather Analysis
Provides analysis of:
- Temperature
- Rainfall
- Humidity
- Sunlight
- Historical yield relationships
- Weather-related agricultural observations
🌱 Soil Analysis
Provides analysis based on:
- Soil moisture
- Soil pH
- Historical yield relationships
- Soil distributions
- Agricultural interpretation
📊 Analytics Dashboard
Provides:
- Total predictions
- Highest predicted yield
- Unique crop information
- Prediction trends
- Environmental relationships
- Historical prediction records
- Prediction data span
🧠 AI Recommendations
Provides decision-support sections including:
- Executive Summary
- Priority Actions & Alerts
- Weather-Based Strategies
- Soil Management & Agronomy
- Model Considerations & Limitations
Recommendations are presented as decision support rather than guaranteed agricultural outcomes.
💬 AI Agricultural Chatbot
The platform includes an AI chatbot that can answer agricultural questions and provide general agricultural explanations.
The chatbot is integrated with an external LLM service through the backend.
📄 Agricultural Reports
Users can generate downloadable agricultural reports containing information such as:
- Yield prediction
- Crop information
- Weather analysis
- Soil analysis
- Strategic forecasting summary
- Model limitations
🔐 Authentication and Authorization
The platform provides:
- User registration
- Login
- JWT authentication
- Protected routes
- Role-based access
- Profile management
- Logout
🔔 Notifications
The system provides notifications for relevant platform activities, including prediction-related events.
Users can:
- View notifications
- Identify unread notifications
- Mark notifications as read
- Mark all notifications as read
📱 Responsive Interface
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
🏗️ System Architecture
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
🛠️ Technology Stack
Frontend
Technology	Purpose
React	Frontend framework
Vite	Frontend build tool
Tailwind CSS	UI styling
Recharts	Data visualization
Lucide React	Icons
React Router	Client-side routing
React Markdown	Markdown rendering
Remark GFM	GitHub-flavored Markdown


Backend
Technology	Purpose
Python	Backend and ML ecosystem
FastAPI	REST API framework
Uvicorn	ASGI server
SQLAlchemy	Database ORM
PostgreSQL	Relational database
Pydantic	Data validation
JWT	Authentication


Machine Learning
Technology	Purpose
Scikit-learn	Machine learning
Pandas	Data processing
NumPy	Numerical operations
Matplotlib	Visualization
Seaborn	Exploratory analysis
Joblib	Model persistence


AI
Technology	Purpose
Groq	LLM service
LLM Integration	Agricultural insights and chatbot


Deployment
Technology	Purpose
Docker	Containerization
Docker Compose	Multi-container deployment
Nginx	Frontend production server
Vercel	Frontend cloud deployment
Render	Backend cloud deployment
PostgreSQL	Cloud database


🧠 Machine Learning Pipeline
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
🧪 Model Training and Selection
The following regression algorithms were evaluated using GridSearchCV with 5-fold cross-validation:
1. Linear Regression
2. Decision Tree
3. Random Forest
4. Gradient Boosting
5. XGBoost
   The model-selection criterion was the lowest cross-validation RMSE.Model	CV RMSE
   Linear Regression	1255.02
   Decision Tree	1237.69
   Random Forest	1193.35
   Gradient Boosting	1205.89
   XGBoost	1202.75
Based on cross-validation RMSE, Random Forest was selected as the final model.
📈 Model Validation Results
The final Random Forest model was evaluated on the 100-record test dataset.
Metric	Result
MAE	1069.26 kg/ha
RMSE	1205.67 kg/ha
R²	-0.0525


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
⚠️ Model Limitations
The current dataset shows relatively weak predictive relationships between the available features and crop yield.
The final model achieved:
R² = -0.0525
A negative R² indicates that the model does not outperform the mean-baseline prediction on the test set.
Therefore, the project does not claim an unsupported percentage accuracy.
The Random Forest model was retained because it achieved the lowest cross-validation RMSE among the evaluated models.
The limitation is explicitly documented as part of the model validation process.
📊 Feature Analysis
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
🖥️ Application Modules
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
👥 User Roles
The platform supports role-based access.
Admin
Administrative access to supported platform functionality.
Farmer
Access to agricultural prediction and decision-support functionality.
Authentication is implemented using JWT-based security.
