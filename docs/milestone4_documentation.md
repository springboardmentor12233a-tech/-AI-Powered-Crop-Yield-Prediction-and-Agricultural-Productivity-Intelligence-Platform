# YieldSense AI

## Milestone 4 Documentation

### Final Testing, Deployment Readiness & Project Submission

**Submitted by:** Maniraj Kyatham

---

### Introduction

Milestone 4 is the final testing, deployment-readiness, and documentation phase of YieldSense AI. I verified the existing application, model artifacts, API workflows, authentication, frontend build, deployment configuration, and project limitations without retraining or replacing the models.

YieldSense AI is a decision-support platform that uses soil, weather, crop, and farm-management inputs to estimate yield, recommend suitable crops, provide agronomic insights, and generate reports. The implementation is supervised regression and classification, not time-series forecasting.

> **Screenshot placeholder A — Title page:** Insert a full-page project title/cover image here (`01_title_page.png`).

## 1. Milestone 4 Objectives

1. Validate the existing prediction models and recorded performance.
2. Verify backend, frontend, authentication, reports, and inference workflows.
3. Improve deployment safety without changing model architecture or datasets.
4. Document local setup and the proposed cloud deployment process.
5. Prepare concise evidence placeholders for final mentor submission.

## 2. Dataset and Model Validation

### Datasets

| Dataset | Records | Inputs | Target/task |
|---|---:|---|---|
| Smart Crop Yield | 10,000 | 5 categorical + 7 numerical farm/environment features | `Yield_ton_per_ha` regression |
| Crop Recommendation | 7,000 | Temperature, Humidity, pH, Rainfall | 70-class `Label` classification |

### Recorded model results

The values below are recorded in the existing metadata and evaluation reports. They are documented training results, not a new training run in Milestone 4.

| Model | Algorithm | Results |
|---|---|---|
| Yield prediction | Linear Regression pipeline | R² 0.9821; MAE 4.0765 ton/ha; RMSE 5.0806 ton/ha |
| Crop recommendation | Random Forest Classifier | Accuracy 0.9586; weighted precision 0.9593; recall 0.9586; F1 0.9573 |

The datasets are suitable for project demonstration but require field validation before operational agricultural use. Fertilizer and pesticide quantities may represent a possible pre-season data-leakage risk.

> **Screenshot placeholder B — Dataset/model summary:** Insert a full-page image of dataset columns, model names, and metric tables (`02_model_validation.png`).

## 3. Application and API Verification

### Backend workflow

The FastAPI entry point is `src.api.main:app`. It mounts authentication, farmer, admin, prediction, recommendation, analytics, report, and agricultural-assistant routers. The model registry loads and caches the existing `.joblib` files.

Local startup:

```bash
uvicorn src.api.main:app --host 0.0.0.0 --port 8000
```

Hosted startup:

```bash
uvicorn src.api.main:app --host 0.0.0.0 --port $PORT
```

The API root is `/` and interactive documentation is available at `/docs`.

### Verification performed

- FastAPI import: **PASS**
- Existing yield model load and smoke inference: **PASS**
- Existing crop recommendation load and smoke inference: **PASS with warning**
- Environment-based CORS inspection: **PASS**
- Production secret guard: **PASS**
- Milestone 2 and Milestone 3 backend suites: **15 passed**
- Frontend TypeScript/Vite build: **PASS**

The recommendation artifact reports an `InconsistentVersionWarning` because it was serialized with scikit-learn 1.5.0 and the current environment uses 1.9.1. The artifact was preserved; inference is constrained to one in-memory worker for restricted hosts.

> **Screenshot placeholder C — API documentation:** Insert the full Swagger `/docs` page (`03_swagger_docs.png`).
>
> **Screenshot placeholder D — verification:** Insert terminal output showing the passing tests and inference smoke checks (`04_verification.png`).

## 4. Frontend and Full-Page Screenshots

The frontend uses React, TypeScript, Vite, and Tailwind CSS. It reads `VITE_API_BASE_URL` and falls back to localhost for development. The production command is `npm run build`; it completed successfully.

Use consistent browser zoom and viewport size. Replace the following compact placeholders with full-page captures:

| No. | Required page | Suggested filename |
|---:|---|---|
| 1 | Landing page, header, navigation | `05_landing.png` |
| 2 | Login/register and onboarding | `06_auth_onboarding.png` |
| 3 | Farmer dashboard and profile | `07_dashboard_profile.png` |
| 4 | My Farm details | `08_my_farm.png` |
| 5 | Yield prediction form | `09_yield_form.png` |
| 6 | Yield prediction result and insights | `10_yield_result.png` |
| 7 | Crop recommendation results | `11_crop_recommendation.png` |
| 8 | Weather, soil, and risk analytics | `12_analytics.png` |
| 9 | Agricultural assistant/chat | `13_ai_assistant.png` |
| 10 | Prediction history and formatted report | `14_reports.png` |
| 11 | Generated PDF page 1 | `15_pdf_page_1.png` |
| 12 | Generated PDF page 2 | `16_pdf_page_2.png` |
| 13 | Admin dashboard (mask credentials) | `17_admin.png` |
| 14 | Responsive/mobile view | `18_mobile_view.png` |

> **Screenshot placeholder E — Frontend build:** Insert the full build terminal page (`19_frontend_build.png`).

## 5. Deployment Readiness and Security

The remediation added environment-backed configuration without changing API routes or model contents:

- `SECRET_KEY`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` are required for production.
- Public registration always creates a farmer account; it cannot create an admin account.
- `CORS_ORIGINS` controls allowed browser origins.
- `PORT` is supported for hosted startup; development reload is disabled in production mode.
- `.env.example` documents configuration without real credentials.
- `.gitignore` permits `models/*.joblib` so the required artifacts can be included in an approved release.

The remaining deployment limitations are the scikit-learn version warning, local SQLite persistence, SHA-256 password hashing, and the need to include model binaries in Git/LFS, a container image, or approved artifact storage. No cloud deployment has been completed.

### Recommended architecture

```text
GitHub → Vercel/Netlify/Render Static Site (frontend)
       → Render or equivalent Python service (FastAPI + models)
       → managed persistent database for production data
```

This is a deployment plan, not a live deployment claim. The local SQLite database is appropriate for demonstration but not durable on an ephemeral cloud filesystem.

> **Screenshot placeholder F — Architecture/repository:** Insert a deployment diagram or repository tree (`20_architecture.png`).

## 6. Challenges Faced

1. The recommendation model has a serialized scikit-learn version mismatch; it was preserved and documented rather than replaced.
2. Restricted hosts cannot always create the model’s requested parallel workers, so inference uses one in-memory worker.
3. Source-level secrets and wildcard credentialed CORS required safe environment-based configuration.
4. SQLite persistence requires a future managed-database decision for public deployment.
5. Full-page application screenshots still need to be captured from the running project and inserted at the numbered placeholders.

## 7. Final Status and Outcome

| Area | Status | Remarks |
|---|---|---|
| Dataset preparation | COMPLETED | Cleaned datasets and feature definitions are present. |
| Model validation | COMPLETED WITH LIMITATION | Recorded metrics documented; version warning remains. |
| Model inference | PASS | Existing artifacts load and smoke inference succeeds. |
| Backend/API | PASS | 15 backend tests passed. |
| Authentication/security | IMPROVED | Environment secrets, role hardening, and configurable CORS added. |
| Frontend | PASS | Production build completed. |
| Reports/PDF | PASS | Covered by existing verification suite. |
| Cloud deployment | NOT COMPLETED | Deployment remains a documented plan. |
| Documentation | COMPLETED | Screenshot placeholders are ready for editing. |

### Outcome of Milestone 4

The project is ready for controlled local demonstration and mentor review. The backend, frontend, model inference, authentication, reports, and verification workflow are documented. Before public deployment, the artifact-version warning, model release packaging, durable database, and production password hashing must be addressed.

### Conclusion

Milestone 4 completed the final project documentation and deployment-readiness review. YieldSense AI presents an integrated workflow from cleaned agricultural datasets to machine learning predictions, recommendations, analytics, reports, and a farmer-facing dashboard. The deployment plan and remaining limitations are stated transparently, and the numbered placeholders make the document ready for final screenshot insertion.

**Submitted by:**  
**Maniraj Kyatham**
