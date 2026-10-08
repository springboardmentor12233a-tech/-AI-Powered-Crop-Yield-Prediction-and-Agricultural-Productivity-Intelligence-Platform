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
                         │   Farmer / Admin        │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │     React + Vite        │
                         │       Frontend          │
                         │     Tailwind CSS        │
                         └────────────┬────────────┘
                                      │
                              HTTP / REST API
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │       FastAPI           │
                         │        Backend          │
                         └────────────┬────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
              ▼                       ▼                       ▼
     ┌────────────────┐     ┌────────────────┐     ┌────────────────┐
     │ ML Prediction  │     │ Agricultural   │     │ Authentication │
     │    Service     │     │   Analytics    │     │   & JWT Auth   │
     └───────┬────────┘     └────────────────┘     └────────────────┘
             │
             ▼
     ┌────────────────────┐
     │ Random Forest     │
     │ Yield Model       │
     └────────────────────┘
             │
             ▼
     ┌────────────────────┐
     │ PostgreSQL         │
     │ Database            │
     └────────────────────┘

             ┌────────────────────┐
             │ External LLM       │
             │ Service            │
             │ (Groq)             │
             └────────────────────┘
