import os
import sys
import re
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.services.prediction_service import PredictionService
from backend.app.services.analytics_service import AnalyticsService


class ChatbotService:
    """
    AgriSense AI Chatbot Engine for YieldSense AI.
    Provides intelligent, accurate agronomic guidance, crop management tips,
    soil & fertilizer advice, weather insights, and ML model explanations.
    Grounded strictly in verified agricultural principles and project dataset facts.
    """

    def __init__(self):
        self.prediction_service = PredictionService()
        self.analytics_service = AnalyticsService()
        self._init_knowledge_base()

    def _init_knowledge_base(self):
        """Knowledge base of crops, soils, fertilizers, and agronomic guidelines."""
        self.crop_guides = {
            "soybean": {
                "name": "Soybean (Glycine max)",
                "season": "Kharif (June - October)",
                "ideal_soil": "Loamy and Well-drained Black soils",
                "ideal_ph": "6.0 - 7.0",
                "rainfall": "100 - 180 mm",
                "temperature": "25 C - 32 C",
                "npk": "N: 20-40 kg/ha (fixes its own nitrogen), P: 60-80 kg/ha, K: 40-60 kg/ha",
                "fertilizer": "DAP or NPK with Rhizobium seed inoculation",
                "tips": "Inoculate seeds with Rhizobium japonicum before sowing. Avoid waterlogging during flowering and pod development stages."
            },
            "wheat": {
                "name": "Wheat (Triticum aestivum)",
                "season": "Rabi (November - April)",
                "ideal_soil": "Loamy and Clay Loam soils",
                "ideal_ph": "6.0 - 7.5",
                "rainfall": "150 - 250 mm (or 4-6 scheduled irrigations)",
                "temperature": "15 C - 25 C during growth, 28 C - 30 C at harvest",
                "npk": "N: 100-120 kg/ha, P: 50-60 kg/ha, K: 40-50 kg/ha",
                "fertilizer": "Urea (split doses) + DAP (basal)",
                "tips": "Critical irrigation stages are Crown Root Initiation (21 days after sowing) and Flowering. Guard against terminal heat stress with early sowing."
            },
            "rice": {
                "name": "Rice / Paddy (Oryza sativa)",
                "season": "Kharif and Rabi (where irrigated)",
                "ideal_soil": "Clayey, Clay Loam, and Alluvial soils with high water retention",
                "ideal_ph": "5.5 - 7.0",
                "rainfall": "200 - 300+ mm",
                "temperature": "24 C - 35 C",
                "npk": "N: 100-150 kg/ha, P: 50-60 kg/ha, K: 50-60 kg/ha",
                "fertilizer": "Urea + DAP + Zinc Sulphate",
                "tips": "Maintain 2-5 cm standing water during tillering and panicle initiation. Apply Zinc Sulphate (25 kg/ha) if deficiency occurs."
            },
            "cotton": {
                "name": "Cotton (Gossypium)",
                "season": "Kharif (May - October)",
                "ideal_soil": "Deep Black soil (Regur) and well-drained Sandy Loam",
                "ideal_ph": "6.5 - 8.0",
                "rainfall": "120 - 250 mm",
                "temperature": "28 C - 37 C",
                "npk": "N: 90-120 kg/ha, P: 45-60 kg/ha, K: 45-60 kg/ha",
                "fertilizer": "NPK + Foliar Potassium sprays during boll formation",
                "tips": "Deep taproot system requires deep tilled soil. Avoid water stagnation to prevent boll rot and wilt disease."
            },
            "maize": {
                "name": "Maize / Corn (Zea mays)",
                "season": "Kharif, Rabi & Spring",
                "ideal_soil": "Well-drained Loamy soil rich in organic matter",
                "ideal_ph": "5.8 - 7.2",
                "rainfall": "120 - 220 mm",
                "temperature": "20 C - 32 C",
                "npk": "N: 100-120 kg/ha, P: 60 kg/ha, K: 40 kg/ha",
                "fertilizer": "DAP (basal) + Urea top-dress at knee-high and tasseling stages",
                "tips": "Very sensitive to both drought during silking and waterlogging at early growth. Keep fields drained."
            },
            "groundnut": {
                "name": "Groundnut / Peanut (Arachis hypogaea)",
                "season": "Kharif and Summer",
                "ideal_soil": "Light Sandy Loam and Red Sandy soil",
                "ideal_ph": "6.0 - 6.8",
                "rainfall": "100 - 180 mm",
                "temperature": "25 C - 32 C",
                "npk": "N: 20-30 kg/ha, P: 40-50 kg/ha, K: 40-60 kg/ha + Gypsum",
                "fertilizer": "DAP + Gypsum (200-400 kg/ha at flowering/pegging)",
                "tips": "Gypsum provides Calcium and Sulphur vital for pod filling and kernel development without empty shells (pops)."
            },
            "sugarcane": {
                "name": "Sugarcane (Saccharum officinarum)",
                "season": "Perennial / Annual (Autumn or Spring planting)",
                "ideal_soil": "Deep Loamy and Heavy Clay soils",
                "ideal_ph": "6.5 - 7.5",
                "rainfall": "200 - 300 mm (Requires regular irrigation)",
                "temperature": "26 C - 35 C",
                "npk": "N: 150-250 kg/ha, P: 60-80 kg/ha, K: 60-80 kg/ha",
                "fertilizer": "NPK + Urea split into 3-4 applications",
                "tips": "Trash mulching between rows saves 20-30% irrigation water and suppresses weed growth."
            },
            "barley": {
                "name": "Barley (Hordeum vulgare)",
                "season": "Rabi",
                "ideal_soil": "Sandy Loam to Loamy soil (Moderately tolerant to salinity)",
                "ideal_ph": "6.5 - 8.0",
                "rainfall": "100 - 180 mm",
                "temperature": "15 C - 28 C",
                "npk": "N: 60-80 kg/ha, P: 30-40 kg/ha, K: 30-40 kg/ha",
                "fertilizer": "DAP + Urea",
                "tips": "Highly drought-hardy and salt-tolerant cereal. Ideal alternate crop in semi-arid soils."
            },
            "pulses": {
                "name": "Pulses / Legumes (Chickpea, Pigeonpea, Moong)",
                "season": "Kharif and Rabi",
                "ideal_soil": "Well-drained Loamy and Black soils",
                "ideal_ph": "6.2 - 7.5",
                "rainfall": "80 - 160 mm",
                "temperature": "20 C - 30 C",
                "npk": "N: 20-25 kg/ha, P: 40-50 kg/ha, K: 20-30 kg/ha",
                "fertilizer": "DAP or SSP + Biofertilizers (Rhizobium + PSB)",
                "tips": "Fixes atmospheric nitrogen to enrich soil for succeeding cereal crops. Avoid excess Nitrogen fertilization."
            },
            "tea": {
                "name": "Tea (Camellia sinensis)",
                "season": "Perennial Plantation",
                "ideal_soil": "Well-drained Acidic Red / Loamy soil rich in humus",
                "ideal_ph": "4.5 - 5.5 (Acidic)",
                "rainfall": "200 - 300+ mm",
                "temperature": "18 C - 30 C",
                "npk": "N: 100-140 kg/ha, P: 30-40 kg/ha, K: 80-100 kg/ha",
                "fertilizer": "Ammonium Sulphate + NPK + Organic compost",
                "tips": "Requires acidic soil pH. Do not apply lime unless pH drops below 4.0."
            },
            "coffee": {
                "name": "Coffee (Coffea arabica / robusta)",
                "season": "Perennial Shade Plantation",
                "ideal_soil": "Deep, porous, rich Red Loamy soil",
                "ideal_ph": "5.5 - 6.5",
                "rainfall": "150 - 250 mm",
                "temperature": "18 C - 28 C (Frost-sensitive)",
                "npk": "N: 100-120 kg/ha, P: 60-80 kg/ha, K: 100-120 kg/ha",
                "fertilizer": "NPK + Farmyard Manure (FYM)",
                "tips": "Requires two-tier shade tree canopy and blossom showers (25-40mm) in March-April for synchronized flowering."
            },
            "jute": {
                "name": "Jute (Golden Fibre - Corchorus)",
                "season": "Kharif (Pre-monsoon sowing in March-April)",
                "ideal_soil": "Alluvial, Loamy, and Clay soils",
                "ideal_ph": "6.0 - 7.2",
                "rainfall": "160 - 280 mm",
                "temperature": "24 C - 36 C with high relative humidity",
                "npk": "N: 40-60 kg/ha, P: 20-30 kg/ha, K: 20-30 kg/ha",
                "fertilizer": "Urea + NPK",
                "tips": "Harvest at 50% flowering stage (120-135 days) to obtain premium fine fiber strength."
            }
        }

    def generate_response(
        self,
        query: str,
        context: Optional[Dict[str, Any]] = None,
        history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Processes user question, matches agronomic intent, integrates dataset/model facts,
        and constructs an authoritative, farmer-friendly answer.
        """
        q = query.strip().lower()
        now = datetime.now(timezone.utc)

        # 1. Check for context-specific parameters (e.g. if passed from Yield Prediction page)
        ctx_crop = context.get("Crop", "").lower() if context else ""
        ctx_soil = context.get("Soil_Type", "") if context else ""
        ctx_ph = context.get("Soil_pH", None) if context else None
        ctx_rain = context.get("Rainfall_mm", None) if context else None
        ctx_temp = context.get("Temperature_C", None) if context else None

        # -------------------------------------------------------------
        # Intent: Model & System Information / Accuracy
        # -------------------------------------------------------------
        if any(w in q for w in ["model", "accuracy", "r2", "r^2", "rmse", "mae", "algorithm", "linear regression", "machine learning", "training"]):
            meta = self.prediction_service.get_metadata()
            perf = meta.get("performance_metrics", {})
            ds = meta.get("dataset_summary", {})
            reply = (
                f"### [YieldSense AI Model Specifications]\n\n"
                f"Our crop yield forecasting engine uses a verified **Linear Regression** model (v2.0.0) trained on a curated agricultural dataset of **1,500 records** (1,200 training samples, 300 held-out test samples).\n\n"
                f"**Key Performance Metrics on 300 Test Samples:**\n"
                f"- **Model Algorithm**: Linear Regression (Selected for lowest test RMSE & MAE)\n"
                f"- **Test MAE (Mean Absolute Error)**: `4,273.23 kg/acre`\n"
                f"- **Test RMSE (Root Mean Squared Error)**: `11,381.99 kg/acre`\n"
                f"- **Test R2 Score**: `0.0029` (Baseline linear relationship)\n"
                f"- **Total Raw Input Features**: `11` (State, Crop, Soil Type, Fertilizer, N, P, K, Rainfall, Temperature, Soil pH, Year)\n"
                f"- **Transformed Feature Vector**: `43 encoded dimensions` using One-Hot Categorical Encoding and Standard Scaling.\n\n"
                f"**Compared Models During Training:**\n"
                f"1. Linear Regression (Selected as Best Deployment Model)\n"
                f"2. Random Forest Regressor (Train R2: 0.8392, Test RMSE: 11,867.55)\n"
                f"3. Gradient Boosting Regressor (Train R2: 0.9676, Test RMSE: 12,348.92)\n"
                f"4. Decision Tree Regressor (Train R2: 0.7318, Test RMSE: 13,268.03)\n"
            )
            suggestions = [
                "What features affect yield the most?",
                "How does the ML prediction work?",
                "What crops are supported in the dataset?",
                "How can I improve my predicted yield?"
            ]
            return {"reply": reply, "category": "model_info", "suggestions": suggestions, "timestamp": now}

        # -------------------------------------------------------------
        # Intent: Dataset Summary & Overview
        # -------------------------------------------------------------
        if any(w in q for w in ["dataset", "records", "data size", "how many rows", "supported crops", "supported states"]):
            reply = (
                "### [YieldSense AI Dataset Profile]\n\n"
                "The YieldSense AI platform is built upon **1,500 standardized agricultural observation records** spanning major agro-climatic zones across India.\n\n"
                "**Dataset Breakdown:**\n"
                "- **Total Records**: `1,500 records`\n"
                "- **Supported Crops (12)**: Barley, Coffee, Cotton, Groundnut, Jute, Maize, Pulses, Rice, Soybean, Sugarcane, Tea, Wheat.\n"
                "- **Soil Classifications (5)**: Black Soil, Clay Soil, Loamy Soil, Red Soil, Sandy Soil.\n"
                "- **Fertilizer Classes (5)**: Compost, DAP (Di-Ammonium Phosphate), NPK, Organic, Urea.\n"
                "- **Geographic Coverage (14 States)**: Andhra Pradesh, Bihar, Gujarat, Haryana, Karnataka, Kerala, Madhya Pradesh, Maharashtra, Odisha, Punjab, Rajasthan, Tamil Nadu, Uttar Pradesh, West Bengal.\n"
                "- **Environmental Parameters**: Soil pH (0-14), Nitrogen (N), Phosphorus (P), Potassium (K), Seasonal Rainfall (mm), and Temperature (C).\n"
            )
            suggestions = [
                "What is the best fertilizer for Soybean?",
                "Tell me about Wheat cultivation in Punjab",
                "What soil pH is best for crops?",
                "How do N-P-K nutrients impact yield?"
            ]
            return {"reply": reply, "category": "model_info", "suggestions": suggestions, "timestamp": now}

        # -------------------------------------------------------------
        # Intent: Specific Crop Cultivation & Advice
        # -------------------------------------------------------------
        matched_crop = None
        for crop_key in self.crop_guides:
            if crop_key in q or crop_key == ctx_crop:
                matched_crop = crop_key
                break

        if matched_crop:
            guide = self.crop_guides[matched_crop]
            reply = (
                f"### [Agronomic Guide for {guide['name']}]\n\n"
                f"- **Ideal Sowing Season**: {guide['season']}\n"
                f"- **Optimal Soil Type**: {guide['ideal_soil']}\n"
                f"- **Target Soil pH**: `{guide['ideal_ph']}`\n"
                f"- **Seasonal Moisture / Rainfall**: `{guide['rainfall']}`\n"
                f"- **Temperature Range**: `{guide['temperature']}`\n"
                f"- **Recommended Nutrient Schedule (N-P-K)**: `{guide['npk']}`\n"
                f"- **Primary Fertilizer**: `{guide['fertilizer']}`\n\n"
                f"**Expert Management Advice**:\n"
                f"{guide['tips']}\n"
            )

            # If user provided context on soil or pH, add custom advisory
            if ctx_ph is not None:
                try:
                    c_ph = float(ctx_ph)
                    if c_ph < 6.0:
                        reply += f"\n*Note for your plot*: Your current soil pH is `{c_ph:.2f}` (Acidic). Apply 500 kg/acre of agricultural lime to prevent nutrient lockout for {matched_crop.capitalize()}."
                    elif c_ph > 7.8:
                        reply += f"\n*Note for your plot*: Your current soil pH is `{c_ph:.2f}` (Alkaline). Incorporate compost or gypsum to enhance micronutrient uptake."
                except Exception:
                    pass

            suggestions = [
                f"What fertilizer is best for {matched_crop.capitalize()}?",
                f"How much rainfall does {matched_crop.capitalize()} need?",
                f"What is the optimal soil pH for {matched_crop.capitalize()}?",
                "How do I run a yield prediction?"
            ]
            return {"reply": reply, "category": "crop_advice", "suggestions": suggestions, "timestamp": now}

        # -------------------------------------------------------------
        # Intent: Soil pH and Soil Amendment
        # -------------------------------------------------------------
        if any(w in q for w in ["ph", "acidity", "alkalinity", "acidic", "alkaline", "lime", "gypsum"]):
            reply = (
                "### [Soil pH Management & Crop Productivity]\n\n"
                "Soil pH is a fundamental chemical indicator measuring the acidity or alkalinity of the soil solution, directly controlling **nutrient availability** to plant roots.\n\n"
                "**1. Soil pH Scale Categories:**\n"
                "- **Strongly Acidic (< 5.5)**: High risk of Aluminum and Manganese toxicity; Phosphorus becomes fixed and unavailable. Remedy: Apply Agricultural Lime (Calcium Carbonate) at 800-1,200 kg/acre.\n"
                "- **Slightly Acidic to Neutral (6.0 - 7.2) [OPTIMAL]**: Peak bioavailability of essential primary macronutrients (Nitrogen, Phosphorus, Potassium) and secondary nutrients.\n"
                "- **Alkaline / Sodic (> 7.8)**: High Calcium carbonate locks up micronutrients like Zinc, Iron, and Boron. Remedy: Apply Agricultural Gypsum (Calcium Sulfate) and organic compost.\n\n"
                "**Quick Rule of Thumb**:\n"
                "Most field crops (Wheat, Soybean, Cotton, Maize, Groundnut) flourish best at **pH 6.2 - 6.8**, while Tea requires acidic soil (**pH 4.5 - 5.5**).\n"
            )
            suggestions = [
                "How to increase soil pH for acidic soil?",
                "What is the ideal soil pH for Wheat?",
                "How does soil pH affect fertilizer absorption?",
                "What are N-P-K nutrient recommendations?"
            ]
            return {"reply": reply, "category": "soil_fertilizer", "suggestions": suggestions, "timestamp": now}

        # -------------------------------------------------------------
        # Intent: Fertilizers & Nutrients (N-P-K, Urea, DAP, Compost)
        # -------------------------------------------------------------
        if any(w in q for w in ["fertilizer", "fertilizers", "npk", "nitrogen", "phosphorus", "potassium", "urea", "dap", "compost", "organic"]):
            reply = (
                "### [Fertilizer Application & N-P-K Nutrient Guide]\n\n"
                "Balanced fertilization ensures vigorous crop growth without inducing lodging or nutrient runoff:\n\n"
                "**1. Primary Macronutrients (N-P-K):**\n"
                "- **Nitrogen (N)**: Powers vegetative growth, green foliage, and protein synthesis. Excess causes weak stems and lodging; Deficiency causes yellowing (chlorosis).\n"
                "- **Phosphorus (P)**: Stimulates early root elongation, strong root anchorage, and rapid flowering.\n"
                "- **Potassium (K)**: Builds disease resistance, drought tolerance, and grain/boll plumpness.\n\n"
                "**2. Common Fertilizers in YieldSense AI:**\n"
                "- **DAP (18-46-0)**: Premier basal fertilizer for root establishment during sowing.\n"
                "- **Urea (46% N)**: Fast-acting Nitrogen source. Apply in split doses (e.g. 50% basal, 25% at knee-high, 25% at flowering).\n"
                "- **NPK Complexes (e.g. 10:26:26 / 12:32:16)**: Balanced multi-nutrient blends.\n"
                "- **Compost / Organic Manure**: Improves cation exchange capacity, microbial biomass, and soil moisture holding.\n"
            )
            suggestions = [
                "When should I apply DAP vs Urea?",
                "What are the N-P-K requirements for Cotton?",
                "How does organic compost improve soil quality?",
                "How to prevent fertilizer leaching in sandy soil?"
            ]
            return {"reply": reply, "category": "soil_fertilizer", "suggestions": suggestions, "timestamp": now}

        # -------------------------------------------------------------
        # Intent: Weather, Rainfall, and Irrigation Management
        # -------------------------------------------------------------
        if any(w in q for w in ["rainfall", "rain", "weather", "temperature", "heat", "irrigation", "water", "drought"]):
            reply = (
                "### [Weather, Climate & Irrigation Advisory]\n\n"
                "Meteorological conditions heavily influence crop physiological processes and harvest yields:\n\n"
                "**1. Rainfall Management:**\n"
                "- **Low Rainfall (< 120 mm)**: Water stress limits photosynthesis. Practice mulching with crop residues to conserve root-zone moisture, and adopt drip irrigation to deliver water directly to root zones.\n"
                "- **Moderate Rainfall (120 - 220 mm)**: Optimal for most field crops (Soybean, Cotton, Groundnut, Maize).\n"
                "- **High Rainfall (> 220 mm)**: Water-intensive crops (Rice, Sugarcane, Jute) thrive. For non-paddy crops, construct field drainage channels to prevent root asphyxiation and collar rot.\n\n"
                "**2. Temperature Factors:**\n"
                "- **Heat Stress (> 35C)**: Accelerates evapotranspiration and can cause flower abortion in cotton and premature grain ripening in wheat.\n"
                "- **Optimal Temperature (22C - 32C)**: Peak metabolic efficiency for Kharif crops.\n"
            )
            suggestions = [
                "How much water does Rice need?",
                "How to protect Wheat from high temperatures?",
                "What are drip irrigation best practices?",
                "What is the best season for planting Maize?"
            ]
            return {"reply": reply, "category": "weather_irrigation", "suggestions": suggestions, "timestamp": now}

        # -------------------------------------------------------------
        # Intent: Yield Prediction Guidance
        # -------------------------------------------------------------
        if any(w in q for w in ["how to predict", "yield prediction", "how does prediction work", "forecast yield", "predict"]):
            reply = (
                "### [How to Forecast Crop Yield with YieldSense AI]\n\n"
                "You can generate precise yield estimates in a few simple steps:\n\n"
                "1. **Navigate to Yield Prediction** (`/predict` in the sidebar).\n"
                "2. **Select your Crop and Location**: Choose from 12 crops and 14 states.\n"
                "3. **Select Soil Type & Fertilizer**: Choose Loamy, Black, Red, Clay, or Sandy soil and your fertilizer applied.\n"
                "4. **Input Field Measurements**: Enter your Soil pH, N-P-K nutrient values (kg/ha), expected seasonal rainfall (mm), and temperature (C).\n"
                "5. **Click 'Predict Crop Yield'**: Our trained ML pipeline will transform the inputs and forecast your harvest in **kg/acre** and **tons/acre** with productivity rating and personalized recommendations.\n\n"
                "Tip: You can also link your forecast directly to a registered farm in your Farm Management tab to track field history over time!\n"
            )
            suggestions = [
                "Try a preset for Karnataka Soybean",
                "Try a preset for Punjab Wheat",
                "What ML model is used for predictions?",
                "How do I view my prediction history?"
            ]
            return {"reply": reply, "category": "yield_prediction", "suggestions": suggestions, "timestamp": now}

        # -------------------------------------------------------------
        # Default Agronomic Assistant Fallback
        # -------------------------------------------------------------
        reply = (
            "### [Welcome to AgriSense AI Assistant!]\n\n"
            "I am your dedicated Agricultural Intelligence Assistant on the YieldSense AI platform. I can help you with:\n\n"
            "- **Crop Cultivation Guides**: Specific agronomic requirements for 12 major crops (Soybean, Wheat, Rice, Cotton, Maize, etc.).\n"
            "- **Soil Health & pH Advisory**: Target soil pH, correcting acidity with lime, alkalinity management with gypsum.\n"
            "- **Fertilizer & N-P-K Recommendations**: Balanced nutrition, DAP vs. Urea split dosing, organic compost benefits.\n"
            "- **Weather & Irrigation Insights**: Rainfall impact, mitigating heat stress, drainage and moisture conservation.\n"
            "- **Machine Learning Predictions**: Explaining ML model accuracy (Linear Regression, MAE: 4,273 kg/ac, RMSE: 11,381 kg/ac).\n\n"
            "How can I assist your farming operations today?"
        )
        suggestions = [
            "What is the best fertilizer for Soybean?",
            "How does soil pH affect crop yield?",
            "What are the N-P-K requirements for Wheat?",
            "Explain the ML prediction model specs"
        ]
        return {"reply": reply, "category": "general_farming", "suggestions": suggestions, "timestamp": now}
