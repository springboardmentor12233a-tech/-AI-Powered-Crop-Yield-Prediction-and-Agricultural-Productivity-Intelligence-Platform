# YieldSense AI — Soil Analytics Specification

## 1. Status & Data Claim
- **Status Claim**: **Dataset-based Crop-Aware Soil Analytics**
- **Data Source**: `datasets/processed/cleaned_crop_yield.csv`

---

## 2. Crop-Aware Soil pH Rule
Universal pH ranges (e.g. 6.0–7.2) are NOT applied blindly across all crops. Soil pH suitability is calculated against specific crop agronomic requirements:

| Crop Species | Optimal Soil pH Range | Ideal Benchmark pH |
| :--- | :---: | :---: |
| **Rice** | **5.5 – 6.8** | 6.0 |
| **Wheat** | **6.0 – 7.5** | 6.5 |
| **Maize** | **5.8 – 7.2** | 6.5 |
| **Soybean** | **6.0 – 7.0** | 6.5 |
| **Cotton** | **5.8 – 7.5** | 6.8 |

---

## 3. Soil Health Index Methodology
The **Soil Health Index (0.0 – 1.0)** is calculated as a composite score:
$$\text{Soil Health Index} = (\text{pH\_Score} \times 0.35) + (\text{Moisture\_Score} \times 0.35) + (\text{NDVI\_Score} \times 0.30)$$

- **Fertility Rating Tiers**:
  - $\ge 0.70$: **High Fertility**
  - $0.50 – 0.69$: **Moderate Fertility**
  - $< 0.50$: **Low Fertility**

---

## 4. API Endpoint & Output Artifact
- **FastAPI Endpoint**: `GET /api/soil/assessment?crop_type=<crop>`
- **Output Artifact**: `datasets/processed/soil_analytics.json`
