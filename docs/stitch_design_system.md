# YieldSense AI — Precision Agritech Design System (Stitch MCP Integration)

## 1. Project Reference & Metadata
- **Stitch Project Name**: `YieldSense AI Dashboard`
- **Stitch Project ID**: `projects/17329123023597349226`
- **Stitch URL**: `https://stitch.withgoogle.com/projects/17329123023597349226`
- **Design Theme**: **Precision Agritech** (`COLOR_MODE: LIGHT / DARK HYBRID`, `FONT: MANROPE`, `ROUNDNESS: ROUND_EIGHT`)

---

## 2. Color Palette & Token Definitions

### Base & Background Canvas
- **Canvas Base (`#EEFDF1` / `#0A130D`)**: Tinted organic green canvas reducing eye fatigue in sunlit field and dark control center environments.
- **Card Surface (`rgba(16, 30, 21, 0.75)` / `#FFFFFF`)**: High-contrast glassmorphic card container with hairline borders.
- **Border Rule (`rgba(16, 185, 129, 0.2)` / `#E2E8E0`)**: Structural framing border.

### Primary Domain Hues
- **Primary Crop / Biomass Green (`#1B5E3F` / `#10B981`)**: Vegetative vigor (NDVI), primary metrics, positive harvest indicators.
- **Harvest Gold Accent (`#C9922E` / `#F59E0B`)**: Yield forecast highlights, model variance bands, grain production alerts.
- **Atmospheric Blue (`#2B6CB0` / `#3B82F6`)**: Precipitation, soil moisture saturation, irrigation telemetry, evapotranspiration.
- **Pedological Brown (`#8D5B4C`)**: Soil organic matter, soil profile pH, tillage markers.
- **Warning / Risk Red (`#DC2626` / `#EF4444`)**: Crop disease alerts, thermal stress warnings, extreme acidity flags.

---

## 3. Typography & Numerical Formatting
- **Font Family**: **Manrope**, sans-serif (Google Fonts).
- **Tabular Numerical Figures**: Enforce `font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1;` on all yield metrics, rainfall amounts, soil pH values, and spatial coordinates to prevent horizontal layout jitter.

---

## 4. UI Screen Mapping & Components

1. **Main Operational Dashboard**: Metric KPI summary, farm telemetry feeds, active crop badges.
2. **Yield Prediction Engine**: 14-parameter input form, predicted kg/ha display, model comparison table.
3. **AI Recommendations & Risk Mitigation**: Groq LLM / Gemini AI real-time risk alerts and actionable agronomic advice.
4. **Weather & Climate Analytics**: Regional rainfall adequacy, temperature stress, humidity balance, sunlight exposure.
5. **Soil Analysis & Fertility**: Crop-aware pH suitability, Soil Health Index, moisture sufficiency.
6. **Dataset Explorer & EDA Analytics**: 500-record data grid, crop yield distribution charts, correlation heatmaps.
