# YieldSense AI — AI-Based Crop Yield Prediction & Agricultural Recommendation Platform

> **Milestone 3 Enterprise Platform** — An end-to-end agronomic intelligence application combining machine learning crop yield forecasting, environmental suitability matching, multi-factor risk assessment, dynamic AI LLM report generation, an interactive AI Agricultural Assistant, and dedicated Admin governance.

---

## 🌾 Overview & Purpose

**YieldSense AI** is designed to provide practical, accessible agricultural intelligence to farmers, agronomists, and agricultural extension workers. The platform eliminates technical ML complexity, presenting simple, actionable insights:

1. **Crop Yield Forecasting**: Sub-20ms in-memory machine learning regression models estimating expected harvest (`ton/ha`) evaluated across soil parameters, regional micro-climates, and farm management practices.
2. **Crop Suitability Analysis**: Recommends optimal crop varieties matching ambient temperature, relative humidity, soil pH, and precipitation.
3. **Multi-Factor Agricultural Risk Assessment**: Categorizes risks (Low / Moderate / High) evaluating soil acidity/alkalinity, drought deficit, monoculture rotation risks, and agrochemical input intensity.
4. **Contextual AI Agricultural Assistant**: Conversational agronomic chatbot helping farmers understand forecasts, soil health, and farming improvements with real-time field context.
5. **Dynamic AI LLM Reporting**: Admin-managed LLM engine generating human-readable reports with seamless fallback to deterministic agronomic templates if unconfigured or offline.
6. **Publication-Quality PDF Engine**: Direct backend ReportLab generation streaming downloadable A4 agronomic assessment reports without browser print workarounds.
7. **Admin Platform Suite**: Dedicated admin dashboard for platform statistics, farmer management (activation/deactivation), and dynamic LLM provider configuration.

---

## 🔑 How to Obtain & Configure LLM API Keys (Step-by-Step Workflow)

YieldSense AI features dynamic, admin-controlled AI provider switching. **API keys are never stored in frontend code or committed to Git.**

To configure an AI provider:

### Step 1: Log in as System Administrator
1. Open the YieldSense AI web application in your browser (`http://localhost:5173`).
2. Click **"Sign In"** in the top-right header.
3. Enter default Admin credentials:
   - **Email:** `admin@yieldsense.ai`
   - **Password:** `admin123`
4. Click **"Sign In"**. You will automatically see the **"Admin Panel"** navigation tab.

---

### Step 2: Obtain an API Key from Your Preferred Provider

You can use **Google Gemini**, **OpenAI**, or **xAI Grok**. Follow the steps below for the provider of your choice:

#### Option A: Google Gemini (Recommended — Generous Free Tier)
1. Navigate to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click **"Get API key"** in the left sidebar.
4. Click **"Create API key"** (select a new or existing Google Cloud project).
5. Copy the generated key (starts with `AIzaSy...`).

#### Option B: OpenAI (ChatGPT / GPT-4o-mini)
1. Navigate to the [OpenAI API Platform](https://platform.openai.com/).
2. Sign in or create an account.
3. Go to **API Keys** in the dashboard.
4. Click **"+ Create new secret key"**, name it `YieldSense-AI`, and click **Create Secret Key**.
5. Copy the generated secret key (starts with `sk-proj-...`).

#### Option C: xAI Grok
1. Navigate to the [xAI Console](https://console.x.ai/).
2. Sign in and navigate to the **API Keys** tab.
3. Click **"Create API Key"** and copy the secret key.

#### Option D: Groq (Cheaper LLM)
1. Navigate to the [Groq Console](https://console.groq.com/).
2. Sign in (or create an account) and go to **API Keys**.
3. Click **"Create API Key"**, name it, and copy the secret key.

---

### Step 3: Apply the API Key in YieldSense AI Admin Panel
1. In the YieldSense AI interface, click the **"Admin Panel"** tab (or the **"⚙️ Admin Panel"** button in the header).
2. Click **"🤖 AI Provider Engine"** in the top-right switcher.
3. Select your provider:
   - Click **Google Gemini** (Model: `gemini-1.5-flash`), **OpenAI GPT** (Model: `gpt-4o-mini`), or **xAI Grok** (Model: `grok-beta`).
4. In the **"API Key Secret"** field, paste your copied API key.
5. Check the box: **☑ Set as Active Primary LLM Engine**.
6. Click **"⚡ Test Connection"** to verify the API key and link directly with the provider.
7. Once verified with a green badge, click **"Save Configuration"**.

> 🛡️ **Fail-Safe Guarantee**: If no API key is provided, or if the provider experiences an outage, YieldSense AI automatically falls back to its deterministic rule-based agronomic engine. Numerical predictions and reports will never fail.

---

## 🏗️ System Architecture

```
+-------------------------------------------------------------------------------+
|                       YieldSense AI — Milestone 3 Architecture                |
+-------------------------------------------------------------------------------+
                                      |
       +------------------------------+------------------------------+
       |                                                             |
+------v-----------------------------+ +-----------------------------v-------+
|    Farmer Experience (React)       | |      Admin Panel (React)            |
| - Dashboard & Quick Actions        | | - System Statistics & Metrics       |
| - Yield Forecast (Step Wizard)     | | - Farmer Registry & Status Toggle   |
| - Crop Suitability Match           | | - Dynamic LLM Provider Config       |
| - AI Agronomist Chatbot            | | - Live Connection Testing           |
| - Interactive Analytics Dashboard  | | - Crop Activity Stream              |
| - A4 PDF Report Generation         | +-------------------------------------+
+------------------------------------+                               |
       |                                                             |
+------v-------------------------------------------------------------v-------+
|                         FastAPI Backend Gateway                            |
|  - JWT Auth Guard (/api/auth)        - Admin Management (/api/admin)       |
|  - Yield Inference (/api/predict)    - Agricultural AI Chat (/api/chat)    |
|  - Crop Suitability (/api/predict)   - PDF ReportLab Engine (/api/reports) |
+----------------------------------------------------------------------------+
       |                                      |
+------v-----------------------+       +------v------------------------------+
|     In-Memory ML Registry    |       |      Agronomic Analytics & LLM      |
| - Yield Regressor (R² ~0.98) |       | - Risk Evaluator (Low/Mod/High)     |
| - Suitability Classifier     |       | - Dynamic LLM Provider (Urllib)     |
| - Pre-warmed at Startup      |       | - Deterministic Rule-Based Fallback |
+------------------------------+       +-------------------------------------+
       |                                      |
+------v--------------------------------------v------------------------------+
|                      SQLite Relational Database (yieldsense.db)            |
|  - users (roles: farmer, admin)       - farms (plot & land metadata)       |
|  - predictions (forecast history)     - recommendations (suitability logs) |
|  - llm_configurations (encrypted)     - chat_messages (farmer history)     |
+----------------------------------------------------------------------------+
```

---

## ⚙️ Prerequisites

- **Python**: `3.10` or `3.11` (`python --version`)
- **Node.js**: `18.0` or higher (`node --version`)
- **npm**: `9.0` or higher (`npm --version`)
- **Git**: (`git --version`)

---

## 🚀 Step-by-Step Installation & Running Guide

### 1. Clone the Repository
```bash
git clone https://github.com/your-repo/AI-Powered-Crop-Yield-Prediction-and-Agricultural-Productivity-Intelligence-Platform.git
cd AI-Powered-Crop-Yield-Prediction-and-Agricultural-Productivity-Intelligence-Platform
```

---

### 2. Backend Setup & Virtual Environment (`venv`)

#### Step 2.1: Create Python Virtual Environment
**On Windows (PowerShell / Command Prompt):**
```powershell
python -m venv .venv
.venv\Scripts\activate
```

**On macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

#### Step 2.2: Install Dependencies
```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

#### Step 2.3: Start FastAPI Backend Server
```bash
uvicorn src.api.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Health Status: `http://127.0.0.1:8000/`
- Interactive Swagger Documentation: `http://127.0.0.1:8000/docs`

---

### 3. Frontend Web Application Setup

Open a second terminal window:

```bash
cd frontend
npm install
npm run dev
```

- Web Interface: `http://localhost:5173/`

---

### 4. Running the Automated Test Suite

To run all automated verification tests:
```bash
python -m pytest tests/ -v
```
*Expected result: 15 / 15 tests passing with zero errors.*

---

## 👥 Default Demo Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@yieldsense.ai` | `admin123` | Full Admin Dashboard, Farmer Directory, LLM Settings, Telemetry |
| **Farmer** | Any registered email or click "Sign In / Register" | Custom | Farmer Dashboard, Predictions, Recommendations, AI Assistant, PDF Reports |

---

## 📄 License & Decision Support Notice

This platform provides agricultural decision-support guidance based on machine learning predictions and verified agronomic telemetry. Decisions should be corroborated with on-ground agricultural extension advice.
