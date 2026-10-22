# -*- coding: utf-8 -*-
"""
AgriYield AI Report Generator - Chapters 1 to 5
Executive Summary, Problem Statement, System Architecture, ML Pipeline, Modules
"""

from docx.shared import Inches, Pt
from .common import (
    add_p, add_heading_1, add_heading_2, add_heading_3,
    add_bullet, add_callout, add_table, COLOR_PRIMARY, COLOR_SECONDARY, COLOR_ACCENT
)


def write_chapters_1_to_5(doc):
    # ==========================================
    # CHAPTER 1: EXECUTIVE SUMMARY & PROJECT ABSTRACT
    # ==========================================
    add_heading_1(doc, "1. Executive Summary & Project Abstract")
    
    add_p(doc, 
          "AgriYield AI is an enterprise-grade agricultural intelligence and decision-support platform designed to transform longitudinal Indian district-level agricultural data into actionable, high-precision crop yield forecasts and contextual agronomic advisory. Agriculture forms the economic backbone of India, employing over 45% of the national workforce and contributing significantly to gross domestic product. Despite its pivotal importance, farm-level planning remains acutely vulnerable to erratic monsoon cycles, volatile weather patterns, suboptimal crop selection, and fragmented agro-advisory. Traditional yield estimation relies on post-harvest crop-cutting experiments (CCEs), which arrive months too late for preventive operational decision-making.",
          size=10.5)

    add_p(doc,
          "AgriYield AI bridges this critical informational gap through a synchronized, modern multi-tier web platform. The core intelligence engine is powered by an Extreme Gradient Boosting (XGBoost) regression model trained on 38 years of empirical agricultural data from the International Crops Research Institute for the Semi-Arid Tropics (ICRISAT). The model demonstrates state-of-the-art predictive performance, achieving an R² score of 0.8540, a Mean Absolute Error (MAE) of 237.72 Kg/ha, and a Root Mean Squared Error (RMSE) of 583.04 Kg/ha on held-out temporal test splits.",
          size=10.5)

    add_p(doc,
          "To translate raw numerical forecasts into practical farm-level actions, AgriYield AI integrates a dual Large Language Model (LLM) advisory subsystem utilizing Google Gemini 1.5 Flash and Groq Cloud (LLaMA 3.3 70B). This system generates localized, step-by-step agronomic guidelines spanning seedbed preparation, micro-irrigation scheduling, balanced NPK fertilization, pest prophylaxis, and harvest timing. Crucially, recognizing the connectivity constraints of rural farming communities, the platform features an instantaneous offline deterministic fallback engine ('Instant ML Mode'), ensuring zero-latency prediction delivery even during third-party AI downtime or network degradation.",
          size=10.5)

    add_p(doc,
          "The user experience is delivered through a high-performance React 19 single-page application supported by a robust FastAPI backend. The application implements role-based access control (RBAC) separating Farmers and System Administrators, features complete multilingual localization across major Indian regional languages, and provides a comprehensive farmer utility suite encompassing soil health analysis, multi-crop comparative economics, agro-meteorological weather tracking, multi-season crop rotation planning, precision seed calculators, and symptom-based pest diagnosis. Enterprise administration is reinforced by exhaustive telemetry, real-time user lifecycle management, brute-force security controls, and immutable authentication audit trails.",
          size=10.5)

    add_callout(doc, "Executive Deliverable Highlights",
                "• Core ML Performance: XGBoost Regressor achieving R² = 0.8540 across 20 Indian states and 311 districts.\n"
                "• Hybrid AI Architecture: Bounded 8s LLM reasoning (Gemini / Groq) with seamless Instant ML fallback.\n"
                "• Inclusive Localization: Multilingual support enabling seamless regional accessibility for Indian farmers.\n"
                "• Holistic Utility Suite: Six specialized calculators and advisory modules integrated into a unified portal.\n"
                "• Enterprise Governance: Bcrypt hashing, JWT tokens, 5-strike brute-force lockout, and immutable audit logs.",
                icon="🎯")

    doc.add_page_break()

    # ==========================================
    # CHAPTER 2: PROBLEM STATEMENT, RESEARCH BACKGROUND & OBJECTIVES
    # ==========================================
    add_heading_1(doc, "2. Problem Statement, Research Background & Objectives")

    add_heading_2(doc, "2.1 Problem Statement")
    add_p(doc,
          "Agricultural decision-making across Indian rural ecosystems faces severe systemic vulnerabilities characterized by three acute structural bottlenecks:",
          size=10.5)

    add_bullet(doc, " Farmers typically rely on traditional heuristics or localized ancestral habits when deciding which crops to sow, ignoring macro-scale climate shifts, historical regional productivity records, and soil depletion indicators.",
               bold_prefix="1. Information Asymmetry & Crop Mismatch:")

    add_bullet(doc, " Standard meteorological broadcasts provide general regional alerts but fail to provide farm-specific, crop-aligned operational guidance regarding sowing windows, moisture stress, and evaporation management.",
               bold_prefix="2. Weather Uncertainty & Climate Volatility:")

    add_bullet(doc, " Official agricultural extension services (Krishi Vigyan Kendras) have a limited personnel ratio relative to the farming population, resulting in delayed, generic, or inaccessible advisory for smallholder farmers.",
               bold_prefix="3. Inaccessible & Delayed Agro-Advisory:")

    add_bullet(doc, " Unscientific fertilizer application (particularly excessive nitrogenous urea application) severely disrupts the soil's natural N-P-K balance, degrading arable land, accelerating soil acidification, and escalating input costs without commensurate yield gains.",
               bold_prefix="4. Unbalanced Nutrient & Chemical Application:")

    add_heading_2(doc, "2.2 Research Background & Prior Work")
    add_p(doc,
          "Prior attempts in agricultural computing have largely fallen into two polarized extremes: purely academic statistical regression papers that lack an interactive web interface, or basic web calculators that rely on static, linear lookup tables without machine learning adaptability. Furthermore, existing commercial farm-management solutions frequently require complex proprietary IoT hardware installations that are economically unfeasible for small and marginal farmers owning less than two hectares of land.",
          size=10.5)

    add_p(doc,
          "AgriYield AI bridges this research gap by demonstrating an accessible, software-driven paradigm. By leveraging open district-level agricultural records curated over four decades by ICRISAT and government statistical bureaus, the system trains advanced gradient-boosted decision tree ensembles capable of modeling non-linear agronomic dependencies. Coupled with modern API microservices and lightweight mobile-first web technologies, AgriYield AI democratizes high-tier agricultural data science for everyday farmers.",
          size=10.5)

    add_heading_2(doc, "2.3 Concrete Project Objectives")
    add_p(doc, "The development of AgriYield AI was governed by five core engineering and domain objectives:", size=10.5)

    obj_headers = ["Objective ID", "Target Area", "Specific Measurable Goal"]
    obj_data = [
        ["OBJ-01", "Yield Forecasting", "Develop and validate an XGBoost regression model achieving R² > 0.80 and MAE < 250 Kg/ha on held-out temporal Indian agricultural test data."],
        ["OBJ-02", "Contextual Advisory", "Integrate dual generative AI providers (Gemini 1.5 Flash & Groq LLaMA 3.3) with strict 8s bounded timeouts and instant local fallback."],
        ["OBJ-03", "Farmer Utilities", "Deliver six dedicated farm-support tools: Soil NPK analysis, multi-crop comparison, weather monitoring, crop rotation, seed rate, and pest diagnosis."],
        ["OBJ-04", "Enterprise Security", "Implement role-based access control (RBAC), signed JWT sessions, Bcrypt password hashing, and automated 5-strike brute-force lockout."],
        ["OBJ-05", "Platform Governance", "Provide administrators with centralized monitoring, user status management, dataset versioning, audit logging, and CSV reporting."]
    ]
    add_table(doc, obj_headers, obj_data, [1.2, 1.8, 3.8])

    doc.add_page_break()

    # ==========================================
    # CHAPTER 3: SYSTEM ARCHITECTURE & TECHNOLOGY STACK
    # ==========================================
    add_heading_1(doc, "3. System Architecture & Technology Stack")

    add_p(doc,
          "AgriYield AI is engineered following a decoupled, layered microservices architecture comprising five core tiers: the Presentation Layer, the Application REST API Layer, the Machine Learning Engine Layer, the Generative AI Reasoning Layer, and the Operational Persistence & Security Layer. This modular separation guarantees high maintainability, independent component testability, and resilient error isolation.",
          size=10.5)

    arch_headers = ["Architectural Layer", "Primary Technologies", "Core Responsibilities & Components"]
    arch_data = [
        ["Presentation Layer", "React 19, Vite, Tailwind CSS, Lucide Icons", "Responsive UI, state management, interactive dashboards, multilingual localization, client-side report generation, CSV export."],
        ["Application API Layer", "FastAPI, Pydantic, Python 3.12, Uvicorn ASGI", "RESTful routing, strict input schema validation, JWT authentication middleware, rate limiting, error handling, CORS headers."],
        ["Machine Learning Layer", "XGBoost Regressor, Scikit-learn, Joblib, Pandas", "District-level yield inference, feature encoding, historical lag variable extraction, model metadata serialization."],
        ["Generative AI Layer", "Google Gemini 1.5 Flash, Groq Cloud, Local Rule Engine", "Bounded prompt synthesis, agronomic advisory generation, timeout management (8s), zero-latency deterministic fallback."],
        ["Persistence & Security", "JSON Operational Stores, Bcrypt, PyJWT, Python hashlib", "Role-based user records, prediction telemetry, login history, security lockout tracker, audit logs, dataset version registry."]
    ]
    add_table(doc, arch_headers, arch_data, [1.4, 2.0, 3.4])

    add_heading_2(doc, "3.1 Detailed Request Execution Flow")
    add_p(doc,
          "The end-to-end execution flow of an agricultural prediction and advisory request follows a rigorous, deterministic sequence:",
          size=10.5)

    add_bullet(doc, " The farmer selects state, district, crop, target year, cultivation area, and previous-year yield metrics in the React frontend. Client-side validation verifies numerical boundaries.",
               bold_prefix="Step 1 — Client Input & Validation:")

    add_bullet(doc, " The browser dispatches an authenticated HTTP POST request to `/api/predict` accompanied by a signed Bearer JWT in the Authorization header.",
               bold_prefix="Step 2 — Authenticated Transmission:")

    add_bullet(doc, " FastAPI routes the payload through Pydantic schemas (`PredictionRequest`), verifying data types, checking crop and district validity against dataset reference lists, and verifying JWT claims.",
               bold_prefix="Step 3 — API Middleware & Schema Verification:")

    add_bullet(doc, " The feature vector is assembled and passed to the deserialized `XGBRegressor` pipeline via Joblib. The model generates the expected yield in Kg/ha in under 15 milliseconds.",
               bold_prefix="Step 4 — High-Speed XGBoost Inference:")

    add_bullet(doc, " If the user requested full AI advisory, the backend initiates an asynchronous call to Google Gemini 1.5 Flash (or Groq). The call is governed by an 8-second timeout. If the remote service responds in time, the LLM advisory is attached; otherwise, the local rule engine immediately generates a structured agronomic advisory.",
               bold_prefix="Step 5 — Bounded Advisory Synthesis:")

    add_bullet(doc, " The complete prediction record (inputs, output yield, total production, advisory, timestamp, farmer ID) is persisted to the operational prediction store.",
               bold_prefix="Step 6 — Persistence & Audit Telemetry:")

    add_bullet(doc, " The client receives the structured JSON response, dynamically updating the results card, animated yield gauges, advisory breakdown, and download actions.",
               bold_prefix="Step 7 — Reactive Visual Delivery:")

    doc.add_page_break()

    # ==========================================
    # CHAPTER 4: DATASET ENGINEERING & MACHINE LEARNING FORMULATION
    # ==========================================
    add_heading_1(doc, "4. Dataset Engineering & Machine Learning Formulation")

    add_p(doc,
          "The predictive foundation of AgriYield AI is built upon the ICRISAT (International Crops Research Institute for the Semi-Arid Tropics) Meso-Level District Agricultural Dataset for India. This empirical repository covers 38 years of longitudinal agricultural records spanning 1979 through 2017, encompassing 20 states and 311 agricultural districts across India.",
          size=10.5)

    add_heading_2(doc, "4.1 Data Preprocessing & Feature Engineering")
    add_p(doc,
          "The raw ICRISAT dataset is structured in a wide relational format, with distinct columns for individual crop production and cultivated area per district-year observation. To prepare this data for gradient-boosted tree modeling, a multi-phase data pipeline was developed:",
          size=10.5)

    add_bullet(doc, " The wide matrix of 12,418 district-year records was unpivoted into 285,614 crop-specific observations, standardizing crop names, hectare units, and production yields in kilograms per hectare (Kg/ha).",
               bold_prefix="1. Wide-to-Long Reshaping:")

    add_bullet(doc, " Agricultural yields exhibit strong temporal auto-correlation. To equip the model with longitudinal memory, lagged variables were synthesized for each district-crop series: `Previous_Year_Yield`, `Previous_Year_Area`, and `Previous_Year_Production` (at t-1).",
               bold_prefix="2. Longitudinal Lag Variable Creation:")

    add_bullet(doc, " Historical records prior to 1979 containing sparse or unverified crop statistics were filtered. String categorical features (`State Name`, `Dist Name`, `Crop`) were harmonized and encoded using scikit-learn OneHotEncoder / Target Encoding pipelines.",
               bold_prefix="3. Cleaning & Categorical Encoding:")

    add_bullet(doc, " Standard random k-fold cross-validation is fundamentally invalid for time-series agricultural forecasting as it leaks future climate and technological advancements into past predictions. Therefore, a strict chronological split was enforced: records from 1979 to 2009 formed the training set, while records from 2010 to 2017 were held out exclusively for out-of-time evaluation.",
               bold_prefix="4. Temporal Chronological Train/Test Partitioning:")

    add_heading_2(doc, "4.2 Model Selection & Hyperparameter Optimization")
    add_p(doc,
          "Multiple regression algorithms were evaluated during experimentation, including Multiple Linear Regression, Decision Tree Regressors, Random Forest Ensembles, and Extreme Gradient Boosting (XGBoost). XGBoost was selected as the optimal production architecture due to its superior handling of non-linear interactions, built-in L1/L2 regularization to prevent overfitting on sparse district data, and exceptionally fast inference latency.",
          size=10.5)

    ml_headers = ["Algorithm Evaluated", "Validation R²", "Validation MAE (Kg/ha)", "Inference Latency", "Model Status"]
    ml_data = [
        ["Multiple Linear Regression", "0.5824", "492.15", "1.2 ms", "Baseline; underfits non-linear geography"],
        ["Decision Tree Regressor", "0.7108", "364.80", "2.1 ms", "Prone to severe leaf overfitting"],
        ["Random Forest Regressor", "0.8215", "265.40", "48.5 ms", "Strong accuracy; large memory footprint"],
        ["XGBoost Regressor (Final)", "0.8540", "237.72", "12.4 ms", "Selected: Highest R², lowest MAE, compact size"]
    ]
    add_table(doc, ml_headers, ml_data, [1.8, 1.2, 1.6, 1.1, 1.1])

    add_heading_3(doc, "Final XGBoost Model Hyperparameters")
    param_headers = ["Hyperparameter", "Configured Value", "Technical Justification"]
    param_data = [
        ["algorithm", "XGBRegressor", "Gradient boosted decision tree regression framework with tree booster."],
        ["n_estimators", "200", "Provides sufficient boosting iterations without over-fitting residuals."],
        ["max_depth", "4", "Constrains tree depth to prevent memorizing rare district-level anomalies."],
        ["learning_rate (eta)", "0.05", "Shrinkage parameter that scales step size, preventing overshoot during descent."],
        ["random_state", "42", "Guarantees reproducible tree generation and identical deterministic outputs."],
        ["objective", "reg:squarederror", "Minimizes mean squared error loss function across continuous yield outcomes."]
    ]
    add_table(doc, param_headers, param_data, [1.8, 1.4, 3.6])

    add_heading_2(doc, "4.3 Quantitative Evaluation Metrics")
    add_p(doc,
          "The final deployed XGBoost model (`backend/models/agri_yield_xgboost.joblib`) was evaluated against the held-out 2010–2017 dataset. The evaluation metrics recorded in `model_metadata.json` confirm exceptional generalization:",
          size=10.5)

    add_bullet(doc, " Measures the average magnitude of absolute prediction errors. On average, the model's yield forecast deviates by only 237.72 Kg/ha from the actual historical harvest across all crops and regions.",
               bold_prefix="• Mean Absolute Error (MAE): 237.72 Kg/ha —")

    add_bullet(doc, " Penalizes larger outlier errors more heavily. The RMSE of 583.04 Kg/ha indicates that extreme prediction errors are tightly controlled despite agricultural volatility.",
               bold_prefix="• Root Mean Squared Error (RMSE): 583.04 Kg/ha —")

    add_bullet(doc, " Indicates that 85.4% of the total variance in crop yield across 311 Indian districts over eight continuous years is successfully explained by the feature representation.",
               bold_prefix="• Coefficient of Determination (R²): 0.8540 (85.4%) —")

    doc.add_page_break()

    # ==========================================
    # CHAPTER 5: SYSTEM MODULES & FUNCTIONAL BREAKDOWN
    # ==========================================
    add_heading_1(doc, "5. System Modules & Functional Breakdown")

    add_p(doc,
          "AgriYield AI is partitioned into ten specialized functional modules designed to serve two primary user personas: Farmers seeking actionable operational guidance, and Platform Administrators managing system governance, security, and telemetry.",
          size=10.5)

    modules_headers = ["Module #", "Module Name", "Target Persona", "Primary Functional Scope"]
    modules_data = [
        ["MOD-01", "User Authentication & RBAC", "Farmer & Admin", "Registration, Bcrypt sign-in, JWT token generation, role segregation, 5-strike lockout."],
        ["MOD-02", "Public Landing & Information", "Public Visitors", "Hero platform overview, value propositions, navigation bar, quick entry points."],
        ["MOD-03", "Farmer Workspace Dashboard", "Farmer", "Personalized command center, weather overview, recent predictions, quick tool links."],
        ["MOD-04", "Multilingual Localization", "Farmer", "Dynamic language switcher supporting major regional Indian languages for all UI labels."],
        ["MOD-05", "ML Yield Prediction Engine", "Farmer", "XGBoost inference, dual LLM advisory (Gemini/Groq), instant offline ML fallback."],
        ["MOD-06", "Soil NPK & Fertilizer Advisory", "Farmer", "Nutrient ratio balancing (N, P, K, pH), crop-specific chemical & organic dosage calculators."],
        ["MOD-07", "Multi-Crop Comparative Planner", "Farmer", "Side-by-side economic, yield, and water-requirement comparisons for crop selection."],
        ["MOD-08", "Farmer Historical Records", "Farmer", "Chronological audit logs of prior forecasts, seasonal trends, and downloadable CSV records."],
        ["MOD-09", "Specialized Farmer Utility Hub", "Farmer", "Weather analysis, crop rotation planner, seed density calculator, pest diagnosis."],
        ["MOD-10", "Admin Intelligence & Governance", "Admin", "User lifecycle controls, global prediction monitoring, security audit trails, telemetry."]
    ]
    add_table(doc, modules_headers, modules_data, [0.9, 2.0, 1.2, 2.7])

    add_callout(doc, "Architectural Modularity Guarantee",
                "Each module functions as an autonomous, testable unit. The failure of external services (such as remote LLMs or weather APIs) is gracefully contained by local fallback handlers, ensuring that the primary predictive capabilities of the platform remain 100% operational under all circumstances.",
                icon="🛡️")

    doc.add_page_break()
