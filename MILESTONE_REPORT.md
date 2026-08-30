\# Milestone 1 \& 2 Completion Report

\*\*Developer:\*\* Sanghavi S Avadhani

\*\*Branch:\*\* SANGHAVI-S-AVADHANI



\## Project Overview

The foundational architecture for the AI-Powered Crop Yield Prediction Platform is successfully deployed. The system currently features a fully authenticated full-stack pipeline connecting a machine learning prediction engine to an interactive Next.js web interface.



\## Technical Architecture Status



| Component | Technology Stack | Status |

| :--- | :--- | :--- |

| \*\*Database\*\* | PostgreSQL (Neon DB), SQLAlchemy | Active \& Secured |

| \*\*Backend API\*\* | FastAPI, Uvicorn, Python | Routing \& Auth Complete |

| \*\*Machine Learning\*\* | Scikit-Learn, Pandas, NumPy | Model Trained (`.pkl`) |

| \*\*Frontend\*\* | Next.js, React, Tailwind CSS | UI \& API Fetching Active |

| \*\*Data Visualization\*\*| Recharts | Interactive Charts Live |



\## Milestone 1: Backend \& Machine Learning Engine

\* \*\*Predictive Modeling:\*\* Engineered a Random Forest Regressor to analyze rainfall, temperature, pesticide usage, and geographic area. The trained artifact (`crop\_yield\_model.pkl`) is successfully integrated into the backend.

\* \*\*API Development:\*\* Constructed a FastAPI server exposing `/register`, `/login`, and `/predict` endpoints.

\* \*\*Security \& Auth:\*\* Implemented OAuth2 with JWT (JSON Web Tokens) and bcrypt password hashing to secure the API. Rotated and secured exposed database credentials via Neon.



\## Milestone 2: Frontend Integration \& Visualization

\* \*\*Cross-Origin Communication:\*\* Configured CORS middleware on the FastAPI backend to securely accept requests from the local Next.js development server.

\* \*\*Dynamic Authentication UI:\*\* Built a React login system that securely fetches and stores JWT access tokens in the browser's `localStorage` for persistent sessions.

\* \*\*Interactive Dashboard:\*\* Developed a user interface allowing farmers to input environmental metrics and receive real-time yield predictions.

\* \*\*Data Visualization:\*\* Integrated Recharts to render a comparative bar chart, dynamically mapping the user's predicted yield against standard regional benchmarks.

