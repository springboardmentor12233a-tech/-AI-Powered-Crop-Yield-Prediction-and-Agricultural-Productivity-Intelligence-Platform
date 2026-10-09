# YieldSense AI — Final Demo Guide
## Step-by-Step Live Demonstration (~5–7 minutes)

---

## Pre-Demo Setup (Before Presenting)

### Option A: Local Development
```bash
# Terminal 1 — Backend
cd "d:\2nd milestone\backend"
python -m uvicorn main:app --host 127.0.0.1 --port 8000

# Terminal 2 — Frontend
cd "d:\2nd milestone\frontend"
npm run dev
```
Open: **http://localhost:5173**

### Option B: Docker
```bash
cd "d:\2nd milestone"
docker compose up --build
```
Open: **http://localhost:3000**

### Verify before demo
- [ ] Backend is running: http://localhost:8000/health → `{"status":"healthy"}`
- [ ] Frontend loads: http://localhost:5173 or http://localhost:3000
- [ ] Groq API key in `.env` (for live AI demo)
- [ ] Browser is zoomed to 90–100% for full visibility
- [ ] No sensitive keys visible on screen

---

## Demo Sequence

---

### STEP 1 — Start the Application (~20 seconds)

**What to show:**
- Open terminal and show the backend start command
- Open browser and navigate to the application
- The **Login page** appears with banana-leaf glassmorphism background

**Talking points:**
> "This is YieldSense AI — a full-stack agricultural intelligence platform. The login screen uses a glassmorphism design with a real farm photograph as the background."

---

### STEP 2 — Login (~20 seconds)

**Action:**
1. Enter username: `admin` (or any registered user)
2. Enter password
3. Click **Sign In**

**What to show:**
- The login form submits
- Dashboard loads immediately

**Talking points:**
> "Authentication uses JWT — JSON Web Tokens — with bcrypt password hashing for security. Passwords are never stored in plain text."

---

### STEP 3 — Dashboard Overview (~30 seconds)

**What to show:**
- The aerial farm photography hero banner
- **Model stats pills:** Best Model, R² Score, Training Records
- **Tab 1 — Weather Analysis:** rainfall correlation chart, weather condition bar chart
- **Tab 2 — Soil Analysis:** soil type yield comparison
- **Tab 3 — Model Comparison:** all 5 models side by side

**Talking points:**
> "The dashboard shows real-time analytics computed from 2,200 agricultural records. The best model — Linear Regression — achieves an R² of 0.9772, meaning it explains 97.72% of crop yield variance."

---

### STEP 4 — Crop Yield Prediction (~45 seconds)

**Action:**
1. Click **Predict Yield** in the sidebar
2. Fill in the form:
   - Crop: **Rice**
   - Region: **North**
   - Rainfall: **900 mm**
   - Temperature: **27°C**
   - Weather: **Sunny**
   - Soil: **Loamy**
   - Soil pH: **6.5**
   - Nitrogen: **80**, Phosphorus: **50**, Potassium: **60**
   - Fertilizer: ✅, Irrigation: ✅
3. Click **Predict Yield**

**What to show:**
- Result appears: predicted yield in kg/acre
- Confidence level badge
- Model name used

**Talking points:**
> "The prediction uses our best-performing Linear Regression model. Input data is sent to the FastAPI backend, preprocessed through our scikit-learn pipeline, and the result is returned in under 200 ms."

---

### STEP 5 — AI Agricultural Insights (~30 seconds)

**Action:**
- After prediction, click **Get AI Insights**

**What to show:**
- Loading spinner
- AI-generated farming advice appears (from Groq LLM)
- Provider label shows "groq"

**Talking points:**
> "After predicting yield, we send the crop parameters to the Groq LLM API which generates personalized farming recommendations — including advice on fertilizer, irrigation, risk mitigation, and best practices for the selected crop and conditions."

---

### STEP 6 — Download PDF Report (~20 seconds)

**Action:**
- Click **Download Report** (on the prediction result or history page)

**What to show:**
- PDF downloads automatically
- Open the PDF — show the formatted report with YieldSense branding, all inputs, and predicted yield

**Talking points:**
> "Farmers can download a professional PDF report of any prediction. It's generated server-side using the reportlab library and includes all parameters, the predicted yield, and a timestamp."

---

### STEP 7 — Prediction History (~20 seconds)

**Action:**
1. Click **Prediction History** in the sidebar
2. Show the history table

**What to show:**
- The prediction just made is listed
- Multiple past predictions (if any exist)
- Download icon for each entry

**Talking points:**
> "Every successful prediction is saved to the user's personal history. History is user-isolated — one user cannot see another user's predictions. Click any row to download its PDF report."

---

### STEP 8 — Agriculture AI Chatbot (~30 seconds)

**Action:**
1. Click **AI Chatbot** in the sidebar
2. Click a starter question OR type: **"What is the best fertilizer for rice on loamy soil?"**
3. Wait for response

**What to show:**
- The floating-leaves welcome screen
- Question sent — loading indicator
- AI response appears in the chat bubble

**Talking points:**
> "The Agriculture AI Assistant is powered by Groq's llama3 model. It maintains conversation context for up to 10 messages. Farmers can ask about crop cultivation, soil health, pest control, irrigation — any agricultural topic."

---

### STEP 9 — Productivity Analysis (~20 seconds)

**Action:**
- Click **Productivity Analysis** in the sidebar

**What to show:**
- Summary stat cards (avg yield, best crop, best region)
- **Crops tab:** bar chart of yield by crop
- **Weather tab:** yield by weather condition
- **Soil tab:** yield by soil type
- **Region tab:** regional performance

**Talking points:**
> "This module analyzes all 2,200 records to show which crops, regions, and conditions perform best. This helps farmers understand macro-level trends."

---

### STEP 10 — Crop Recommendation (~20 seconds)

**Action:**
1. Click **Crop Recommendation** in the sidebar
2. The form is pre-filled — click **Get Recommendation**

**What to show:**
- Top 3 recommended crops with match scores
- Best crop highlighted with medal emoji
- Recommendations based on the data

**Talking points:**
> "Given a set of farm conditions, the system recommends the top 3 crops historically proven to perform best in those conditions — using pattern matching against the full dataset."

---

### STEP 11 — Resource Optimization (~15 seconds)

**Action:**
1. Click **Resource Optimization**
2. Submit with default values

**What to show:**
- Optimization score (0–100)
- NPK status cards (Optimal/Low/High)
- Specific recommendations for each nutrient

**Talking points:**
> "The resource optimizer analyzes current NPK levels against optimal ranges from the dataset and recommends adjustments to maximize yield efficiency."

---

### STEP 12 — Risk Assessment (~15 seconds)

**Action:**
1. Click **Risk Assessment**
2. Submit with default values

**What to show:**
- Overall risk level badge (Low/Medium/High)
- Risk breakdown by factor
- Mitigation advice per risk category

**Talking points:**
> "The risk assessment evaluates weather, soil, and input factors to give an overall farm risk score — helping farmers plan and mitigate potential yield losses."

---

### STEP 13 — Model Comparison & Validation (~20 seconds)

**Action:**
- Return to **Dashboard** → **Model Comparison** tab

**What to show:**
- Table of all 5 models
- Linear Regression highlighted as best
- R² / MAE / RMSE for all

**Then show (optional — in terminal):**
```bash
python ml/validate_model.py
```

**Talking points:**
> "All 5 models were trained and evaluated using GridSearchCV. Linear Regression achieved the best R² of 0.9772. Our Milestone 4 validation confirms this on the independent test set with a CV R² of 0.9800."

---

### STEP 14 — Docker Deployment (~20 seconds)

**If Docker is installed:**
```bash
cd "d:\2nd milestone"
docker compose up --build
```

**Show in terminal:**
- Backend container starting
- Frontend building
- Health check passing

**Talking points:**
> "The entire application is containerized using Docker. A single command — `docker compose up --build` — builds and starts both the React frontend served by nginx and the FastAPI backend. All secrets are injected via environment variables."

---

### STEP 15 — Final System Status (~15 seconds)

**Show:**
```
✅ Authentication                    ✅ Prediction History
✅ Crop Yield Prediction             ✅ PDF Reports
✅ Weather Analysis                  ✅ AI Agriculture Chatbot
✅ Soil Analysis                     ✅ Model Validation (R²=0.9772)
✅ AI Insights (Groq)                ✅ API Testing (35+ tests)
✅ Productivity Analysis             ✅ Docker Containerization
✅ Crop Recommendation               ✅ Full Documentation
✅ Resource Optimization             ✅ Production Frontend Build
✅ Risk Assessment
```

**Closing statement:**
> "YieldSense AI is a complete, tested, and deployable agricultural intelligence platform. It demonstrates end-to-end ML engineering, RESTful API design, modern frontend development, AI integration, and DevOps with Docker — all applied to solving a real-world agricultural problem."

---

## Timing Guide

| Step | Action | Time |
|---|---|---|
| 0 | Pre-demo setup | Before presentation |
| 1 | Show application start | 0:20 |
| 2 | Login | 0:40 |
| 3 | Dashboard overview | 1:10 |
| 4 | Crop yield prediction | 1:55 |
| 5 | AI insights | 2:25 |
| 6 | PDF report download | 2:45 |
| 7 | Prediction history | 3:05 |
| 8 | AI chatbot | 3:35 |
| 9 | Productivity analysis | 3:55 |
| 10 | Crop recommendation | 4:15 |
| 11 | Resource optimization | 4:30 |
| 12 | Risk assessment | 4:45 |
| 13 | Model comparison/validation | 5:05 |
| 14 | Docker deployment | 5:25 |
| 15 | Final status | 5:40 |
| — | Q&A | 5:40–7:00 |

---

## Common Demo Questions & Answers

**Q: Why Linear Regression instead of a deep learning model?**  
A: With 2,200 structured records and well-defined numerical/categorical features, Linear Regression (after proper preprocessing) achieves R²=0.9772 — comparable to ensemble methods but with faster inference and interpretability. Deep learning would require far more data to avoid overfitting.

**Q: Is the data real agricultural data?**  
A: The dataset is a structured agricultural dataset covering 8 crops, 5 regions, 5 soil types, and 5 weather conditions — representing real agricultural parameters used in Indian farming practice.

**Q: How is the Groq API key protected?**  
A: The key lives exclusively in the server-side `.env` file which is gitignored. It is never sent to the frontend or exposed in any API response.

**Q: Can this be deployed to the cloud?**  
A: Yes — the Docker images are cloud-ready. Deployment to AWS (ECS/EC2) or Azure (Container Apps/App Service) requires only setting environment variables (`GROQ_API_KEY`, `SECRET_KEY`, `VITE_API_URL`) and pointing a domain at the containers. The `docs/ARCHITECTURE.md` documents the full deployment steps.

**Q: What happens if Groq API is unavailable?**  
A: Both `/ai-insights` and `/chatbot/ask` implement graceful fallbacks — returning analytical rule-based responses — so the core prediction functionality continues to work without the AI features.
