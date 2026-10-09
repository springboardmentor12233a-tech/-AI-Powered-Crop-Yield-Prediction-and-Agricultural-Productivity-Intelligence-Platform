# 🌱 YieldSense AI: Crop Yield Prediction & Agricultural Productivity Platform

[![Deploy with Vercel](https://vercel.com/button)](https://yieldsense-ai-frontend-plum.vercel.app/)
[![Backend Status](https://img.shields.io/badge/Render-Live-success?logo=render)](https://ai-powered-crop-yield-prediction-and-2gyv.onrender.com/docs)
[![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)

**YieldSense AI** is a full-stack, machine learning-driven agricultural intelligence platform developed as part of the **Infosys Springboard Pragati & AI Virtual Internship**. It leverages environmental data telemetry—including rainfall, soil pH, and nitrogen levels—to deliver highly accurate crop yield estimations and tactical execution plans, bridging the gap between raw agricultural data and actionable farming intelligence.

---

## 🚀 Live Demo & Documentation
- **Frontend Application:** [YieldSense AI on Vercel](https://yieldsense-ai-frontend-plum.vercel.app)
- **Backend API (Swagger UI):** [FastAPI on Render](https://ai-powered-crop-yield-prediction-and-2gyv.onrender.com/docs)
- **Active Branch:** `SANGHAVI-S-AVADHANI`

---

## 🏗️ System Architecture & Tech Stack

### Frontend (Client-Side)
- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS for a responsive, modern UI
- **State Management:** React Hooks (useState, useEffect)
- **Deployment:** Vercel (Edge network, Continuous Deployment)

### Backend (Server-Side)
- **Framework:** FastAPI (Python)
- **Server:** Uvicorn (ASGI)
- **Machine Learning:** Scikit-learn (RandomForestRegressor algorithm)
- **Deployment:** Render (Cloud containerization, Continuous Deployment)

---

## 🌩️ Cloud Integration & Deployment Strategy
This project utilizes a modern **Continuous Deployment (CD)** pipeline directly integrated with GitHub. 

- **Decoupled Architecture:** The Next.js frontend and FastAPI backend are deployed independently on optimized cloud infrastructure (Vercel and Render).
- **Environment Variable Management:** Dynamic API routing is configured securely using `NEXT_PUBLIC_API_URL` to ensure seamless switching between local development and production environments.
- **Cross-Origin Security:** The backend is hardened with **CORS (Cross-Origin Resource Sharing) Middleware**, properly configuring preflight `OPTIONS` requests to securely accept cross-origin network fetches exclusively from the authorized Vercel frontend.

---

## ⚙️ Local Setup & Installation

To run this project locally for development or evaluation purposes, follow these steps:

### 1. Clone the Repository
```bash
git clone <your-github-repo-url>
git checkout SANGHAVI-S-AVADHANI