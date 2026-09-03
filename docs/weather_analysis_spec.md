# YieldSense AI — Weather Analytics Specification

## 1. Status & Data Claim
- **Status Claim**: **Dataset-based Weather Analytics**
- **Data Source**: `datasets/processed/cleaned_crop_yield.csv`
- **Real-Time Disclaimer**: This module performs statistical calculations over historical dataset telemetry and does NOT claim live real-time API streaming.

---

## 2. Weather Analytics Scoring Methodology

1. **Rainfall Adequacy Score (0–100)**:
   - Optimal benchmark: 150mm – 250mm $\rightarrow$ 95.0
   - Moderate benchmark: 100mm – 150mm / 250mm – 300mm $\rightarrow$ 80.0
   - Sub-optimal benchmark: 50mm – 100mm / 300mm – 400mm $\rightarrow$ 60.0
   - Severe deficit / flood $\rightarrow$ 40.0

2. **Temperature Stress Risk (0–100)**:
   - Optimal growing window: 20°C – 30°C $\rightarrow$ Low Stress (15.0)
   - Mild stress window: 15°C – 20°C / 30°C – 35°C $\rightarrow$ Moderate Stress (45.0)
   - Extreme stress window: $<15°C$ or $>35°C$ $\rightarrow$ High Stress (80.0)

3. **Humidity Balance Score (0–100)**:
   - Balanced window: 50% – 70% $\rightarrow$ 90.0
   - Moderate window: 40% – 50% / 70% – 80% $\rightarrow$ 75.0
   - Dry / Excessive humidity $\rightarrow$ 55.0

4. **Sunlight Exposure Score (0–100)**:
   - Optimal solar radiation: 6 – 9 hrs/day $\rightarrow$ 92.0
   - Moderate solar radiation: 4 – 6 / 9 – 11 hrs/day $\rightarrow$ 78.0
   - Low solar exposure $\rightarrow$ 60.0

5. **Overall Weather Impact Score (0–100)**:
   $$\text{Overall Score} = (\text{Rainfall} \times 0.35) + ((100 - \text{TempStress}) \times 0.30) + (\text{Humidity} \times 0.20) + (\text{Sunlight} \times 0.15)$$

---

## 3. Regional Coverage & API Endpoint
- **Available Regions**: `North India`, `South India`, `South USA`, `Central USA`, `East Africa`
- **FastAPI Endpoint**: `GET /api/weather/analysis?region=<region>`
- **Output Artifact**: `datasets/processed/weather_analytics.json`
