# YieldSense AI
## Milestone 3: Dashboard, Reporting & Recommendations

### 1. Objective
Milestone 3 connects persisted CatBoost predictions with analytics, reporting, risk assessment, and agricultural decision support while preserving the existing model, weather, and soil layers.

### 2. Dashboard Development
The dashboard uses the persisted prediction history endpoint for the latest yield, crop, season, prediction ID, and recent activity. Weather remains supplied by the existing Open-Meteo provider. Soil status remains supplied by the existing SoilGrids/user-test analysis. Metrics without a reliable source, such as season progress, are shown as unavailable rather than fabricated.

### 3. Analytics
FastAPI provides:
- `GET /api/analytics/summary`
- `GET /api/analytics/history`
- `GET /api/analytics/crops`
- `GET /api/analytics/seasons`

The aggregations operate on stored `predictions` records and support crop, state, season, and year filters. Crop and seasonal averages are calculated from persisted predicted yields.

### 4. Reporting
`GET /api/reports/summary` returns report data based on the selected filters. `GET /api/reports/pdf` produces a downloadable PDF containing report date, summary yields, crop productivity, seasonal productivity, and available history.

### 5. Visualization
The existing CSS comparison bars are retained. Their widths and labels are now calculated from backend crop/season averages instead of fixed sample values.

### 6. Recommendation Workflow
```text
Crop/Farm Data
    -> CatBoost Prediction
    -> Persisted Prediction ID
    -> Open-Meteo Weather
    -> SoilGrids/User Soil Analysis
    -> Deterministic Weather/Soil Risk Rules
    -> Unified Risk Context
    -> FastAPI /api/recommendations
    -> Groq Structured Decision Support
    -> Frontend Farming Recommendations
    -> Dashboard Summary
```

### 7. Groq Integration
Groq is called by the backend recommendation service using `GROQ_API_KEY` and `GROQ_MODEL` environment variables. The frontend sends context to FastAPI and never contains the Groq key. The context includes crop, location, season, persisted yield, weather, soil, rule analysis, and detected risks. The response is structured JSON containing summary, outlook, risks, and recommendations.

### 8. Risk Assessment
Weather risk uses the existing crop-specific numeric weather rules. Soil risk uses the existing soil-analysis warnings. Yield risk is calculated from available predicted yield: below 2 t/ha is high, 2-4 t/ha is moderate, and 4 t/ha or greater is low. Overall risk is the highest available component, with unavailable used when no component exists. These thresholds are documented in `backend/risk.py` and are screening rules, not agronomic prescriptions.

### 9. Database / Prediction Persistence
The backend creates a minimal `predictions` table when persistence is first used. Each successful prediction receives a UUID, crop, state, district, season, year, yield, creation time, and JSON context. The prediction response preserves the existing `predicted_yield` and `unit` fields and adds `prediction_id`.

### 10. End-to-End Workflow
The prediction endpoint continues to use the unchanged CatBoost feature list and engineered features. Its result is persisted and exposed to history and analytics. Weather and soil remain separate services. Recommendations use the backend Groq boundary and do not calculate yield.

### 11. Testing
Performed during implementation:
- Python compilation of backend modules.
- Vite production build.
- Existing frontend diagnostic checks.
- Endpoint wiring inspection for prediction, analytics, report, and recommendation routes.

A full database-backed browser workflow requires PostgreSQL credentials and a running database configured through environment variables.

### 12. Technologies Used
- React and Vite
- React Router
- FastAPI
- Pydantic
- CatBoost
- PostgreSQL / psycopg2
- Open-Meteo
- SoilGrids / ISRIC
- Groq server-side API integration

### 13. Milestone 3 Outcomes
The implementation adds persisted analytics and recommendation infrastructure, dynamic productivity/seasonal aggregations, report endpoints, dynamic visual comparison bars, server-side AI decision support, and unified risk context.

### 14. Screenshots / UI Sections
The existing Dashboard, Analytics & Reports, Soil Health, Weather, and AI Recommendations routes are reused. No fabricated screenshots are included.

### 15. Conclusion
Milestone 3 is connected to real prediction persistence and backend analytics/recommendation routes. Database configuration and Groq credentials must be supplied through environment variables before full production execution.
