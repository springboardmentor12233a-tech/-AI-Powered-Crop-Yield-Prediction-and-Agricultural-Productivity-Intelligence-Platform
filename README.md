# YieldSense AI – Crop Yield Prediction & Agricultural Productivity Forecasting System

**YieldSense AI** is a full-stack, data-driven agricultural intelligence platform designed to forecast crop productivity, analyze soil and weather profiles, and provide actionable analytics to optimize yield output.

---

## 1. Project Overview

### Problem Statement
Traditional farming relies on historical intuition and aggregate estimations, leaving farmers highly vulnerable to erratic climate shifts, sudden weather volatility, and hidden soil deficiencies. The absence of field-level predictions leads to inefficient fertilizer application, bad crop selections, and high financial risks.

### Proposed Solution
**YieldSense AI** solves this problem by combining historical dataset structures (meteorological patterns and soil profiles) with Machine Learning predictive models. By analyzing continuous inputs (such as pH levels, nitrogen content, rain metrics, and temperatures) alongside categorical crop cultivars, the platform generates localized yield forecasts. This empowers farmers to maximize field efficiency and minimize input overheads.

### Week 1 Scope
1. Set up project folder layouts and structure.
2. Integrate a local, portable PostgreSQL v16 server instance to allow offline, self-contained data transactions on port `5432` without administrative dependencies.
3. Establish FastAPI backend application with database tables migration, environment configuration, CORS, JWT-token authentication, and role security (Farmer/Administrator).
4. Build responsive, modern React frontend views styled with Tailwind CSS, including Login, Registration, Dashboard, Farm Fields register, and Crops logs.
5. Ingest a real agricultural dataset (`Crop_yield.csv`) containing negative-value climate anomalies, perform thorough Exploratory Data Analysis, and write an unbuffered cleaning/preprocessing script.

---

## 2. Technology Stack
- **Frontend**: React + Vite + Tailwind CSS + React Router + Lucide Icons + Axios
- **Backend**: Python FastAPI + SQLAlchemy (ORM) + Pydantic (validation) + Passlib (bcrypt hashing) + Python-Jose (JWT)
- **Database**: PostgreSQL (v16 local portable binary server)
- **Data / EDA**: Python + Pandas + NumPy + Matplotlib + Seaborn + Jupyter Notebook

---

## 3. Project Structure
```
YieldSense-AI/
│
├── frontend/                     # React Vite app
│   ├── src/
│   │   ├── pages/                # Login, Register, Dashboard, Farm, Crop views
│   │   ├── api.js                # Axios client with JWT header injection
│   │   ├── App.jsx               # App routing and Layout shell
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── package.json
│
├── backend/                      # FastAPI Python service
│   ├── app/
│   │   ├── auth/                 # Bcrypt hashing and JWT functions
│   │   ├── db/                   # Database session, config, and models
│   │   ├── services/             # Pandas data preprocessing logic
│   │   └── main.py               # Main API routes mapping
│   ├── requirements.txt
│   └── .env.example
│
├── dataset/                      # Agricultural datasets repository
│   ├── raw/                      # Raw source files
│   │   ├── faostat/
│   │   ├── kaggle_crop_yield/
│   │   ├── usda/
│   │   ├── weather/
│   │   └── soil/
│   ├── processed/                # Output cleaned CSV files
│   └── README.md
│
├── notebooks/                    # Analytical Jupyter Notebooks
│   └── EDA_Crop_Yield.ipynb      # Complete 20-step Exploratory Data analysis
│
├── docs/                         # Platform Design Docs
│   ├── architecture/             # Multi-tier diagrams and data flows
│   ├── database/                 # ER schemas, indexes, and FK structures
│   └── ui_workflow.md            # Page routing layouts
│
├── scripts/                      # Setup and automation scripts
│   ├── setup_postgres.py         # Postgres server download and init script
│   └── generate_eda_notebook.py  # Automated notebook compiler and execution runner
│
├── .gitignore
├── docker-compose.yml            # Docker PG service configuration (fallback)
└── README.md
```

---

## 4. Database Schema Design

We support five tables in our schema with complete relational cascade updates and deletions:
1. **`users`**: Manages auth profiles. Assigns role-based authorizations: `Farmer` (restricted to own resources) or `Administrator` (global oversight).
2. **`farms`**: Logs fields owned by users. Validates size bounds ($> 0$ acres) and specifies soil profile types.
3. **`crops`**: Logs crops grown inside farms. Connects sowing, harvesting, and historical yield data in tons/acre.
4. **`weather_data`**: Chronological weather variables (temperatures, rainfall, humidity) linked to fields.
5. **`soil_data`**: Soil chemical indexes (nitrogen, phosphorus, potassium, pH metrics) linked to fields.

Refer to the [docs/database/README.md](file:///C:/Users/sirib/.gemini/antigravity/scratch/YieldSense-AI/docs/database/README.md) file for table keys and constraints.

---

## 5. Setup & Installation Instructions

### Prerequisites
- Python 3.12+
- Node.js v22+
- Git

### Database Setup (Portable Local PostgreSQL)
1. Run the database configuration script to set up PostgreSQL in the workspace:
   ```bash
   python scripts/setup_postgres.py
   ```
   This downloads the binaries, initializes a data cluster inside `postgres/data/`, starts the server, and creates the `yieldsense_db` database on port `5432`.
2. To stop or start this local database at a later stage, use the batch commands inside the `postgres/bin` directory or use `pg_ctl`.

### Backend Setup
1. Create and activate a Python virtual environment:
   ```bash
   cd backend
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Unix/macOS:
   source venv/bin/activate
   ```
2. Install pip dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy environment configurations:
   ```bash
   cp .env.example .env
   ```
4. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The interactive Swagger API documentation will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Boot the local development server:
   ```bash
   npm run dev
   ```
   Open the browser at the Vite local link [http://127.0.0.1:3000](http://127.0.0.1:3000).

---

## 6. Preprocessing & EDA Pipeline

To execute the data preprocessing and notebook analysis:
1. Make sure your backend virtual environment is active.
2. Run the preprocessing script:
   ```bash
   python backend/app/services/preprocessing.py
   ```
   This cleans anomalous negative entries in `Rainfall` and `Yield` columns and writes the standardized file output to `dataset/processed/crop_yield_cleaned.csv`.
3. To view or re-run the EDA notebook:
   ```bash
   jupyter notebook notebooks/EDA_Crop_Yield.ipynb
   ```

---

## 7. Future Milestones
- **Milestone 2**: Implement ML models (XGBoost / Random Forest) trained on the preprocessed variables to calculate crop yields, integrate OpenWeather API queries, and launch soil optimization suggestions.
- **Milestone 3**: Add crop risk alarms, fertilizer recommendation engine, interactive dashboard charts, and deploy database and app containers via Docker.
