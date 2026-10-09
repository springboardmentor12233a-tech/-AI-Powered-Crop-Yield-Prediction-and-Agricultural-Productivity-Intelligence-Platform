# 🌱 YieldSense AI: Crop Yield Prediction & Agricultural Productivity Platform

[![Deploy with Vercel](https://vercel.com/button)](https://[yieldsense-ai-frontend-plum.vercel.app](https://yieldsense-ai-frontend-54592cabx-sanghavi21.vercel.app/)/)
[![Backend Status](https://img.shields.io/badge/Render-Live-success?logo=render)](https://ai-powered-crop-yield-prediction-and-2gyv.onrender.com/docs)
[![Python](https://img.shields.io/badge/Python-3.12.2amd64.exe-blue?logo=python)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)

**YieldSense AI** is a full-stack, machine learning-driven agricultural intelligence platform developed as part of the **Infosys Springboard Pragati & AI Virtual Internship**. It leverages environmental data telemetry to deliver highly accurate crop yield estimations and tactical execution plans, bridging the gap between raw agricultural data and actionable farming intelligence.

---

## 🎯 Project Overview

### Problem Statement
Modern agriculture faces unprecedented challenges due to unpredictable climate variations and suboptimal resource allocation. Farmers and agricultural stakeholders often lack predictive insights based on dynamic environmental factors (such as rainfall, soil pH, and nitrogen levels), leading to reduced crop yields, resource waste, and economic instability.

### Objective
To engineer an AI-driven, full-stack platform capable of ingesting real-time or historical agricultural telemetry to predict crop yields with high accuracy. The system must provide an intuitive interface for users to run gap analyses, store field data, and make data-driven farming decisions.

### Outcome
A fully deployed, scalable web application featuring a Next.js client and a Python FastAPI backend. The platform successfully integrates a trained `RandomForestRegressor` machine learning model, secured via CORS policies and environment variables, providing users with instant, reliable agricultural intelligence accessible from anywhere.

---

## ✨ Core Features
- **Predictive Yield Analytics:** Generates accurate tonne-per-hectare projections based on N-P-K (Nitrogen, Phosphorus, Potassium), rainfall, temperature, and soil pH.
- **Field Registry Management:** Allows authenticated users to save, track, and manage specific field configurations over time.
- **Interactive UI/UX:** A responsive, dark-mode optimized dashboard built with Next.js and Tailwind CSS.
- **Secure Architecture:** Implements robust CORS middleware, environment-based API routing, and token-based authentication.

---

## 🛤️ Internship Milestones Completed

- [x] **Milestone 1: Project Scoping & Data Preparation**
  - Defined problem statement and architecture.
  - Sourced agricultural datasets and performed data cleaning, handling missing values, and feature engineering.
- [x] **Milestone 2: Exploratory Data Analysis (EDA) & Model Building**
  - Conducted EDA to identify correlations between environmental factors and crop yields.
  - Trained, tested, and validated the Machine Learning model (`RandomForestRegressor`).
  - Serialized the model using `joblib`/`pickle` for production deployment.
- [x] **Milestone 3: Backend API & Frontend UI Development**
  - Built a robust RESTful API using Python FastAPI.
  - Developed a dynamic, component-based frontend using Next.js and Tailwind CSS.
  - Connected the client to the API for real-time predictions.
- [x] **Milestone 4: Cloud Deployment & CI/CD Integration**
  - Containerized backend logic and deployed the FastAPI server to **Render**.
  - Deployed the Next.js frontend to **Vercel** edge networks.
  - Resolved CORS policy errors and implemented production environment variables (`NEXT_PUBLIC_API_URL`).

---

## 🧰 Tools & Tech Stack

**Frontend**
- Next.js 16.3 (React)
- Tailwind CSS (Styling)
- Vercel (Hosting & Deployment)

**Backend & Machine Learning**
- Python 3.10+
- FastAPI & Uvicorn (API Framework & Server)
- Scikit-learn (Model Training)
- Pandas & NumPy (Data Manipulation)
- Render (Backend Hosting)

**DevOps & Tools**
- Git & GitHub (Version Control)
- Docker (Containerization)
- VS Code (Development Environment)

---

## 📊 Recommended Open-Source Agricultural Datasets
The machine learning models in this domain rely on robust datasets. Recommended sources for replication or further training include:
1. **[Kaggle: Crop Yield Prediction Dataset](https://www.kaggle.com/)**: Comprehensive datasets containing state-wise, crop-wise yield data alongside rainfall and temperature parameters.
2. **[FAOSTAT (Food and Agriculture Organization)](https://www.fao.org/faostat/)**: Global agricultural production, climate change, and land-use data.
3. **[Indian Government Open Data (data.gov.in)](https://data.gov.in/)**: Area, production, and yield of principal crops in India.

---

## 📂 Project File Structure

```text
YieldSense-AI/
├── backend/
│   ├── .env                    # Backend environment variables
│   ├── main.py                 # FastAPI application entry point
│   ├── models/                 # Serialized ML models (.pkl/.joblib)
│   ├── database.py             # Database connection logic
│   ├── schemas.py              # Pydantic models for request validation
│   ├── requirements.txt        # Python dependencies
│   └── Dockerfile              # Docker container configuration
│
├── frontend/
│   ├── .env.local              # Frontend environment variables
│   ├── src/
│   │   ├── app/                # Next.js App Router (Pages & Layouts)
│   │   │   ├── page.tsx        # Main dashboard UI
│   │   │   └── globals.css     # Global Tailwind styles
│   │   └── components/         # Reusable React components
│   ├── public/                 # Static assets (images, icons)
│   ├── tailwind.config.ts      # Tailwind styling rules
│   └── package.json            # Node.js dependencies
│
├── .gitignore                  # Git exclusion rules
└── README.md                   # Project documentation

```

---

## 🚀 Live Links & Local Setup

* **Live Application:** [YieldSense AI Dashboard](https://www.google.com/search?q=https://yieldsense-ai-frontend-plum.vercel.app)
* **Live API Swagger UI:** [YieldSense Backend Docs](https://www.google.com/url?sa=E&source=gmail&q=https://ai-powered-crop-yield-prediction-and-2gyv.onrender.com/docs)

*(For local execution instructions, please refer to the deployment steps detailed in the repository documentation.)*

---

## 👨‍💻 Developer

Developed and deployed by **Sanghavi S Avadhani**

*Bachelor of Engineering, Information Science and Engineering (Expected 2027)*

*Infosys Springboard AI Virtual Intern*

```

```
