# YieldSense AI — End-to-End Testing Checklist
# Milestone 4 — Complete Platform Verification
#
# Run through this checklist before every demo or deployment.
# Check each item manually or via the automated test suite.

## Pre-flight

- [ ] Backend starts: `python -m uvicorn main:app --port 8000`
- [ ] GET http://localhost:8000/health returns `{"status":"healthy"}`
- [ ] Frontend starts: `npm run dev` (http://localhost:5173)
- [ ] No console errors in browser developer tools

---

## 1. Authentication Flow

| Step | Action | Expected |
|---|---|---|
| 1.1 | Open app | Login page with banana-leaves glassmorphism UI |
| 1.2 | Register new account | 201 Created — redirect to login |
| 1.3 | Register duplicate username | Error message shown |
| 1.4 | Login with valid credentials | Dashboard loads |
| 1.5 | Login with wrong password | "Invalid credentials" error |
| 1.6 | Access protected page without login | Redirected to /login |
| 1.7 | Logout | Redirected to /login, token cleared |

---

## 2. Dashboard

| Step | Action | Expected |
|---|---|---|
| 2.1 | Open Dashboard | Aerial-farm hero banner visible |
| 2.2 | Model stats pills | Show Best Model, R², Records |
| 2.3 | Weather tab | Rainfall/temperature charts load |
| 2.4 | Soil tab | Soil type yield chart loads |
| 2.5 | Model Comparison tab | All 5 models with metrics shown |

---

## 3. Crop Yield Prediction

| Step | Action | Expected |
|---|---|---|
| 3.1 | Navigate to Predict | Form with rice-stalk banner |
| 3.2 | Fill all fields and submit | Predicted yield (kg/acre) shown |
| 3.3 | Check confidence badge | "High" (R² > 0.85) |
| 3.4 | Check model name | "Linear Regression" |
| 3.5 | Submit with missing field | Validation error shown |
| 3.6 | Submit without login | Redirected to login |

---

## 4. AI Agricultural Insights

| Step | Action | Expected |
|---|---|---|
| 4.1 | After prediction, click "Get AI Insights" | Loading spinner appears |
| 4.2 | Wait for response | AI-generated farming advice shown |
| 4.3 | Provider label | Shows "Groq" or "Analytical Fallback" |
| 4.4 | No raw API key visible | Not present anywhere in UI |

---

## 5. PDF Report Generation

| Step | Action | Expected |
|---|---|---|
| 5.1 | Click "Download Report" after prediction | PDF downloads |
| 5.2 | Open PDF | YieldSense branding, all inputs, predicted yield |
| 5.3 | Download from History page | PDF for historical record |

---

## 6. Prediction History

| Step | Action | Expected |
|---|---|---|
| 6.1 | Navigate to History | Table of past predictions |
| 6.2 | Make new prediction | Appears in history automatically |
| 6.3 | Click history row / download icon | PDF downloads for that prediction |
| 6.4 | Login as different user | Cannot see other user's predictions |

---

## 7. Agriculture AI Chatbot

| Step | Action | Expected |
|---|---|---|
| 7.1 | Navigate to AI Chatbot | floating-leaves welcome screen |
| 7.2 | Click a starter question | Question sent, loading shown |
| 7.3 | Receive AI response | Agricultural advice shown in chat bubble |
| 7.4 | Ask follow-up question | Context maintained |
| 7.5 | Click "Clear Chat" | Chat reset to welcome screen |

---

## 8. Productivity Analysis

| Step | Action | Expected |
|---|---|---|
| 8.1 | Navigate to Productivity | rice-stalk banner, summary stat cards |
| 8.2 | Crops tab | Bar chart with yield per crop |
| 8.3 | Weather tab | Yield by weather condition |
| 8.4 | Soil tab | Yield by soil type |
| 8.5 | Region tab | Regional performance breakdown |

---

## 9. Crop Recommendation

| Step | Action | Expected |
|---|---|---|
| 9.1 | Navigate to Recommendation | rice-stalk banner, input form |
| 9.2 | Submit default values | Top 3 crops with scores |
| 9.3 | Best crop highlighted | Medal emoji, crop name, expected yield |
| 9.4 | Different conditions | Different recommendation |

---

## 10. Resource Optimization

| Step | Action | Expected |
|---|---|---|
| 10.1 | Navigate to Resources | tractor-field banner |
| 10.2 | Submit with any crop | Optimization score (0–100) |
| 10.3 | NPK cards | Shows Optimal/Low/High status |
| 10.4 | Recommendations | Specific advice for each nutrient |

---

## 11. Risk Assessment

| Step | Action | Expected |
|---|---|---|
| 11.1 | Navigate to Risk | tractor-field banner |
| 11.2 | Submit with any conditions | Overall risk level badge |
| 11.3 | Risk breakdown | Factors listed with severity |
| 11.4 | High-risk scenario (e.g. stormy + sandy) | High or Medium risk |

---

## 12. Automated Tests

| Command | Expected |
|---|---|
| `python ml/validate_model.py` | R²=0.9772, CV R²=0.9800 |
| `python test_m4_api.py` | 61 tests — all PASS |
| `npm run build` (frontend/) | 900 modules — 0 errors |

---

## 13. Docker Deployment

| Step | Action | Expected |
|---|---|---|
| 13.1 | `cp .env.example .env` | .env created |
| 13.2 | Fill in GROQ_API_KEY, SECRET_KEY | Done |
| 13.3 | `docker compose up --build` | Both containers start |
| 13.4 | Backend health | `{"status":"healthy"}` at :8000/health |
| 13.5 | Frontend | App loads at http://localhost:3000 |
| 13.6 | End-to-end via Docker | All above steps pass |

---

## Sign-off

| Verified by | Date | Result |
|---|---|---|
| | | All PASS |
