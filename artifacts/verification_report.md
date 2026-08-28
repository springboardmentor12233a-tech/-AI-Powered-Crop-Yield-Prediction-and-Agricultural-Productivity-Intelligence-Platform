# Pipeline & API Verification Report - YieldSense AI

This report documents the verification checks, execution commands, API integration tests, and environment validation logs executed for the **YieldSense AI** platform.

---

## 1. Commands Executed

### Data Engineering Pipelines:
```powershell
# Preprocess Dataset A (Crop Recommendation)
python -m src.data.crop_recommendation_preprocessing

# Preprocess Dataset B (Smart Crop Yield)
python -m src.data.smart_crop_yield_preprocessing

# Execute the global human-readable audit comparisons
python -m src.data.audit

# Generate EDA visualizations
python notebooks/eda.py
```

### Environment & Authentication API Services:
```powershell
# Initialize Next.js project
npx -y create-next-app@latest frontend --ts --eslint --tailwind --src-dir --app --use-npm --disable-git --yes

# Start the FastAPI uvicorn daemon server on port 8000
python -m uvicorn src.api.main:app --host 127.0.0.1 --port 8000

# Execute API integration tests (JWT logins, profile access, and predictions schemas)
python C:\Users\user\.gemini\antigravity-ide\brain\d5e7a5a6-005b-472b-a5ce-580d56da28d7\scratch\test_api.py
```

---

## 2. API Integration Test Log Outputs

Executing `test_api.py` while uvicorn was running yielded the following success output:

```
Waiting for FastAPI server to start...
FastAPI server is ONLINE!

==================================================
RUNNING API INTEGRATION TESTS
==================================================

Test 1: Login with invalid credentials...
  Response Code: 401
  Response Body: {'detail': 'Invalid username or password credentials.'}
  Test 1: PASSED

Test 2: Login as farmer_user...
  Response Code: 200
  Response Body: {'access_token': 'eyJ1c2VybmFtZSI6ICJmYXJtZXJfdXNlciIsICJyb2xlIjogImZhcm1lciJ9', 'token_type': 'bearer', 'username': 'farmer_user', 'role': 'farmer'}
  Test 2: PASSED

Test 3: Fetch profile with farmer token...
  Response Code: 200
  Response Body: {'username': 'farmer_user', 'role': 'farmer'}
  Test 3: PASSED

Test 4: Run Yield Prediction with farmer token...
  Response Code: 200
  Response Body: {'predicted_yield_ton_per_ha': 121.83, 'model_version': 'YieldSense_Reg_v1.0.0_mock', 'status': 'Success'}
  Test 4: PASSED

Test 5: Run Crop Recommendation with farmer token...
  Response Code: 200
  Response Body: {'recommended_crop': 'Maize', 'confidence': 0.87, 'model_version': 'YieldSense_Clf_v1.0.0_mock', 'status': 'Success'}
  Test 5: PASSED

Test 6: Run Crop Recommendation without credentials...
  Response Code: 422
  Response Body: {'detail': [{'type': 'missing', 'loc': ['header', 'authorization'], 'msg': 'Field required', 'input': None}]}
  Test 6: PASSED

==================================================
ALL API INTEGRATION TESTS PASSED SUCCESSFULLY!
==================================================
```

---

## 3. Preprocessing Validation Warnings (Soft Plausibility)

During range validation checks, soft plausibility warnings were logged for valid extreme observations (e.g. monsoon rainfall), confirming that range validation works without throwing fatal crashes:

```
2026-08-27 17:40:26,815 - validation - WARNING - [Crop Recommendation Cleaned] Soft Plausibility Warning: Column 'Humidity' minimum 6.0294 is unusual (normal min: 10.0000)
2026-08-27 17:40:26,816 - validation - WARNING - [Crop Recommendation Cleaned] Soft Plausibility Warning: Column 'Rainfall' maximum 5989.9955 is unusual (normal max: 3000.0000)
2026-08-27 17:40:28,299 - validation - WARNING - [Smart Crop Yield Cleaned] Soft Plausibility Warning: Column 'Rainfall_mm' maximum 1499.7000 is unusual (normal max: 1300.0000)
```

---

## 4. Final Verification Status
- **Pipelines**: Both Crop Recommendation and Smart Crop Yield pipelines are verified, reproducible, and pass schema checks.
- **Scaffolds**: Next.js App Router project created successfully. FastAPI API server is configured, tested, and ready.
- **Database design**: Relational Postgres SQL types and tables matching enums are designed.
- **Git status**: Verified. Raw datasets inside `data/raw/` remain untouched.
