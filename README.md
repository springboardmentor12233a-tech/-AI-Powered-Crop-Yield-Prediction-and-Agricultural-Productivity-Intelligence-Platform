 YieldSense AI — Precision Agronomic Forecasting & Agro-Economic Advisory Platform

YieldSense AI is a full-stack, enterprise-grade precision agricultural yield prediction and agro-economic advisory web application built for Indian agriculture. It delivers calibrated crop yield forecasts across 16+ Indian states and agro-climatic zones, combines Random Forest machine learning with official Central Minimum Support Price (MSP) analytics, and provides role-based data isolation for individual commercial farmers and platform administrators.

---

📌 Table of Contents
- Project Overview
- Key Features & Implemented Work
- System Architecture
- Tech Stack
- Repository Structure
- Installation & Setup
- Running the Project
- Pre-Configured Accounts
- API Documentation
- Data Privacy & Multi-Tenancy Design
- Author & Acknowledgments

---
Project Overview
Indian agriculture faces major challenges with volatile seasonal yields, uncalibrated chemical input usage (fertilizers and pesticides), and price uncertainty. YieldSense AI bridges the gap between field agronomy and financial realization by providing:
1. Accurate Yield Forecasting: Predicts crop yield in tonnes per hectare ($t/ha$) and total harvest production in tonnes ($t$).
2. MSP Revenue Advisory:Translates predicted yields into expected gross market revenue based on Government of India Minimum Support Prices (MSP) in Indian Rupees (₹ / Rs.).
3. Chemical Intensity Benchmarks: Computes live dosage rates ($kg/ha$) for fertilizers and pesticides to prevent overuse and promote soil health.
4. Data Privacy & Tenant Isolation:** Ensures that every farmer's operational history remains strictly confidential, with centralized audit access reserved for authorized agricultural administrators.

---

Key Features & Implemented Work

1. Multi-Crop Agricultural Network & High-Res Visuals
- Verified Crop Photography:** Real-time visual cards with high-resolution imagery for major Indian crops:
  - Cotton: Kharif lint fiber with bollworm defense parameters (MSP: ₹71,200/t).
  - Sugarcane: High-tonnage sucrose cane with year-round irrigation cycles (MSP: ₹3,400/t).
  - Soyabean: High-protein oilseed with nitrogen-fixation tracking (MSP: ₹48,920/t).
  - Rice (Paddy), Wheat, Maize, Groundnut, Mustard:** Complete multi-crop profiles with seasonal constraints.
- Dynamic Crop Color Theming: Automatic UI palette adaptation (Indigo for Cotton, Amber for Sugarcane, Emerald Green for Soyabean) with custom badge accents.
- Interactive Farm Scenery Switcher:4 switchable high-resolution Indian farm themes:
  - Lush Green Farmland (Central & Western India)
  - Golden Wheat Harvest (Punjab & North India)
  - Emerald Paddy Terraces (South & East India)
  - Sunlit Precision Agro-Fields (Deccan & All-India Plains)

2. Random Forest Yield Prediction Engine
- Dual-engine prediction architecture:
  - Primary: High-performance FastAPI REST API (`/predict`) running a Scikit-learn Random Forest Regressor.
  - Fallback/Standalone: In-browser agronomic simulation engine factoring in crop baselines, non-linear chemical diminishing returns, and regional soil/agro-climatic multipliers.
- Real-time input parameter sliders:
  - Cultivated Land Area (1 to 500+ hectares)
  - Fertilizer Quantity (kg) with live $kg/ha$ intensity indicator
  - Pesticide Quantity (kg) with live $kg/ha$ intensity indicator
  - Season (Kharif, Rabi, Summer, Whole Year)
  - State (Maharashtra, Punjab, Gujarat, Uttar Pradesh, Madhya Pradesh, Karnataka, Andhra Pradesh, Tamil Nadu, Haryana, Rajasthan, Telangana, Bihar, West Bengal, Odisha, Kerala, Assam)

3. Comprehensive Prediction Result Modal
- Selected crop photographic preview.
- Expected Yield per Hectare ($t/ha$).
- Total Estimated Production ($t$).
- Gross Market Value Valuation calculated at official Central MSP rates ($₹$).
- Agronomic Efficiency Score and chemical dosage safety badges.
- Post-Harvest Feedback Loop: Farmers can submit verified post-harvest yields and 5-star validation ratings to continuously improve model accuracy.

4. Commercial Ledger with Strict Data Isolation
- Farmer Privacy: Farmers only see their own historical predictions (`My Farm Prediction Ledger`), completely isolated from other users' records.
- Administrator Platform Audit: Administrator (Tejaswini Dalavi) has master access to the platform-wide audit trail with:
  - Real-time farmer filtering dropdown (`ALL` or specific farmer account).
  - Multi-tenant record inspection.
  - One-click **CSV Ledger Export (`Download Audit CSV` / `Download My Ledger CSV`) for offline spreadsheet analysis in Excel or Google Sheets.

5. Production-Ready Authentication System
- Clean Authentication Screen:** Eliminated all demo shortcut buttons, 1-click logins, and auto-fills to ensure a realistic, secure experience.
- Role-Based Portal Switcher: Dedicated login flows for Farmer / User* and Administrator.
- Anti-Autofill Protection: Dummy form shields to prevent aggressive browser password managers from injecting stale session data.
- Self-Service Registration Modal: New farmers can register by providing their name, email, secure password, primary state, and farmer classification (Commercial Farmer, Smallholder, Agronomist).
- Password Recovery: Integrated account recovery verification modal.

---

🏗 System Architecture
                ┌──────────────────────────────────────────────┐
                │          YieldSense AI Web Client            │
                │   (React 18 + Vite + Responsive Tailwind/UI) │
                └──────────────────────┬───────────────────────┘
                                       │
                    RESTful HTTP API   │  HTTP / JSON
                    JSON Payloads      │
                                       ▼
                ┌──────────────────────────────────────────────┐
                │               FastAPI Backend                │
                │            (Uvicorn ASGI Server)             │
                └──────┬───────────────┬────────────────┬──────┘
                       │               │                │
        Authentication │               │ ML Inference   │ Data Persistence
                       ▼               ▼                ▼
                ┌────────────┐  ┌─────────────┐  ┌──────────────┐
                │ Passlib    │  │ Scikit-Learn│  │ SQLite DB    │
                │ Password   │  │ Random      │  │ SQLAlchemy   │
                │ Hashing    │  │ Forest Model│  │ Models       │
                └────────────┘  └─────────────┘  └──────────────┘


yieldsense-ai/
├── backend/                        -- FastAPI Application
│   ├── app/
│   │   ├── database/               -- Database connection and SQLAlchemy models
│   │   │   ├── database.py
│   │   │   └── models.py
│   │   ├── routes/                 -- API route handlers
│   │   │   ├── auth.py             -- User registration & JWT authentication
│   │   │   ├── crops.py            -- Crop metadata & MSP baselines
│   │   │   ├── prediction.py       -- ML inference endpoints
│   │   │   ├── dashboard.py        -- Analytics & summary KPI feeds
│   │   │   ├── weather.py          -- Agro-climatic weather advisory
│   │   │   └── recommendations.py  -- Agronomic input recommendations
│   │   ├── utils/
│   │   │   └── security.py         -- Password hashing & verification
│   │   └── main.py                 -- FastAPI initialization & account seeders
│   └── requirements.txt            -- Python backend dependencies
│
├── frontend/                       -- Vite React Frontend
│   ├── src/
│   │   ├── App.jsx                 -- Unified application (Auth, Predictor, Ledger, Admin)
│   │   └── main.jsx                -- React DOM entry point
│   ├── public/                     -- Static assets
│   ├── index.html                  -- HTML5 application template
│   ├── vite.config.js              -- Vite server & build configuration
│   └── package.json                -- NPM packages and build scripts
│
├── ml/                             -- Machine Learning Resources
│   ├── data/                       -- Agricultural datasets & historical records
│   ├── training/                   -- Model training scripts
│   └── saved_models/               -- Serialized Random Forest model (.pkl / .joblib)
│
└── README.md                       -- Comprehensive Project Documentation
API Docs-
GET / — Health check & system status.

POST /auth/login — User authentication and token issuance.

POST /auth/register — New farmer registration.

POST /predict — Random Forest crop yield inference.

GET /crops — Supported crop metadata, MSP baselines, and seasonal parameters.

GET /weather — Weather data feed for regional agro-climatic zones.

GET /soil — Soil composition and nitrogen/phosphorus/potassium (NPK) advisory.

Data Privacy & Multi-Tenancy Design

Storage Isolation: User histories are tagged with the creator's email address (userEmail).

Client-Side Filtering: When logged in as a farmer, the Commercial Ledger strictly queries records where entry.userEmail.toLowerCase() === currentUser.email.toLowerCase(). Farmers never see entries from other farms.

Master Audit Governance: Administrators possess elevated permissions (isAdmin === true) that bypass tenant filters to allow monitoring compliance, tracking state-wide harvest volumes, and generating official consolidated CSV audit reports.

Session Sanitization: The application state clears sensitive credentials on logout and prevents unauthorized access to protected dashboard tabs.


















