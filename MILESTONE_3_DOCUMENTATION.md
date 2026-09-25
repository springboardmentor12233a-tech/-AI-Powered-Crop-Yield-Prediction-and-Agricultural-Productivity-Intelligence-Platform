# 📖 YieldSense AI — Milestone 3 Technical Documentation

## AI-Powered Crop Yield Prediction & Agricultural Productivity Intelligence Platform

**Version**: 3.0 — Milestone 3 (Weeks 5 & 6)
**Last Updated**: September 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Milestone 3 Objectives](#2-milestone-3-objectives)
3. [System Architecture](#3-system-architecture)
4. [Backend Implementation](#4-backend-implementation)
   - 4.1 [Multi-Provider LLM Engine](#41-multi-provider-llm-engine)
   - 4.2 [AI Agricultural Assistant](#42-ai-agricultural-assistant)
   - 4.3 [Admin Management API](#43-admin-management-api)
   - 4.4 [Report Generation & PDF Export](#44-report-generation--pdf-export)
   - 4.5 [Risk Assessment Engine](#45-risk-assessment-engine)
   - 4.6 [Authentication & Authorization](#46-authentication--authorization)
5. [Frontend Implementation](#5-frontend-implementation)
   - 5.1 [Admin Panel](#51-admin-panel)
   - 5.2 [AI Chat Interface](#52-ai-chat-interface)
   - 5.3 [Markdown Rendering](#53-markdown-rendering)
   - 5.4 [Report Viewer](#54-report-viewer)
6. [Database Schema](#6-database-schema)
7. [API Reference](#7-api-reference)
8. [Configuration & Setup](#8-configuration--setup)
9. [Testing & Validation](#9-testing--validation)
10. [Known Issues & Resolutions](#10-known-issues--resolutions)
11. [File Inventory](#11-file-inventory)

---

## 1. Project Overview

YieldSense AI is a full-stack agricultural productivity intelligence platform that combines machine learning predictions with AI-powered agronomic advice. The system provides:

- **ML-Based Yield Forecasting** using trained regression models (Random Forest / Gradient Boosting)
- **Crop Suitability Recommendations** using trained classification models
- **AI-Powered Agronomic Insights** through multi-provider LLM integration
- **Agricultural Risk Assessment** through multi-factor analysis
- **Professional PDF Report Generation** with server-side rendering
- **Administrative Platform Management** with farmer oversight and AI configuration

### Milestone Progression

| Milestone | Scope | Key Deliverables |
|-----------|-------|-----------------|
| **M1 (Weeks 1–2)** | Data Foundation | Dataset audit, preprocessing, feature engineering, initial model training |
| **M2 (Weeks 3–4)** | Platform Core | Farmer UX, authentication, farm management, prediction pipeline, analytics |
| **M3 (Weeks 5–6)** | AI Intelligence | LLM integration, AI chatbot, admin dashboard, PDF reports, RBAC |

---

## 2. Milestone 3 Objectives

The following objectives were defined for Milestone 3 and are all marked complete:

| # | Objective | Status |
|---|-----------|--------|
| 1 | Integrate external AI/LLM providers for intelligent report generation | ✅ |
| 2 | Build a conversational AI agricultural assistant with farm context | ✅ |
| 3 | Create an administrative dashboard for platform management | ✅ |
| 4 | Implement farmer account lifecycle management (activate/deactivate/delete) | ✅ |
| 5 | Generate downloadable PDF agronomic assessment reports | ✅ |
| 6 | Add multi-factor agricultural risk assessment to predictions | ✅ |
| 7 | Render AI responses as formatted Markdown (tables, headers, lists) | ✅ |
| 8 | Support 4 LLM providers with hot-swap and graceful fallback | ✅ |
| 9 | Persist chat conversations per user with full history | ✅ |
| 10 | Enforce role-based access control (admin vs. farmer) on all endpoints | ✅ |

---

## 3. System Architecture

### High-Level Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                     Client Layer (Browser)                     │
│   React 18 + TypeScript + Vite + TailwindCSS                 │
│   react-markdown + remark-gfm + @tailwindcss/typography      │
└───────────────────────┬───────────────────────────────────────┘
                        │ HTTP/REST (JSON)
┌───────────────────────┴───────────────────────────────────────┐
│                   Application Layer (FastAPI)                  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    API Routers                           │  │
│  │  /api/auth/*     - JWT Authentication                   │  │
│  │  /api/farmer/*   - Profile & Farm Management            │  │
│  │  /api/predict/*  - ML Yield & Crop Predictions          │  │
│  │  /api/reports/*  - Report History & PDF Export           │  │
│  │  /api/chat/*     - AI Agricultural Assistant             │  │
│  │  /api/admin/*    - Admin Dashboard & LLM Config         │  │
│  │  /api/analytics/*- Weather & Soil Data Analytics        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────┐ ┌───────────────┐ ┌─────────────────────┐  │
│  │  ML Engine    │ │  Analytics    │ │  LLM Provider       │  │
│  │  yield_model  │ │  risk_assess  │ │  gemini/openai/     │  │
│  │  crop_model   │ │  weather/soil │ │  groq/xai/fallback  │  │
│  └───────────────┘ └───────────────┘ └─────────────────────┘  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Persistence Layer (SQLite)                              │  │
│  │  yieldsense.db — 6 tables with FK constraints           │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
                        │
┌───────────────────────┴───────────────────────────────────────┐
│                   External AI Services                        │
│  Google Gemini API │ OpenAI API │ Groq API │ xAI Grok API    │
└───────────────────────────────────────────────────────────────┘
```

### Data Flow: Yield Prediction with AI Insights

```
1. Farmer submits crop parameters (soil, weather, management inputs)
         │
2. FastAPI validates input via Pydantic schema
         │
3. ML Model (in-memory) generates predicted yield (ton/ha)
         │
4. Risk Assessment Engine evaluates 5 agronomic risk factors
         │
5. LLM Provider Engine:
   ├── Check: Is there an active provider with a valid API key?
   │   ├── YES → Build prompt with prediction context → Call LLM API
   │   └── NO  → Generate deterministic rule-based insights
         │
6. Assemble complete report (yield + risk + insights)
         │
7. Save to predictions table (if user authenticated)
         │
8. Return JSON response to frontend
         │
9. Frontend renders with FormattedReportViewer + ReactMarkdown
```

---

## 4. Backend Implementation

### 4.1 Multi-Provider LLM Engine

**File**: `src/analytics/llm_provider.py`

The LLM engine abstracts away provider-specific API differences behind a unified interface.

#### Supported Providers

| Provider | API Pattern | Endpoint | Auth Method |
|----------|-------------|----------|-------------|
| **Gemini** | REST POST | `generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` | Query param `?key=` |
| **Groq** | OpenAI-compatible | `api.groq.com/openai/v1/chat/completions` | Bearer token |
| **OpenAI** | REST POST | `api.openai.com/v1/chat/completions` | Bearer token |
| **xAI** | OpenAI-compatible | `api.x.ai/v1/chat/completions` | Bearer token |

#### Key Functions

```python
def verify_llm_provider_connection(provider: str, model_name: str, api_key: str) -> Dict[str, Any]:
    """Tests direct connectivity without saving. Returns status + diagnostic message."""

def call_llm(prompt: str) -> Optional[str]:
    """Calls the active LLM provider from database configuration.
    Returns None on any failure (triggers fallback)."""

def generate_llm_agronomic_report(context: Dict[str, Any]) -> Dict[str, Any]:
    """Generates structured agronomic insights using LLM or deterministic fallback.
    Returns: {"source": "gemini|openai|groq|xai|rule-based", "content": "...", "is_llm": bool}"""
```

#### Cloudflare Bypass

All `urllib.request.Request` calls include `User-Agent: YieldSenseBot/1.0` to prevent Cloudflare 403 (Error 1010) blocks, which reject the default `Python-urllib/3.x` user agent.

#### Graceful Fallback

If the LLM call fails for any reason (no key, network error, rate limit, invalid response), the system falls back to a deterministic template (`DETERMINISTIC_REPORT_PROMPT`) that fills in the farmer's actual data values:

```python
DETERMINISTIC_REPORT_PROMPT = """
### Executive Summary
Based on the machine learning analysis for {crop} in {region}, the forecasted 
productivity is {predicted_yield:.2f} ton/ha...
"""
```

---

### 4.2 AI Agricultural Assistant

**File**: `src/api/routers/chat.py`

The chatbot provides context-aware agricultural advice by injecting the farmer's real data into every LLM prompt.

#### Context Injection Strategy

```python
system_prompt = f"""You are YieldSense AI, an expert agricultural advisor.

FARMER CONTEXT:
- Name: {farmer['full_name']}
- Location: {farmer.get('village', '')}, {farmer.get('district', '')}, {farmer.get('state', '')}
- Farm: {farm.get('land_size', 4.5)} {farm.get('land_unit', 'Acres')} of {farm.get('soil_type', 'Loam')} soil
- Irrigation: {farm.get('irrigation_method', 'Unknown')}
- Latest Yield Prediction: {latest_pred.get('crop')} at {latest_pred.get('predicted_yield')} ton/ha
- Latest Crop Recommendation: {latest_rec.get('recommended_crop')} ({latest_rec.get('confidence_pct')} confidence)

Provide practical, actionable agronomic advice. Use markdown formatting with tables when appropriate.
"""
```

#### Rule-Based Fallback Categories

When no LLM is available, the system maps user queries to 7 keyword categories:

| Category | Keywords | Response Source |
|----------|----------|----------------|
| Yield | yield, produce, harvest, ton | Latest prediction data |
| Soil | soil, pH, texture, nutrient | Farm soil specifications |
| Pest | pest, disease, insect, weed | General IPM guidance |
| Weather | weather, rain, temperature, climate | Farm weather context |
| Fertilizer | fertilizer, nutrient, NPK | Prediction fertilizer data |
| Irrigation | irrigation, water, drip, sprinkler | Farm irrigation method |
| Crop Rotation | rotation, previous crop, sequence | Prediction crop history |

#### Chat Persistence

All messages (both user and assistant) are stored in the `chat_messages` table with:
- `user_id` — Scoping to the authenticated farmer
- `role` — 'user' or 'assistant'
- `content` — Full message text
- `context_json` — Farm/prediction context at time of message
- `created_at` — Timestamp

Users can clear their chat history via `DELETE /api/chat/clear`.

---

### 4.3 Admin Management API

**File**: `src/api/routers/admin.py`

All admin endpoints are protected by the `get_current_admin_user` dependency, which:
1. Extracts the JWT token from the `Authorization: Bearer {token}` header
2. Decodes and verifies the HMAC-SHA256 signature
3. Checks that `payload.role == 'admin'`
4. Returns the full user profile or raises HTTP 403

#### Endpoints

**System Statistics** (`GET /api/admin/stats`):
```json
{
  "stats": {
    "total_farmers": 15,
    "active_farmers": 12,
    "total_predictions": 47,
    "total_recommendations": 23,
    "top_forecasted_crops": [{"crop": "Rice", "count": 12}, ...],
    "top_recommended_crops": [{"crop": "Rice", "count": 8}, ...],
    "recent_activity": [...]
  }
}
```

**Farmer Management**:
- `GET /api/admin/farmers` — List all farmers with farm details and activity counts
- `GET /api/admin/farmers/{id}` — Full profile + farm + prediction history + recommendation history
- `POST /api/admin/farmers/toggle-status` — Set `is_active` to 0 (disabled) or 1 (active)
- `DELETE /api/admin/farmers/{id}` — Permanent deletion with CASCADE (removes all associated data)

**LLM Configuration**:
- `GET /api/admin/llm/configs` — List all 4 providers with masked API keys
- `POST /api/admin/llm/config` — Update provider model, key, and active status
- `POST /api/admin/llm/test` — Test live connectivity to a provider

---

### 4.4 Report Generation & PDF Export

**Files**: `src/analytics/prediction_report.py`, `src/api/routers/reports_router.py`, `src/analytics/pdf_utils.py`

#### Report Structure

Each saved prediction report contains:

| Section | Data Source | Content |
|---------|-----------|---------|
| Header | User input | Report ID, date, crop, region, field name |
| Yield Forecast | ML Model | Predicted yield (ton/ha), model version, algorithm |
| Risk Assessment | Risk Engine | Overall risk (Low/Moderate/High), score (0–10), factor list |
| AI Insights | LLM / Fallback | Agronomic analysis, recommendations, tables |
| Parameters | User input | All 12 input parameters as audit trail |
| Disclaimer | Static | Decision support advisory |

#### PDF Generation

The `/api/reports/pdf/{report_id}` endpoint:
1. Loads the saved report from the `predictions` table
2. Deserializes `insights_json` (containing risk assessment and LLM insights)
3. Renders an A4 PDF document using `reportlab` with:
   - YieldSense branding header
   - Metadata grid (crop, region, date, field)
   - Yield forecast section with large numeric display
   - Risk assessment with color-coded severity badges
   - AI insights section (plain text fallback for PDF, as PDF doesn't support Markdown)
   - Parameters summary table
   - Decision support disclaimer footer
4. Returns the PDF as a binary stream with `Content-Type: application/pdf`

---

### 4.5 Risk Assessment Engine

**File**: `src/analytics/risk_assessment.py`

The risk assessment evaluates 5 independent agronomic risk factors on a 0–10 cumulative scale:

| Factor | Trigger Conditions | Score Impact |
|--------|-------------------|--------------|
| **Soil pH Risk** | pH < 5.5 (acidic) or pH > 8.2 (alkaline) | +2 |
| **Moisture Risk** | Rainfall < 200mm (drought) or > 2000mm (flood), no irrigation | +1 to +3 |
| **Monoculture Risk** | Previous crop == current crop (no rotation) | +1 to +2 |
| **Input Intensity** | Fertilizer > 300kg or < 10kg; Pesticides > 15kg | +1 to +2 |
| **Yield Expectation** | Predicted yield < 1.5 ton/ha | +1 |

**Risk Classification**:
| Score | Category | Badge Color |
|-------|----------|-------------|
| 0–3 | Low | 🟢 Green |
| 4–6 | Moderate | 🟡 Amber |
| 7–10 | High | 🔴 Red |

---

### 4.6 Authentication & Authorization

**File**: `src/api/routers/auth.py`

#### JWT Token Structure

```json
{
  "header": {"alg": "HS256", "typ": "JWT"},
  "payload": {
    "sub": "1",
    "user_id": 1,
    "email": "farmer@example.com",
    "role": "farmer",
    "exp": 1727376000,
    "iat": 1726771200
  }
}
```

- **Signing**: HMAC-SHA256 using a server-side secret key
- **Encoding**: Base64URL without padding
- **Expiry**: 7 days from issuance
- **Validation**: Signature verification + expiry check on every protected request

#### Password Security

Passwords are hashed using SHA-256 with a static salt prefix before storage. The plain-text password is never stored or logged.

#### Auth Dependencies

| Dependency | Returns | Use Case |
|------------|---------|----------|
| `get_current_user_id()` | `int` or `None` | Optional auth (predictions work without login) |
| `get_current_admin_user()` | `Dict` (user profile) | Strict admin-only access |

#### Seeded Admin Account

On database initialization, a default admin account is created:
- **Email**: `admin@yieldsense.ai`
- **Password**: `admin123`
- **Role**: `admin`

---

## 5. Frontend Implementation

### 5.1 Admin Panel

**File**: `frontend/src/components/AdminPanel.tsx` (38 KB, ~750 lines)

The admin panel is a 3-tab interface:

**Tab 1 — System Overview**:
- 4 stat cards: Total Farmers, Active Farmers, Total Predictions, Active AI Provider
- Top forecasted crops bar chart (visual bars)
- Top recommended crops bar chart
- Recent activity feed with farmer attribution

**Tab 2 — Farmers Registry**:
- Left panel: Searchable farmer list with status badges (Active/Disabled)
- Right panel: Selected farmer's full profile including:
  - Personal details (name, email, phone, location)
  - Farm specifications (field name, land size, soil type, irrigation)
  - Prediction history table with yields and dates
  - Recommendation history table with crops and confidence
- Action buttons: Activate/Deactivate Account, Delete Account (with confirmation)

**Tab 3 — AI Provider Engine**:
- Provider status overview (4 cards showing configured/active state)
- Provider selection buttons (Gemini, OpenAI, xAI, Groq)
- Configuration form: Model name, API key input (masked), Active toggle
- Test Connection button with live diagnostic feedback
- Save Configuration button

### 5.2 AI Chat Interface

**File**: `frontend/src/components/AIAssistantTab.tsx`

- Chat bubble UI with user messages (right, blue) and assistant messages (left, gray)
- Full Markdown rendering via `ReactMarkdown` with `remark-gfm` plugin
- Auto-scroll to latest message
- Context indicator showing farm data being used
- Clear history button
- Loading spinner during AI response generation

### 5.3 Markdown Rendering

**Libraries Added**:
- `react-markdown` — Converts Markdown text to React components
- `remark-gfm` — GitHub Flavored Markdown support (tables, strikethrough, task lists)
- `@tailwindcss/typography` — Prose classes for beautiful typography defaults

**Integration Points**:
- `AIAssistantTab.tsx` — Chat responses
- `FormattedReportViewer.tsx` — LLM insights section in report viewer

**Tailwind Classes Applied**:
```
prose prose-sm dark:prose-invert prose-emerald max-w-none
prose-p:leading-relaxed prose-table:w-full
prose-th:bg-slate-100 dark:prose-th:bg-slate-800
prose-td:border-slate-200 dark:prose-td:border-slate-700
```

### 5.4 Report Viewer

**File**: `frontend/src/components/FormattedReportViewer.tsx`

Modal overlay displaying:
1. Report header with ID and date
2. Yield forecast with large numeric display
3. Risk assessment with color-coded badges and factor list
4. AI insights rendered as formatted Markdown
5. Field parameters grid (8 inputs)
6. Decision support disclaimer
7. "Download Official PDF" button

---

## 6. Database Schema

### Entity-Relationship Diagram

```
┌─────────────┐     ┌─────────────┐
│   users     │     │   farms     │
│─────────────│     │─────────────│
│ id (PK)     │←──┐ │ id (PK)     │
│ email       │   │ │ user_id (FK)│──→ users.id (CASCADE)
│ password    │   │ │ field_name  │
│ full_name   │   │ │ land_size   │
│ role        │   │ │ land_unit   │
│ is_active   │   │ │ soil_type   │
│ phone       │   │ │ irrigation  │
│ village     │   │ └─────────────┘
│ district    │   │
│ state       │   │ ┌──────────────────┐
│ onboarding  │   │ │  predictions     │
│ created_at  │   │ │──────────────────│
└─────────────┘   ├─│ user_id (FK)     │──→ users.id (CASCADE)
                  │ │ report_id        │
                  │ │ crop, region     │
                  │ │ 10 input fields  │
                  │ │ predicted_yield  │
                  │ │ insights_json    │
                  │ │ created_at       │
                  │ └──────────────────┘
                  │
                  │ ┌──────────────────┐
                  │ │ recommendations  │
                  │ │──────────────────│
                  ├─│ user_id (FK)     │──→ users.id (CASCADE)
                  │ │ recommended_crop │
                  │ │ confidence       │
                  │ │ candidates_json  │
                  │ │ soil_json        │
                  │ │ created_at       │
                  │ └──────────────────┘
                  │
                  │ ┌──────────────────┐
                  │ │  chat_messages   │
                  │ │──────────────────│
                  └─│ user_id (FK)     │──→ users.id (CASCADE)
                    │ role             │
                    │ content          │
                    │ context_json     │
                    │ created_at       │
                    └──────────────────┘

┌──────────────────────┐
│  llm_configurations  │  (No FK — system-level config)
│──────────────────────│
│ id (PK)              │
│ provider (UNIQUE)    │
│ model_name           │
│ api_key              │
│ is_active            │
│ updated_at           │
└──────────────────────┘
```

### Referential Integrity

All user-linked tables (`farms`, `predictions`, `recommendations`, `chat_messages`) use:
```sql
FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
```

This ensures that when an admin deletes a farmer account, **all associated data is automatically removed** — no orphan records.

---

## 7. API Reference

### Authentication Endpoints

| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| POST | `/api/auth/register` | None | `{email, password, full_name, role?, phone?, village?, district?, state?}` | `{token, user, status}` |
| POST | `/api/auth/login` | None | `{email, password}` | `{token, user, status}` |
| GET | `/api/auth/me` | Bearer | — | `{user, status}` |
| POST | `/api/auth/onboarding/complete` | Bearer | — | `{status, message}` |

### Farmer Endpoints

| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| GET | `/api/farmer/profile` | Bearer | — | `{profile, status}` |
| PUT | `/api/farmer/profile` | Bearer | `{full_name, phone?, village?, district?, state?}` | `{profile, status}` |
| GET | `/api/farmer/farm` | Bearer | — | `{farm, status}` |
| PUT | `/api/farmer/farm` | Bearer | `{field_name, land_size, land_unit, soil_type, irrigation_method}` | `{farm, status}` |

### Prediction Endpoints

| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| POST | `/api/predict/yield` | Optional | `{Crop, Region, Soil_Type, Soil_pH, ...}` | `{report_id, predicted_yield_ton_per_ha, risk_assessment, llm_insights, ...}` |
| POST | `/api/predict/recommendation` | Optional | `{Temperature, Humidity, pH, Rainfall}` | `{recommended_crop, confidence, top_candidates, soil_ph_analysis}` |

### Chat Endpoints

| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| POST | `/api/chat/send` | Bearer | `{message}` | `{id, role, content, created_at}` |
| GET | `/api/chat/history` | Bearer | — | `{messages: [...]}` |
| DELETE | `/api/chat/clear` | Bearer | — | `{status, message}` |

### Report Endpoints

| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| POST | `/api/reports/generate` | Bearer | `{Crop, Region, ...}` | Full report object |
| GET | `/api/reports/history` | Bearer | — | `{history: [...]}` |
| GET | `/api/reports/pdf/{report_id}` | Bearer | — | PDF binary stream |

### Admin Endpoints

| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| GET | `/api/admin/stats` | Admin | — | `{stats: {...}}` |
| GET | `/api/admin/farmers` | Admin | — | `{farmers: [...]}` |
| GET | `/api/admin/farmers/{id}` | Admin | — | `{farmer, farm, predictions, recommendations}` |
| POST | `/api/admin/farmers/toggle-status` | Admin | `{user_id, is_active}` | `{status, message}` |
| DELETE | `/api/admin/farmers/{id}` | Admin | — | `{status, message}` |
| GET | `/api/admin/llm/configs` | Admin | — | `{configs: [...]}` |
| POST | `/api/admin/llm/config` | Admin | `{provider, model_name, api_key?, is_active}` | `{status, message}` |
| POST | `/api/admin/llm/test` | Admin | `{provider, model_name, api_key}` | `{status, message}` |

---

## 8. Configuration & Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+

### Backend Setup

```bash
# Install Python dependencies
pip install fastapi uvicorn scikit-learn joblib reportlab

# Start backend server
uvicorn src.api.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### AI Provider Configuration

1. Login as admin: `admin@yieldsense.ai` / `admin123`
2. Navigate to Admin Panel → AI Provider Engine tab
3. Select a provider (Gemini recommended for free tier)
4. Enter your API key
5. Click "Test Connection" to verify
6. Click "Save Configuration"

### Obtaining API Keys

| Provider | How to Get Key |
|----------|---------------|
| **Google Gemini** | Visit [aistudio.google.com](https://aistudio.google.com), create API key (free tier available) |
| **Groq** | Visit [console.groq.com](https://console.groq.com), sign up and generate API key |
| **OpenAI** | Visit [platform.openai.com](https://platform.openai.com), create API key (paid) |
| **xAI** | Visit [console.x.ai](https://console.x.ai), request API access |

---

## 9. Testing & Validation

### Test File

**File**: `tests/test_milestone3.py`

### Manual Test Procedures

**AI Assistant Test**:
1. Login as a farmer
2. Navigate to AI Assistant tab
3. Ask: "What should I do about soil pH management?"
4. Verify response contains farm-specific data (soil type, irrigation method)
5. Verify Markdown rendering (tables, headers, bold text)

**Admin Panel Test**:
1. Login as `admin@yieldsense.ai` / `admin123`
2. Verify Overview tab shows correct farmer counts
3. Navigate to Farmers Registry, select a farmer
4. Test Deactivate → verify farmer can't login → Activate → verify farmer can login
5. Test Delete with confirmation dialog
6. Navigate to AI Provider Engine, configure a provider, test connection

**Report Generation Test**:
1. Login as farmer, navigate to Yield Forecast
2. Submit a prediction
3. Navigate to Reports tab
4. Click "View Report" → verify all 5 sections render
5. Click "Download PDF" → verify PDF downloads correctly

---

## 10. Known Issues & Resolutions

| Issue | Root Cause | Resolution |
|-------|-----------|------------|
| HTTP 403 (Error 1010) on AI API calls | Cloudflare blocks `Python-urllib/3.x` user agent | Added `User-Agent: YieldSenseBot/1.0` header to all `urllib.request.Request` calls |
| Profile update logs user out | Frontend read `result.user` but backend returns `result.profile` | Changed `api.ts` to read `result.profile` |
| Activate Account button doesn't toggle | JavaScript falsy check: `is_active \|\| 1` treats `0` as falsy | Changed to nullish coalescing: `is_active ?? 1` |
| AI response shows raw markdown | Chat component used custom string splitting instead of a parser | Replaced with `react-markdown` + `remark-gfm` + `@tailwindcss/typography` |

---

## 11. File Inventory

### Backend Files (Milestone 3)

| File | Lines | Purpose |
|------|-------|---------|
| `src/analytics/llm_provider.py` | 279 | Multi-provider LLM engine with fallback |
| `src/analytics/risk_assessment.py` | 142 | 5-factor agricultural risk scorer |
| `src/analytics/prediction_report.py` | 185 | Report assembly and LLM insight integration |
| `src/analytics/pdf_utils.py` | 35 | PDF generation utilities |
| `src/api/routers/admin.py` | 105 | Admin dashboard API endpoints |
| `src/api/routers/chat.py` | 173 | AI assistant chatbot API |
| `src/api/routers/reports_router.py` | 450+ | Report generation, history, PDF export |
| `src/api/routers/auth.py` | 189 | JWT authentication & registration |
| `src/db/database.py` | 578 | SQLite schema, CRUD operations, seeds |

### Frontend Files (Milestone 3)

| File | Size | Purpose |
|------|------|---------|
| `frontend/src/components/AdminPanel.tsx` | 38 KB | Admin dashboard (3 tabs) |
| `frontend/src/components/AIAssistantTab.tsx` | 8.8 KB | AI chat interface |
| `frontend/src/components/FormattedReportViewer.tsx` | 10.8 KB | Report viewer with Markdown |
| `frontend/src/services/api.ts` | 12.6 KB | All API client functions |
| `frontend/src/types/index.ts` | 5.7 KB | TypeScript type definitions |

### Configuration Files

| File | Purpose |
|------|---------|
| `frontend/tailwind.config.js` | TailwindCSS with typography plugin |
| `frontend/package.json` | Dependencies including react-markdown, remark-gfm |
| `data/yieldsense.db` | SQLite database (auto-created on startup) |

---

*End of Milestone 3 Documentation — YieldSense AI Platform v3.0*
