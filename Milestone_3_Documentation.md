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
At startup, the FastAPI lifespan creates the `users` and `predictions` tables when absent and adds a nullable `predictions.user_id` column plus an index when needed. Existing prediction records are preserved. Each successful prediction receives a UUID, crop, state, district, season, year, yield, creation time, JSON context, and (for authenticated predictions) its Farmer's user ID. The prediction response preserves the existing `predicted_yield` and `unit` fields and adds `prediction_id`.

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

### 16. Serving CatBoost Artifact Validation
The serving artifact is `backend/models/yieldsense_final_catboost.cbm`. Run `python backend/validate_serving_model.py` from the repository root to load it, confirm its 12-feature order, and evaluate it against `dataset/final_cleaned_crop_yield_test.csv`. The local evaluation used 3,131 valid rows and produced MAE 22.355754, RMSE 187.942766, and R² 0.959637. These are regression metrics, not an accuracy percentage.

The notebook contains results for several separate model configurations and datasets. The metrics in `models/engineered_catboost_metrics.json` and `models/soil_weather_model_metrics.json` describe other artifacts and must not be attributed to the serving artifact. The checked-in notebook documents related training workflows, but its saved artifact and data split have not been byte-for-byte linked to the ignored serving model file; the reproducible evaluation above is the verified performance result for the artifact currently loaded by FastAPI.

### 17. Local Authentication Configuration
Backend secrets belong in the ignored `backend/.env` file. Configure a stable, random `YIELDSENSE_JWT_SECRET` and explicit `YIELDSENSE_CORS_ORIGINS` for local browser use. The safe variable-name template is `backend/.env.example`. Frontend environment files must not contain Groq credentials because Groq requests are made by the backend.

### 18. Milestone 4 Authentication and Data Access
Public registration creates Farmer accounts only; the submitted role is not trusted. Passwords are stored as PBKDF2-SHA256 hashes. Login returns a JWT, `/api/auth/me` returns the authenticated account's public fields, and protected backend dependencies enforce Farmer/Admin roles. Admin creation is restricted to the local `backend/bootstrap_admin.py` CLI, which reads configured values from the environment or requests them interactively (the password prompt is hidden). No public Admin registration endpoint exists.

The React app starts at the launch page, continues through role selection and separate Farmer/Admin login pages, and keeps the existing Farmer routes under the authenticated Farmer shell. Admin pages are under `/admin/*`. Farmer prediction, analytics, history, report, and recommendation requests are authorized and scoped to the authenticated account; Admin endpoints retain system-wide access. User listings omit password fields and hashes. The Profile page displays the authenticated account's name, email, role, and server-provided creation date. Crop, season, and location preferences are stored locally in the browser per user and are not represented as PostgreSQL account data.

The `predictions.user_id` column is nullable so legacy prediction rows remain intact. Farmer-facing analytics/history do not include unowned legacy rows; Admin views can still access all stored predictions. New predictions are associated with the authenticated Farmer. The CatBoost serving artifact, feature engineering, and yield calculation were not changed.

### 19. Final Verification Results
The following checks were executed against the local PostgreSQL-backed application and browser build:

- Database startup/schema check confirmed `users` and `predictions.user_id` are present without deleting existing prediction rows.
- The expanded verification script completed **34/34 PASS**, covering Farmer registration, duplicate registration, role-tampering attempts, Farmer/Admin login, `/api/auth/me`, invalid credentials/JWT, missing JWT, Farmer/Admin authorization, users, prediction/history ownership isolation across two Farmers, Admin analytics, recommendations, risk, and populated/empty-filter PDF responses.
- Browser flow verified launch/roles, Farmer registration and login, dynamic authenticated name/profile data, redirect to the existing Farmer dashboard, and a real prediction response of 38.63 t/ha persisted to history. The Farmer's attempt to enter an Admin route redirected away.
- Browser Admin login reached `/admin/dashboard`. Overview, Users, User Prediction History, All Predictions, Analytics, Reports, Recommendations, and Risk Assessment rendered. User-history filtering returned the selected Farmer's record; the Admin user list did not expose password hashes. The Admin recommendations panel correctly reported that it has no persisted system-wide recommendation records.
- The Farmer recommendation UI generated and displayed structured insights through the backend. Weather rendered live data in a later browser check. Soil rendered its unavailable/insufficient-data state without crashing; live soil data was not available during the observed check.
- The browser's PDF action received HTTP 200 with `application/pdf`; the database-backed verification also checked the returned PDF signature/content. The browser automation did not capture a download-event notification, so only the response and PDF content—not the browser's saved-file dialog—were verified.
- Public and Farmer routes (11 routes) and Admin routes (8 sections) were checked at 1440 px, 768 px, and 390 px viewport widths; no document-level horizontal overflow was measured. Mobile navigation opened/closed, saved per-user preferences survived reload, role remained read-only, and logout returned to Farmer login and cleared the browser token.
- Serving-artifact validation loaded the existing CatBoost model, checked its 12-feature order, and evaluated 3,131 rows: MAE 22.355754, RMSE 187.942766, R² 0.959637. These are regression metrics, not an accuracy percentage. The separate live API prediction check validates request/response/persistence, not model performance.
- The frontend production build, backend Python compilation/import checks, Pylance syntax checks, and `git diff --check` passed. Frontend lint exited successfully with existing React-effect warnings about asynchronous state updates and a dependency warning; no lint errors were reported.
- Browser-created QA accounts and their associated prediction were removed after the UI checks. No other PostgreSQL users or prediction rows were deleted.

### 20. Remaining Items Before Deployment
This was local verification only; the application was not deployed. Before production use, configure stable production JWT/database/CORS settings and HTTPS, establish operational database backup/migration procedures, and run deployment-environment checks for external weather, soil, and Groq credentials and availability. Legacy predictions without an owner remain intentionally unassigned rather than being attributed to a Farmer. Soil data availability and a browser download-manager event were not fully verified in this local browser session.

### 21. Dynamic Data, Analytics, and Reporting Audit
Prediction form categories now come from the serving dataset rather than fixed crop/state/season lists. Farmer analytics and Admin analytics/reports use prediction-backed filter options and filtered records; summaries, charts, and history tables are calculated from the same filtered results. The Admin Recommendations navigation was removed because the system does not persist system-wide recommendation records. Farmer recommendations require that Farmer's own saved prediction and no longer silently use Rice or Kharif as fallback context.

Farmer account location is optional and is updated from that Farmer's newly saved prediction. SoilGrids coverage and laboratory-entered values are distinguished in the UI; broad regional training samples are not presented as field measurements. Existing prediction rows remain intact, and the nullable `predictions.user_id` continues to leave legacy rows unassigned. Nullable saved location columns were added to `users`.

Filtered PDF reports are now role-specific: Farmer reports contain only that Farmer's records and profile context, while Admin reports contain filtered system-wide prediction aggregates and account totals. Both include structured summaries, charts and tabular history, with an explicit no-data result when filters match no records. ReportLab is listed in `requirements.txt` as the PDF renderer. Risk assessments are not stored per prediction, so reports do not fabricate a risk-distribution chart.

The shared theme control is available in both Farmer and Admin headers. New chart layouts and existing responsive tables/filters were checked at desktop, tablet, and mobile viewport widths. A short-lived in-flight GET deduplication guard was added to analytics/Admin services, keyed by both request URL and auth token.

The audit verification observed the existing CatBoost artifact load and reproduce its documented test-set evaluation: 3,131 rows, MAE 22.355754, RMSE 187.942766, and R² 0.959637. This evaluation is separate from API prediction tests. The PostgreSQL-backed authentication/RBAC/API verification suite passed 34/34 checks. Additional PostgreSQL checks confirmed the expected user/location and prediction ownership columns, filtered Admin analytics/report summaries, and an Admin PDF response with a valid PDF signature. No existing prediction rows were deleted.

Browser checks rendered the launch, role selection, farmer login, and registration flow; the Admin Overview, Users, User Prediction History, All Predictions, Analytics, Reports, and Risk Assessment views rendered against representative mocked API responses. The Admin view showed data tables/charts, dark theme colors applied, and no document-level horizontal overflow at 1440, 768, or 390 px. These Admin UI data checks used mocked responses; corresponding backend access and filtered report/PDF behavior were tested separately against the local PostgreSQL-backed API. The frontend build passed. Frontend lint exited successfully with React effect/state warnings in `App.jsx`; these are recorded rather than treated as lint errors.

### 22. Remaining Audit Limitations
The browser Admin component checks used mocked responses, not an authenticated browser session. SoilGrids coverage still depends on the external service and can legitimately return unavailable measurements; laboratory values are browser-local. Weather, soil, and Groq availability should be rechecked in the deployment environment. Risk context is not persisted with prediction rows, and older prediction rows remain unassigned. No deployment or commit was performed.
