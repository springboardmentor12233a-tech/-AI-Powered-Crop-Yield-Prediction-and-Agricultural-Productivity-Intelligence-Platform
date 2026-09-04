# YieldSense AI — Official Precision Agritech Design System & Theme Specification

## 1. Executive Reference & Metadata
- **Stitch Project Name**: `YieldSense AI Dashboard`
- **Stitch Project ID**: `projects/17329123023597349226`
- **Stitch URL**: `https://stitch.withgoogle.com/projects/17329123023597349226`
- **Theme Name**: **Precision Agritech**
- **Architecture Integration**: Mapped directly to Modules 1–7 in [`docs/system_architecture.md`](file:///c:/INFOSYS%207.0/docs/system_architecture.md)

---

## 2. Complete Design System Tokens (YAML Specification)

```yaml
name: Precision Agritech
colors:
  surface: '#eefdf1'
  surface-dim: '#cfded2'
  surface-bright: '#eefdf1'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e8f7eb'
  surface-container: '#e3f2e6'
  surface-container-high: '#ddece0'
  surface-container-highest: '#d7e6db'
  on-surface: '#121e17'
  on-surface-variant: '#404942'
  inverse-surface: '#26332b'
  inverse-on-surface: '#e6f5e9'
  outline: '#707972'
  outline-variant: '#bfc9c0'
  surface-tint: '#296a4a'
  primary: '#00452a'
  on-primary: '#ffffff'
  primary-container: '#1b5e3f'
  on-primary-container: '#93d5ae'
  inverse-primary: '#93d5ae'
  secondary: '#7f5700'
  on-secondary: '#ffffff'
  secondary-container: '#ffc159'
  on-secondary-container: '#744f00'
  tertiary: '#003d6f'
  on-tertiary: '#ffffff'
  tertiary-container: '#005496'
  on-tertiary-container: '#a2c9ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#aef1c8'
  primary-fixed-dim: '#93d5ae'
  on-primary-fixed: '#002112'
  on-primary-fixed-variant: '#085134'
  secondary-fixed: '#ffdead'
  secondary-fixed-dim: '#f9bc55'
  on-secondary-fixed: '#281900'
  on-secondary-fixed-variant: '#604100'
  tertiary-fixed: '#d3e4ff'
  tertiary-fixed-dim: '#a2c9ff'
  on-tertiary-fixed: '#001c38'
  on-tertiary-fixed-variant: '#004881'
  background: '#eefdf1'
  on-background: '#121e17'
  surface-variant: '#d7e6db'

typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 3rem
    fontWeight: '800'
    lineHeight: 3.5rem
    letterSpacing: -0.03em

  display-lg-mobile:
    fontFamily: Manrope
    fontSize: 2.25rem
    fontWeight: '800'
    lineHeight: 2.75rem
    letterSpacing: -0.025em

  display-metric:
    fontFamily: Manrope
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.5rem
    letterSpacing: -0.02em

  headline-xl:
    fontFamily: Manrope
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2.25rem
    letterSpacing: -0.02em

  headline-md:
    fontFamily: Manrope
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.015em

  headline-sm:
    fontFamily: Manrope
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.01em

  body-lg:
    fontFamily: Manrope
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.6rem
    letterSpacing: -0.005em

  body-md:
    fontFamily: Manrope
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.4rem
    letterSpacing: 0em

  body-sm:
    fontFamily: Manrope
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.15rem
    letterSpacing: 0.005em

  label-caps:
    fontFamily: Manrope
    fontSize: 0.6875rem
    fontWeight: '700'
    lineHeight: 0.9rem
    letterSpacing: 0.06em

  label-md:
    fontFamily: Manrope
    fontSize: 0.8125rem
    fontWeight: '600'
    lineHeight: 1.1rem
    letterSpacing: 0em

  label-badge:
    fontFamily: Manrope
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.01em

rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px

spacing:
  spacing-2xs: 0.25rem
  spacing-xs: 0.5rem
  spacing-sm: 0.75rem
  spacing-md: 1rem
  spacing-lg: 1.5rem
  spacing-xl: 2rem
  spacing-2xl: 3rem
  gutter-desktop: 1.5rem
  gutter-tablet: 1rem
  gutter-mobile: 0.75rem
  margin-desktop: 2rem
  margin-tablet: 1.5rem
  margin-mobile: 1rem
```

---

## 3. Architecture Module Mapping

Every component in this Stitch Design System map to the official 7-module platform specification in [`docs/system_architecture.md`](file:///c:/INFOSYS%207.0/docs/system_architecture.md):

1. **Module 1 (Data Collection)** $\rightarrow$ Raw Data Explorer grid, batch record telemetry pills.
2. **Module 2 (Data Preprocessing)** $\rightarrow$ Preprocessing status badges, outlier detection flags.
3. **Module 3 (Weather Analysis)** $\rightarrow$ Weather Analytics View, canopy temperature gauges, VPD metrics, wind inversion cards.
4. **Module 4 (Soil Analysis)** $\rightarrow$ Soil Health Index cards, crop-specific pH indicators, root zone moisture deficit sparklines.
5. **Module 5 (Yield Prediction Model)** $\rightarrow$ Model performance metric grid, $R^2$ & RMSE comparison cards, `best_model.pkl` badges.
6. **Module 6 (Prediction Outputs)** $\rightarrow$ Yield Predictor form, predicted kg/ha display (`display-metric`), productivity rating chips (`High`/`Medium`/`Low`).
7. **Module 7 (AI Recommendations & LLM)** $\rightarrow$ AI Mitigation Directives panel, phenology growth stage ribbon, spray window viability timelines, Groq/Gemini LLM cards.
